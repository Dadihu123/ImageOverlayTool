import React, { memo, useCallback, useEffect, useRef } from "react";
import Konva from "konva";
import { Shape } from "react-konva";

import {
    GUIDE_GRID_DRAW_MARGIN_FACTOR,
    GUIDE_GRID_HIDE_SCREEN_SPACING,
    GUIDE_GRID_MIN_SCREEN_SPACING,
} from "../../../shared/constants/guide";
import type { GridConfig } from "../../../shared/types/Guide";
import {
    enumerateGridLines,
    expandWorldRect,
    resolveGridStep,
} from "../utils/guideGeometry";
import {
    getStageScale,
    getVisibleWorldRect,
    type WorldRect,
} from "../utils/stageCoords";

interface GuideGridLayerProps {
    grid: GridConfig;
    stageRef: React.RefObject<Konva.Stage | null>;
}

interface GridFrame {
    rect: WorldRect;
    stepX: number;
    stepY: number;
    originX: number;
    originY: number;
    scale: number;
}

/**
 * 描画フレーム（表示範囲・実効間隔・原点）をステージから直接求める。
 *
 * 視口を React の state ではなくステージから読むことで、パン/ズーム中でも
 * 再レンダリングなしに常に正しい範囲を描ける。
 */
const resolveGridFrame = (
    stage: Konva.Stage,
    grid: GridConfig
): GridFrame | null => {
    const scale = getStageScale(stage);
    const viewport = getVisibleWorldRect(stage);

    const isScreenLocked = grid.layer === "screenLocked";

    // screenLocked の場合は画面基準の間隔をワールド長へ換算する
    const baseSpacingX = isScreenLocked ? grid.spacingX / scale : grid.spacingX;
    const baseSpacingY = isScreenLocked ? grid.spacingY / scale : grid.spacingY;

    const stepX = resolveGridStep(
        baseSpacingX,
        scale,
        GUIDE_GRID_MIN_SCREEN_SPACING
    );
    const stepY = resolveGridStep(
        baseSpacingY,
        scale,
        GUIDE_GRID_MIN_SCREEN_SPACING
    );

    if (!Number.isFinite(stepX) || stepX <= 0) {
        return null;
    }
    if (!Number.isFinite(stepY) || stepY <= 0) {
        return null;
    }

    // 画面間隔が下限未満ならグリッド自体を隠す
    if (
        stepX * scale < GUIDE_GRID_HIDE_SCREEN_SPACING ||
        stepY * scale < GUIDE_GRID_HIDE_SCREEN_SPACING
    ) {
        return null;
    }

    // screenLocked では原点を画面原点（ワールド座標）に固定する
    const originX = isScreenLocked ? viewport.x : grid.origin.x;
    const originY = isScreenLocked ? viewport.y : grid.origin.y;

    const margin =
        Math.max(viewport.width, viewport.height) *
        GUIDE_GRID_DRAW_MARGIN_FACTOR;

    return {
        rect: expandWorldRect(viewport, margin),
        stepX,
        stepY,
        originX,
        originY,
        scale,
    };
};

/**
 * 参考グリッドの描画レイヤー。
 *
 * 線ごとにノードを作らず、単一の Shape の sceneFunc で一括描画する。
 * 線幅は scale で割ることで画面上の太さを一定に保つ
 * （独自 sceneFunc 内の ctx.stroke() では Konva の strokeScaleEnabled が効かないため、
 *   等価な処理を自前で行っている）。
 */
export const GuideGridLayer = memo(function GuideGridLayer({
    grid,
    stageRef,
}: GuideGridLayerProps) {
    "use no memo";

    const shapeRef = useRef<Konva.Shape>(null);

    const sceneFunc = useCallback(
        (context: Konva.Context) => {
            const stage = stageRef.current;
            if (!stage) {
                return;
            }

            const frame = resolveGridFrame(stage, grid);
            if (!frame) {
                return;
            }

            const { rect, stepX, stepY, originX, originY, scale } = frame;

            // 画面上で一定の太さにするためワールド長へ換算する
            const majorWidth = grid.lineWidth / scale;
            const minorWidth = Math.max(majorWidth * 0.6, 0.5 / scale);

            const subdivisions = Math.max(1, Math.round(grid.subdivisions));
            const minorStepX = stepX / subdivisions;
            const minorStepY = stepY / subdivisions;

            const showMinor =
                subdivisions > 1 &&
                minorStepX * scale >= GUIDE_GRID_MIN_SCREEN_SPACING &&
                minorStepY * scale >= GUIDE_GRID_MIN_SCREEN_SPACING;

            const majorXs = enumerateGridLines(
                rect.x,
                rect.x + rect.width,
                originX,
                stepX
            );
            const majorYs = enumerateGridLines(
                rect.y,
                rect.y + rect.height,
                originY,
                stepY
            );

            context.save();

            // --- 細線 ---
            if (showMinor) {
                const minorXs = enumerateGridLines(
                    rect.x,
                    rect.x + rect.width,
                    originX,
                    minorStepX
                );
                const minorYs = enumerateGridLines(
                    rect.y,
                    rect.y + rect.height,
                    originY,
                    minorStepY
                );

                if (minorXs.length > 0 || minorYs.length > 0) {
                    context.setAttr("strokeStyle", grid.minorColor);
                    context.setAttr(
                        "globalAlpha",
                        grid.opacity * 0.5
                    );
                    context.setAttr("lineWidth", minorWidth);
                    context.beginPath();
                    for (const x of minorXs) {
                        context.moveTo(x, rect.y);
                        context.lineTo(x, rect.y + rect.height);
                    }
                    for (const y of minorYs) {
                        context.moveTo(rect.x, y);
                        context.lineTo(rect.x + rect.width, y);
                    }
                    context.stroke();
                }
            }

            // --- 主線 ---
            if (majorXs.length > 0 || majorYs.length > 0) {
                context.setAttr("strokeStyle", grid.color);
                context.setAttr("globalAlpha", grid.opacity);
                context.setAttr("lineWidth", majorWidth);
                context.beginPath();
                for (const x of majorXs) {
                    context.moveTo(x, rect.y);
                    context.lineTo(x, rect.y + rect.height);
                }
                for (const y of majorYs) {
                    context.moveTo(rect.x, y);
                    context.lineTo(rect.x + rect.width, y);
                }
                context.stroke();
            }

            context.restore();
        },
        [grid, stageRef]
    );

    // パン/ズーム中は React を経由せず直接再描画する
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        const redraw = () => {
            shapeRef.current?.getLayer()?.batchDraw();
        };

        stage.on("dragmove.guideGrid", redraw);
        stage.on("wheel.guideGrid", redraw);

        return () => {
            stage.off("dragmove.guideGrid", redraw);
            stage.off("wheel.guideGrid", redraw);
        };
    }, [stageRef]);

    if (!grid.enabled) {
        return null;
    }

    return (
        <Shape
            ref={shapeRef}
            sceneFunc={sceneFunc}
            listening={false}
            perfectDrawEnabled={false}
            data-testid="guide.grid.shape"
        />
    );
});
