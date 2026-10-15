import React, { memo, useCallback, useEffect, useRef } from "react";

import { useAppStore } from "../../store/useAppStore";
import {
    selectCanvas,
    selectGuideGrid,
    selectGuideLines,
    selectGuides,
    selectImageSets,
    selectInteractionMode,
    selectMoveGuideLine,
    selectSetCanvasState,
    selectSetUIHidden,
    selectSyncImageSets,
    selectUpdateImageSet,
} from "../../store/selectors";

import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Stage, Layer } from "react-konva";

import { DrawImage } from "./DrawImage";
import { ControlButton } from "./ControlButton";
import { OverlayControls } from "./OverlayControls";
import { DimensionLineLayer } from "./DimensionLineLayer";
import { GuideGridLayer } from "./GuideGridLayer";
import { GuideLinesLayer } from "./GuideLinesLayer";
import { GuideRectLayer } from "./GuideRectLayer";
import { GuideSnapIndicator } from "./GuideSnapIndicator";
import { ImageExportDialog } from "../dialogs/export/ImageExportDialog";
import { bindStageDragEndDisable } from "./imageStageDragEnd";

import { useStageControls } from "../hooks/useStageControls";
import { useDimensionLineMode } from "../hooks/useDimensionLineMode";
import { useGuideRectMode } from "../hooks/useGuideRectMode";
import { useImageSelection } from "../hooks/useImageSelection";
import { useClickThroughMode } from "../hooks/useClickThroughMode";
import { useStageExport } from "../hooks/useStageExport";
import { useSaveStageBridge } from "../hooks/useSaveStageBridge";
import { useImageInitialization } from "../hooks/useImageInitialization";
import { useStagePointerHandlers } from "../hooks/useStagePointerHandlers";
import type { MainWindowActions } from "../hooks/useMainWindowActions";

interface ImageStageProps {
    isImageExportDialogOpen: boolean;
    onOpenImageExportDialog: () => void;
    onCloseImageExportDialog: () => void;
    onOpenWindowColorPicker: () => void;
    mainWindowActions: MainWindowActions;
}

