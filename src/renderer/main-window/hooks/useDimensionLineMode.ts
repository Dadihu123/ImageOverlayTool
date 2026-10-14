import { useCallback, RefObject, useMemo, useState } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useAppStore } from "../../store/useAppStore";
import {
    selectAddDimensionLine,
    selectCanvas,
    selectDimensionLines,
    selectGuides,
    selectImageSets,
    selectInteractionMode,
    selectSelectedDimensionLineId,
    selectSetInteractionMode,
    selectSetSelectedDimensionLineId,
    selectUnit,
    selectUnitFactor,
    selectUpdateDimensionLine,
} from "../../store/selectors";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { MIN_DIMENSION_LINE_DISTANCE } from "../../constants";
import { useDimensionKeyboard } from "./useDimensionKeyboard";
import { DIMENSION_LINE_COLOR_DEFAULT } from "../../../shared/constants/dimensionLine";
import { isDimensionInteractionMode } from "../../../shared/types/InteractionMode";
import type { Point } from "../../../shared/types/Point";
import type { DimensionConstraint } from "../../../shared/types/Guide";
import { useGuideSnap } from "./useGuideSnap";
import type { SnapSource } from "../utils/guideSnap";
import { getStagePointerWorld } from "../utils/stageCoords";

export interface DimensionSnapIndicator {
    point: Point;
    pointer: Point;
    source: SnapSource;
}

const applyConstraint = (
    start: Point,
    end: Point,
    constraint: DimensionConstraint
): Point => {
    if (constraint === "horizontal") {
        return { x: end.x, y: start.y };
    }
    if (constraint === "vertical") {
        return { x: start.x, y: end.y };
    }
    return end;
};

export const useDimensionLineMode = (
    stageRef: RefObject<Konva.Stage | null>
) => {
    const dimensionLines = useAppStore(selectDimensionLines);
    const guides = useAppStore(selectGuides);
    const imageSets = useAppStore(selectImageSets);
    const canvas = useAppStore(selectCanvas);
    const unitFactor = useAppStore(selectUnitFactor);
    const unit = useAppStore(selectUnit);
    const addDimensionLine = useAppStore(selectAddDimensionLine);
    const updateDimensionLine = useAppStore(selectUpdateDimensionLine);
    const interactionMode = useAppStore(selectInteractionMode);
    const setInteractionMode = useAppStore(selectSetInteractionMode);
    const selectedDimensionLineId = useAppStore(selectSelectedDimensionLineId);
    const setSelectedDimensionLineId = useAppStore(
        selectSetSelectedDimensionLineId
    );

    const [draftLine, setDraftLine] = useState<DimensionLine | null>(null);
    const [snapIndicator, setSnapIndicator] =
        useState<DimensionSnapIndicator | null>(null);

    const isDimensionMode = isDimensionInteractionMode(interactionMode);
    const isDimensionAddMode = interactionMode === "dimension_add";
    const isDimensionSelectMode = interactionMode === "dimension_select";

    const snapTargets = useMemo(
        () =>
            dimensionLines.map((line) => ({
                id: line.id,
                start: line.start,
                end: line.end,
            })),
        [dimensionLines]
    );

    // 追加モード中のみ吸着を有効にする（選択モードでは邪魔になるため）
    const snapAxis = useMemo(() => {
        if (!draftLine) {
            return "both" as const;
        }
        const constraint = draftLine.constraint ?? "free";
        if (constraint === "horizontal") {
            return "x" as const;
        }
        if (constraint === "vertical") {
            return "y" as const;
        }
        return "both" as const;
    }, [draftLine]);

    const { snap, gridStepX, gridStepY } = useGuideSnap({
        guides,
        dimensionLines: snapTargets,
        imageSets,
        scale: canvas.scale,
        axis: isDimensionAddMode ? snapAxis : "both",
    });

    const setDimensionModeEnabled = useCallback(
        (enabled: boolean) => {
            setInteractionMode(enabled ? "dimension_add" : "default");
        },
        [setInteractionMode]
    );

    const getStagePointerPos = useCallback(
        () => getStagePointerWorld(stageRef.current),
        [stageRef]
    );

    const onStageMouseDown = useCallback(
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (e.target.getType() !== "Stage") return;
            if (!("button" in e.evt) || e.evt.button !== 0) return;

            if (isDimensionSelectMode) {
                setSelectedDimensionLineId(null);
                return;
            }

            if (!isDimensionAddMode) return;

            const raw = getStagePointerPos();
            if (!raw) return;

            const constraint = guides.dimension.defaultConstraint;
            const result = snap(raw);
            const start = result.point;

            const id = crypto.randomUUID();
            setDraftLine({
                id,
                start,
                end: start,
                color: DIMENSION_LINE_COLOR_DEFAULT,
                showUnitLabel: true,
                constraint,
            });
            setSelectedDimensionLineId(null);
        },
        [
            isDimensionAddMode,
            isDimensionSelectMode,
            getStagePointerPos,
            setSelectedDimensionLineId,
            snap,
            guides.dimension.defaultConstraint,
        ]
    );

    const onStageMouseMove = useCallback(() => {
        const raw = getStagePointerPos();
        if (!raw) return;

        const constraint = draftLine?.constraint ?? "free";
        const result = snap(raw);

        setSnapIndicator(
            result.primary
                ? { point: result.point, pointer: raw, source: result.primary }
                : null
        );

        setDraftLine((prev) => {
            if (!prev) {
                return prev;
            }
            return {
                ...prev,
                end: applyConstraint(prev.start, result.point, constraint),
            };
        });
    }, [getStagePointerPos, snap, draftLine?.constraint]);

    const onMouseUp = useCallback(() => {
        setSnapIndicator(null);

        if (!draftLine) return;

        const dx = draftLine.end.x - draftLine.start.x;
        const dy = draftLine.end.y - draftLine.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= MIN_DIMENSION_LINE_DISTANCE) {
            addDimensionLine(draftLine);
            setInteractionMode("dimension_select");
            setSelectedDimensionLineId(draftLine.id);
        } else {
            setInteractionMode("dimension_add");
            setSelectedDimensionLineId(null);
        }

        setDraftLine(null);
    }, [
        draftLine,
        addDimensionLine,
        setInteractionMode,
        setSelectedDimensionLineId,
    ]);

    const renderedDimensionLines = useMemo(() => {
        if (!draftLine) {
            return dimensionLines;
        }
        return [...dimensionLines, draftLine];
    }, [dimensionLines, draftLine]);

    // キーボードイベント処理は専用フックに委譲
    useDimensionKeyboard();

    return {
        isDimensionMode,
        isDimensionAddMode,
        isDimensionSelectMode,
        setDimensionModeEnabled,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
        dimensionLines: renderedDimensionLines,
        unitFactor,
        unit,
        updateDimensionLine,
        snapIndicator,
        gridStepX,
        gridStepY,
        showCellCount: guides.dimension.showCellCount && guides.grid.enabled,
        onMouseDown: onStageMouseDown,
        onMouseMove: onStageMouseMove,
        onMouseUp,
    };
};
