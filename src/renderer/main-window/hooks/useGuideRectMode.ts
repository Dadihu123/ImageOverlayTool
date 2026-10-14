import { useCallback, useMemo, useState } from "react";
import type { RefObject } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import {
    GUIDE_RECT_COLOR_DEFAULT,
    GUIDE_RECT_MIN_SIZE,
} from "../../../shared/constants/guide";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import type { GuideRect } from "../../../shared/types/Guide";
import type { Point } from "../../../shared/types/Point";
import { useAppStore } from "../../store/useAppStore";
import {
    selectAddGuideRect,
    selectCanvas,
    selectGuides,
    selectImageSets,
    selectInteractionMode,
    selectSelectedGuideRectId,
    selectSetInteractionMode,
    selectSetSelectedGuideRectId,
    selectUnit,
    selectUnitFactor,
    selectUpdateGuideRect,
} from "../../store/selectors";
import { getStagePointerWorld } from "../utils/stageCoords";
import { resolveGuideRectWorldRect } from "../utils/guideGeometry";
import { useGuideSnap } from "./useGuideSnap";
import type { WorldRect } from "../utils/stageCoords";

export interface GuideRectSnapIndicator {
    point: Point;
    pointer: Point;
    source: import("../utils/guideSnap").SnapSource;
}

/**
 * 参考枠の描画・選択・編集を担うフック。
 */
export const useGuideRectMode = (
    stageRef: RefObject<Konva.Stage | null>
) => {
    const guides = useAppStore(selectGuides);
    const imageSets = useAppStore(selectImageSets);
    const canvas = useAppStore(selectCanvas);
    const interactionMode = useAppStore(selectInteractionMode);
    const setInteractionMode = useAppStore(selectSetInteractionMode);
    const selectedGuideRectId = useAppStore(selectSelectedGuideRectId);
    const setSelectedGuideRectId = useAppStore(
        selectSetSelectedGuideRectId
    );
    const addGuideRect = useAppStore(selectAddGuideRect);
    const updateGuideRect = useAppStore(selectUpdateGuideRect);
    const unitFactor = useAppStore(selectUnitFactor);
    const unit = useAppStore(selectUnit);

    const [draftRect, setDraftRect] = useState<WorldRect | null>(null);
    const [snapIndicator, setSnapIndicator] =
        useState<GuideRectSnapIndicator | null>(null);

    const isGuideRectDrawMode = interactionMode === "guide_rect_draw";
    const isGuideRectSelectMode = interactionMode === "guide_rect_select";

    const anchorsByImageId = useMemo(() => {
        const map = new Map<string, AnchorPos>();
        for (const imageSet of imageSets) {
            if (imageSet.currentAnchorPos) {
                map.set(imageSet.id, imageSet.currentAnchorPos);
            }
        }
        return map;
    }, [imageSets]);

    const resolveRect = useCallback(
        (rect: GuideRect): WorldRect | null =>
            resolveGuideRectWorldRect(rect.shape, anchorsByImageId),
        [anchorsByImageId]
    );

    const { snap, gridStepX, gridStepY } = useGuideSnap({
        guides,
        dimensionLines: [],
        imageSets,
        scale: canvas.scale,
        axis: "both",
    });

    const getPointer = useCallback(
        () => getStagePointerWorld(stageRef.current),
        [stageRef]
    );

    const onStageMouseDown = useCallback(
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (e.target.getType() !== "Stage") {
                return;
            }
            if (!("button" in e.evt) || e.evt.button !== 0) {
                return;
            }

            if (isGuideRectSelectMode) {
                setSelectedGuideRectId(null);
                return;
            }

            if (!isGuideRectDrawMode) {
                return;
            }

            const raw = getPointer();
            if (!raw) {
                return;
            }

            const result = snap(raw);
            setDraftRect({
                x: result.point.x,
                y: result.point.y,
                width: 0,
                height: 0,
            });
            setSnapIndicator(
                result.primary
                    ? { point: result.point, pointer: raw, source: result.primary }
                    : null
            );
        },
        [
            getPointer,
            isGuideRectDrawMode,
            isGuideRectSelectMode,
            setSelectedGuideRectId,
            snap,
        ]
    );

    const onStageMouseMove = useCallback(() => {
        if (!draftRect) {
            return;
        }

        const raw = getPointer();
        if (!raw) {
            return;
        }

        const result = snap(raw);

        setSnapIndicator(
            result.primary
                ? { point: result.point, pointer: raw, source: result.primary }
                : null
        );

        setDraftRect((prev) =>
            prev
                ? {
                      ...prev,
                      width: result.point.x - prev.x,
                      height: result.point.y - prev.y,
                  }
                : prev
        );
    }, [draftRect, getPointer, snap]);

    const onMouseUp = useCallback(() => {
        setSnapIndicator(null);

        if (!draftRect) {
            return;
        }

        // ドラッグ方向によらず正の幅・高さに正規化する
        const normalized: WorldRect = {
            x: Math.min(draftRect.x, draftRect.x + draftRect.width),
            y: Math.min(draftRect.y, draftRect.y + draftRect.height),
            width: Math.abs(draftRect.width),
            height: Math.abs(draftRect.height),
        };

        if (
            normalized.width >= GUIDE_RECT_MIN_SIZE &&
            normalized.height >= GUIDE_RECT_MIN_SIZE
        ) {
            const rect: GuideRect = {
                id: crypto.randomUUID(),
                color: GUIDE_RECT_COLOR_DEFAULT,
                showSizeLabel: true,
                shape: { kind: "world", ...normalized },
            };
            addGuideRect(rect);
            setInteractionMode("guide_rect_select");
            setSelectedGuideRectId(rect.id);
        } else {
            setInteractionMode("guide_rect_draw");
        }

        setDraftRect(null);
    }, [
        addGuideRect,
        draftRect,
        setInteractionMode,
        setSelectedGuideRectId,
    ]);

    /** ドラフトを含めた描画用の矩形一覧 */
    const renderedRects = useMemo(() => {
        if (!draftRect) {
            return guides.rects;
        }
        const normalized: WorldRect = {
            x: Math.min(draftRect.x, draftRect.x + draftRect.width),
            y: Math.min(draftRect.y, draftRect.y + draftRect.height),
            width: Math.abs(draftRect.width),
            height: Math.abs(draftRect.height),
        };
        const draft: GuideRect = {
            id: "__draft__",
            color: GUIDE_RECT_COLOR_DEFAULT,
            showSizeLabel: true,
            shape: { kind: "world", ...normalized },
        };
        return [...guides.rects, draft];
    }, [draftRect, guides.rects]);

    return {
        isGuideRectDrawMode,
        isGuideRectSelectMode,
        selectedGuideRectId,
        setSelectedGuideRectId,
        rects: renderedRects,
        anchorsByImageId,
        resolveRect,
        updateGuideRect,
        snapIndicator,
        gridStepX,
        gridStepY,
        unitFactor,
        unit,
        onMouseDown: onStageMouseDown,
        onMouseMove: onStageMouseMove,
        onMouseUp,
    };
};