export const ImageStage = memo(function ImageStage(props: ImageStageProps) {
    "use no memo";

    const {
        isImageExportDialogOpen,
        onOpenImageExportDialog,
        onCloseImageExportDialog,
        onOpenWindowColorPicker,
        mainWindowActions,
    } = props;
    const imageSets = useAppStore(selectImageSets);
    const updateImageSet = useAppStore(selectUpdateImageSet);
    const syncImageSets = useAppStore(selectSyncImageSets);
    const canvas = useAppStore(selectCanvas);
    const setCanvasState = useAppStore(selectSetCanvasState);
    const setUIHidden = useAppStore(selectSetUIHidden);
    const guideGrid = useAppStore(selectGuideGrid);
    const guides = useAppStore(selectGuides);
    const guideLines = useAppStore(selectGuideLines);
    const moveGuideLine = useAppStore(selectMoveGuideLine);

    const stageRef = useRef<Konva.Stage>(null);

    const { exportImage } = useStageExport({ stageRef, setUIHidden });

    const onUpdateStage = useCallback(
        (newPos: { x: number; y: number; scale: number }) => {
            setCanvasState(newPos);
        },
        [setCanvasState]
    );

    const { stageSize, onWheel } = useStageControls(stageRef, onUpdateStage);

    const {
        isDimensionSelectMode,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
        dimensionLines,
        unitFactor,
        unit,
        updateDimensionLine,
        snapIndicator,
        gridStepX,
        gridStepY,
        showCellCount,
        onMouseDown: onMouseDownDimension,
        onMouseMove: onMouseMoveDimension,
        onMouseUp: onMouseUpDimension,
    } = useDimensionLineMode(stageRef);

    const interactionMode = useAppStore(selectInteractionMode);

    const {
        isGuideRectSelectMode,
        selectedGuideRectId,
        setSelectedGuideRectId,
        rects: guideRects,
        anchorsByImageId,
        resolveRect: resolveGuideRect,
        updateGuideRect,
        snapIndicator: rectSnapIndicator,
        gridStepX: rectGridStepX,
        gridStepY: rectGridStepY,
        onMouseDown: onMouseDownGuideRect,
        onMouseMove: onMouseMoveGuideRect,
        onMouseUp: onMouseUpGuideRect,
    } = useGuideRectMode(stageRef);

    const isGuideRectMode =
        interactionMode === "guide_rect_draw" ||
        interactionMode === "guide_rect_select";

    const isGuideLineEditMode = interactionMode === "guide_line_select";

    // 参考枠モードでは参考枠ハンドラへ、それ以外は寸法線ハンドラへ振り分ける
    const onToolMouseDown = useCallback(
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (isGuideRectMode) {
                onMouseDownGuideRect(e);
                return;
            }
            onMouseDownDimension(e);
        },
        [isGuideRectMode, onMouseDownDimension, onMouseDownGuideRect]
    );

    const onToolMouseMove = useCallback(() => {
        if (isGuideRectMode) {
            onMouseMoveGuideRect();
            return;
        }
        onMouseMoveDimension();
    }, [isGuideRectMode, onMouseMoveDimension, onMouseMoveGuideRect]);

    const onToolMouseUp = useCallback(() => {
        if (isGuideRectMode) {
            onMouseUpGuideRect();
            return;
        }
        onMouseUpDimension();
    }, [isGuideRectMode, onMouseUpDimension, onMouseUpGuideRect]);

    const { selectedImageId, setSelectedImageId, createImageSelectHandler } =
        useImageSelection();

    const { onInitImage, onUpdateAnchor } = useImageInitialization({
        imageSets,
        syncImageSets,
        updateImageSet,
    });

    const { onDragEnd, onMouseDown, onMouseMove, onMouseUp } =
        useStagePointerHandlers({
            stageRef,
            interactionMode,
            setSelectedImageId,
            onToolMouseDown,
            onToolMouseMove,
            onToolMouseUp,
            onUpdateStage,
        });

    useClickThroughMode();

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        return bindStageDragEndDisable(stage);
    }, []);

    useSaveStageBridge(stageRef);

    return (
        <>
            <Stage
                {...stageSize}
                x={canvas.x}
                y={canvas.y}
                scaleX={canvas.scale}
                scaleY={canvas.scale}
                draggable={false}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onDragEnd={onDragEnd}
                onWheel={onWheel}
                ref={stageRef}
            >
                {/* 画像より背面の参考物 */}
                <Layer name="guideLayer" listening={false}>
                    {guideGrid.layer === "belowImages" && (
                        <GuideGridLayer grid={guideGrid} stageRef={stageRef} />
                    )}
                    {guideLines.layer === "belowImages" && (
                        <GuideLinesLayer
                            lines={guideLines}
                            stageRef={stageRef}
                            isEditMode={isGuideLineEditMode}
                            onMoveLine={moveGuideLine}
                        />
                    )}
                </Layer>

                <Layer>
                    {imageSets.map((imageSet, index) => {
                        // visible が false の場合は描画しない
                        if (imageSet.visible === false) return null;
                        return (
                            <DrawImage
                                key={imageSet.id}
                                imageSet={imageSet}
                                onInitImage={onInitImage(imageSet, index)}
                                onSelect={createImageSelectHandler(imageSet.id)}
                            />
                        );
                    })}

                    {selectedImageId &&
                        imageSets.map((imageSet, index) => {
                            if (
                                imageSet.id === selectedImageId &&
                                imageSet.visible !== false
                            ) {
                                return (
                                    <OverlayControls
                                        key={imageSet.id}
                                        imageSet={imageSet}
                                        onUpdateAnchor={onUpdateAnchor(
                                            imageSet,
                                            index
                                        )}
                                    />
                                );
                            }
                            return null;
                        })}
                </Layer>

                {/* 画像より前面の参考物 */}
                <Layer name="guideLayer" listening={false}>
                    {guideGrid.layer === "aboveImages" && (
                        <GuideGridLayer grid={guideGrid} stageRef={stageRef} />
                    )}
                    {guideGrid.layer === "screenLocked" && (
                        <GuideGridLayer grid={guideGrid} stageRef={stageRef} />
                    )}
                </Layer>

                {/* 参考線（ドラッグ可能なため listening を有効にする） */}
                <Layer name="guideLayer" listening={isGuideLineEditMode}>
                    {guideLines.layer === "aboveImages" && (
                        <GuideLinesLayer
                            lines={guideLines}
                            stageRef={stageRef}
                            isEditMode={isGuideLineEditMode}
                            onMoveLine={moveGuideLine}
                        />
                    )}
                </Layer>

                {/* 参考枠（編集可能） */}
                <Layer name="guideLayer">
                    <GuideRectLayer
                        rects={guideRects}
                        anchorsByImageId={anchorsByImageId}
                        resolveRect={resolveGuideRect}
                        selectedRectId={selectedGuideRectId}
                        onSelect={setSelectedGuideRectId}
                        onUpdateRect={updateGuideRect}
                        isEditMode={isGuideRectSelectMode}
                        scale={canvas.scale}
                        baselineRectId={guides.baselineRectId}
                        unitFactor={unitFactor}
                        unit={unit}
                        gridStepX={rectGridStepX}
                        gridStepY={rectGridStepY}
                    />
                </Layer>

                {/* 操作系（最前面） */}
                <Layer>
                    <DimensionLineLayer
                        dimensionLines={dimensionLines}
                        unitFactor={unitFactor}
                        unit={unit}
                        isSelected={(id) => id === selectedDimensionLineId}
                        onSelect={setSelectedDimensionLineId}
                        onUpdate={updateDimensionLine}
                        isDimensionEditMode={isDimensionSelectMode}
                        scale={canvas.scale}
                        gridStepX={gridStepX}
                        gridStepY={gridStepY}
                        showCellCount={showCellCount}
                    />

                    {snapIndicator && (
                        <GuideSnapIndicator
                            point={snapIndicator.point}
                            pointer={snapIndicator.pointer}
                            source={snapIndicator.source}
                            scale={canvas.scale}
                        />
                    )}

                    {rectSnapIndicator && (
                        <GuideSnapIndicator
                            point={rectSnapIndicator.point}
                            pointer={rectSnapIndicator.pointer}
                            source={rectSnapIndicator.source}
                            scale={canvas.scale}
                        />
                    )}
                </Layer>
            </Stage>
            <ControlButton
                onOpenImageExportDialog={onOpenImageExportDialog}
                onOpenWindowColorPicker={onOpenWindowColorPicker}
                mainWindowActions={mainWindowActions}
            />
            <ImageExportDialog
                open={isImageExportDialogOpen}
                onClose={onCloseImageExportDialog}
                onExport={exportImage}
            />
        </>
    );
});
