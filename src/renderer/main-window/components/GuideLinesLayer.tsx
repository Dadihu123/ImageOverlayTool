import React, { memo, useCallback, useRef } from "react";
import Konva from "konva";
import { Line } from "react-konva";

import type { GuideLinesConfig } from "../../../shared/types/Guide";
import type { WorldRect } from "../utils/stageCoords";
import { getStageScale, getVisibleWorldRect } from "../utils/stageCoords";
import {
    GUIDE_GRID_DRAW_MARGIN_FACTOR,
} from "../../../shared/constants/guide";

interface GuideLinesLayerProps {
    lines: GuideLinesConfig;
    stageRef: React.RefObject<Konva.Stage | null>;
    /** 編集モードではドラッグ可能にする */
    isEditMode: boolean;
    onMoveLine: (axis: "x" | "y", index: number, value: number) => void;
    /** 選択中の線 */
    selected?: { axis: "x" | "y"; index: number } | null;
    onSelect?: (target: { axis: "x" | "y"; index: number } | null) => void;
}

/**
 * 単独の参考線レイヤー。
 *
 * 画面外まで伸ばして描画するため、線ごとに視口サイズを計算する。
 * 本数はユーザーが指定するため、グリッドのような LOD 間引きは行わない。
 */
export const GuideLinesLayer = memo(function GuideLinesLayer({
    lines,
    stageRef,
    isEditMode,
    onMoveLine,
    selected = null,
    onSelect,
}: GuideLinesLayerProps) {
    "use no memo";

    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const resolveViewport = useCallback((): {
        rect: WorldRect;
        scale: number;
    } | null => {
        const stage = stageRef.current;
        if (!stage) {
            return null;
        }
        const rect = getVisibleWorldRect(stage);
        const margin =
            Math.max(rect.width, rect.height) * GUIDE_GRID_DRAW_MARGIN_FACTOR;
        return {
            rect: {
                x: rect.x - margin,
                y: rect.y - margin,
                width: rect.width + margin * 2,
                height: rect.height + margin * 2,
            },
            scale: getStageScale(stage),
        };
    }, [stageRef]);

    if (!lines.enabled || (lines.xs.length === 0 && lines.ys.length === 0)) {
        return null;
    }

    const viewport = resolveViewport();
    if (!viewport) {
        return null;
    }

    const { rect, scale } = viewport;
    const strokeWidth = lines.lineWidth / scale;

    const renderLine = (
        axis: "x" | "y",
        value: number,
        index: number
    ) => {
        const isSelected =
            selected?.axis === axis && selected?.index === index;

        const points =
            axis === "x"
                ? [value, rect.y, value, rect.y + rect.height]
                : [rect.x, value, rect.x + rect.width, value];

        return (
            <Line
                key={`${axis}-${index}-${value}`}
                points={points}
                stroke={lines.color}
                strokeWidth={isSelected ? strokeWidth * 2 : strokeWidth}
                opacity={lines.opacity}
                draggable={isEditMode}
                hitStrokeWidth={12 / scale}
                onMouseDown={(e) => {
                    if (!isEditMode) {
                        return;
                    }
                    dragStartRef.current = { x: e.target.x(), y: e.target.y() };
                    onSelect?.({ axis, index });
                    e.cancelBubble = true;
                }}
                onDragEnd={(e) => {
                    const start = dragStartRef.current;
                    dragStartRef.current = null;
                    if (!start) {
                        return;
                    }

                    // Konva はノード自体を動かすので、差分を座標へ反映してから戻す
                    const delta = axis === "x" ? e.target.x() : e.target.y();
                    e.target.x(0);
                    e.target.y(0);
                    onMoveLine(axis, index, value + delta);
                }}
                strokeScaleEnabled={false}
                perfectDrawEnabled={false}
                data-testid={`guide.line.${axis}.${index}`}
            />
        );
    };

    return (
        <>
            {lines.xs.map((value, index) => renderLine("x", value, index))}
            {lines.ys.map((value, index) => renderLine("y", value, index))}
        </>
    );
});
