import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppStore } from "@/renderer/store/useAppStore";
import {
    selectAddGuideLine,
    selectCanvas,
    selectClearGuideLines,
    selectDimensionLines,
    selectDuplicateGuideRect,
    selectGenerateGuideLines,
    selectGuides,
    selectImageSets,
    selectInteractionMode,
    selectLinkGuideRectToImage,
    selectMoveGuideLine,
    selectRemoveDimensionLine,
    selectRemoveGuideLine,
    selectRemoveGuideRect,
    selectSelectedDimensionLineId,
    selectSelectedGuideRectId,
    selectSelectedImageId,
    selectSetBaselineGuideRectId,
    selectSetInteractionMode,
    selectSetSelectedDimensionLineId,
    selectSetSelectedGuideRectId,
    selectSetUnit,
    selectSetUnitFactor,
    selectUnit,
    selectUnitFactor,
    selectUnlinkGuideRect,
    selectUpdateDimensionLine,
    selectUpdateGuideRect,
    selectUpdateGuides,
    selectUpdateImageSet,
} from "@/renderer/store/selectors";
import { TabPanel, TabStrip } from "@/renderer/components/ui/tab-strip";
import { Button } from "@/renderer/components/ui/button";
import {
    resolveGuideRectWorldRect,
    scaleAnchors,
    toLinkedShape,
} from "@/renderer/main-window/utils/guideGeometry";
import type { AnchorPos } from "@/shared/types/AnchorPos";
import type { InteractionMode } from "@/shared/types/InteractionMode";
import type {
    DimensionGuideConfig,
    GridConfig,
    GuideLinesConfig,
} from "@/shared/types/Guide";
import { DimensionLineListSection } from "./DimensionLineListSection";
import { DimensionLineModeSection } from "./DimensionLineModeSection";
import { DimensionLineUnitSection } from "./DimensionLineUnitSection";
import { DimensionGuideGridSection } from "./DimensionGuideGridSection";
import { DimensionGuideLinesSection } from "./DimensionGuideLinesSection";
import { DimensionGuideRectSection } from "./DimensionGuideRectSection";
import { DimensionGuideCompareSection } from "./DimensionGuideCompareSection";
import { DimensionGuideDimensionSection } from "./DimensionGuideDimensionSection";

type SettingsTab = "grid" | "lines" | "rect" | "dimension";

export function DimensionLineSettingsPanel() {
    const { t } = useTranslation();
    const interactionMode = useAppStore(selectInteractionMode);
    const setInteractionMode = useAppStore(selectSetInteractionMode);
    const unitFactor = useAppStore(selectUnitFactor);
    const setUnitFactor = useAppStore(selectSetUnitFactor);
    const unit = useAppStore(selectUnit);
    const setUnit = useAppStore(selectSetUnit);
    const dimensionLines = useAppStore(selectDimensionLines);
    const updateDimensionLine = useAppStore(selectUpdateDimensionLine);
    const removeDimensionLine = useAppStore(selectRemoveDimensionLine);
    const selectedDimensionLineId = useAppStore(selectSelectedDimensionLineId);
    const setSelectedDimensionLineId = useAppStore(
        selectSetSelectedDimensionLineId
    );
    const guides = useAppStore(selectGuides);
    const updateGuides = useAppStore(selectUpdateGuides);
    const canvas = useAppStore(selectCanvas);
    const selectedGuideRectId = useAppStore(selectSelectedGuideRectId);
    const setSelectedGuideRectId = useAppStore(selectSetSelectedGuideRectId);
    const removeGuideRect = useAppStore(selectRemoveGuideRect);
    const duplicateGuideRect = useAppStore(selectDuplicateGuideRect);
    const updateGuideRect = useAppStore(selectUpdateGuideRect);
    const setBaselineGuideRectId = useAppStore(selectSetBaselineGuideRectId);
    const imageSets = useAppStore(selectImageSets);
    const selectedImageId = useAppStore(selectSelectedImageId);
    const updateImageSet = useAppStore(selectUpdateImageSet);
    const addGuideLine = useAppStore(selectAddGuideLine);
    const moveGuideLine = useAppStore(selectMoveGuideLine);
    const removeGuideLine = useAppStore(selectRemoveGuideLine);
    const generateGuideLines = useAppStore(selectGenerateGuideLines);
    const clearGuideLines = useAppStore(selectClearGuideLines);
    const linkGuideRectToImage = useAppStore(selectLinkGuideRectToImage);
    const unlinkGuideRect = useAppStore(selectUnlinkGuideRect);

    const [activeTab, setActiveTab] = useState<SettingsTab>("grid");

    const isDimensionAddMode = interactionMode === "dimension_add";
    const isDimensionSelectMode = interactionMode === "dimension_select";
    const isGuideRectDrawMode = interactionMode === "guide_rect_draw";
    const isGuideLineEditMode = interactionMode === "guide_line_select";

    const anchorsByImageId = useMemo(() => {
        const map = new Map<string, AnchorPos>();
        for (const imageSet of imageSets) {
            if (imageSet.currentAnchorPos) {
                map.set(imageSet.id, imageSet.currentAnchorPos);
            }
        }
        return map;
    }, [imageSets]);

    const rectItems = useMemo(
        () =>
            guides.rects.map((rect) => ({
                rect,
                world: resolveGuideRectWorldRect(rect.shape, anchorsByImageId),
            })),
        [guides.rects, anchorsByImageId]
    );

    const updateInteractionMode = (mode: InteractionMode) => {
        setInteractionMode(mode);
    };

    const modeLabel = isDimensionAddMode
        ? t("render.dimension_line_settings.mode.add")
        : isDimensionSelectMode
        ? t("render.dimension_line_settings.mode.select")
        : t("render.dimension_line_settings.mode.default");

    const exitDimensionMode = () => {
        setSelectedDimensionLineId(null);
        updateInteractionMode("default");
    };

    const enterDimensionAddMode = () => {
        setSelectedDimensionLineId(null);
        updateInteractionMode("dimension_add");
    };

    const selectDimensionLine = (id: string) => {
        updateInteractionMode("dimension_select");
        setSelectedDimensionLineId(id);
    };

    const deleteDimensionLine = (id: string) => {
        removeDimensionLine(id);
        if (selectedDimensionLineId === id) {
            setSelectedDimensionLineId(null);
            if (isDimensionSelectMode) {
                updateInteractionMode("default");
            }
        }
    };

    const onGridChange = (patch: Partial<GridConfig>) => {
        updateGuides((current) => ({
            ...current,
            grid: { ...current.grid, ...patch },
        }));
    };

    const onDimensionGuideChange = (patch: Partial<DimensionGuideConfig>) => {
        updateGuides((current) => ({
            ...current,
            dimension: { ...current.dimension, ...patch },
        }));
    };

    const startGuideRectDraw = () => {
        setSelectedGuideRectId(null);
        updateInteractionMode("guide_rect_draw");
    };

    const cancelGuideRectDraw = () => {
        setSelectedGuideRectId(null);
        updateInteractionMode("default");
    };

    const selectGuideRect = (id: string) => {
        updateInteractionMode("guide_rect_select");
        setSelectedGuideRectId(id);
    };

    const deleteGuideRect = (id: string) => {
        removeGuideRect(id);
        if (selectedGuideRectId === id) {
            setSelectedGuideRectId(null);
            if (interactionMode === "guide_rect_select") {
                updateInteractionMode("default");
            }
        }
    };

    /** グリッド原点を現在の表示領域左上に合わせる */
    const onAlignOriginToView = () => {
        const scale = canvas.scale > 0 ? canvas.scale : 1;
        updateGuides((current) => ({
            ...current,
            grid: {
                ...current.grid,
                origin: { x: -canvas.x / scale, y: -canvas.y / scale },
            },
        }));
    };

    const onLinesChange = (patch: Partial<GuideLinesConfig>) => {
        updateGuides((current) => ({
            ...current,
            lines: { ...current.lines, ...patch },
        }));
    };

    /** 表示中の視口中央付近に新しい参考線を追加する */
    const addGuideLineAtView = (axis: "x" | "y") => {
        const scale = canvas.scale > 0 ? canvas.scale : 1;
        const viewCenterX =
            (-canvas.x + window.innerWidth / 2) / scale;
        const viewCenterY =
            (-canvas.y + window.innerHeight / 2) / scale;
        addGuideLine(axis, axis === "x" ? viewCenterX : viewCenterY);
    };

    const canApplyRatioToImage = Boolean(selectedImageId);

    /**
     * 比率を画像へ適用する。
     * 選択中の画像アンカーを、指定した原点まわりに等比拡大縮小する。
     */
    const applyRatioToImage = (
        factor: number,
        origin?: { x: number; y: number }
    ) => {
        if (!selectedImageId || !Number.isFinite(factor) || factor <= 0) {
            return;
        }

        const imageSet = imageSets.find(
            (entry) => entry.id === selectedImageId
        );
        if (!imageSet?.currentAnchorPos) {
            return;
        }

        const scaled = scaleAnchors(imageSet.currentAnchorPos, factor, origin);

        updateImageSet({
            id: imageSet.id,
            imageSet: {
                ...imageSet,
                currentAnchorPos: scaled,
                initAnchorPos: imageSet.initAnchorPos ?? scaled,
            },
        });
    };

    /** 選択中の参考枠を選択中の画像へ束縛する */
    const linkSelectedRectToImage = () => {
        if (!selectedGuideRectId || !selectedImageId) {
            return;
        }
        const rect = guides.rects.find(
            (entry) => entry.id === selectedGuideRectId
        );
        const anchors = anchorsByImageId.get(selectedImageId);
        if (!rect || !anchors) {
            return;
        }

        const linked = toLinkedShape(rect, selectedImageId, anchors);
        if (!linked) {
            return;
        }

        linkGuideRectToImage({
            rectId: rect.id,
            imageSetId: selectedImageId,
            shape: linked,
        });
    };

    /** 選択中の参考枠の束縛を解除する（現在位置を維持） */
    const unlinkSelectedRect = () => {
        if (!selectedGuideRectId) {
            return;
        }
        const rect = guides.rects.find(
            (entry) => entry.id === selectedGuideRectId
        );
        if (!rect || rect.shape.kind !== "linked") {
            return;
        }
        const world = resolveGuideRectWorldRect(rect.shape, anchorsByImageId);
        if (!world) {
            return;
        }
        unlinkGuideRect({ rectId: rect.id, worldRect: world });
    };

    const selectedRect = guides.rects.find(
        (entry) => entry.id === selectedGuideRectId
    );

    return (
        <div className="grid gap-4 p-4" data-testid="dimension-settings.panel">
            <TabStrip
                items={[
                    {
                        id: "grid",
                        label: t("render.guide_settings.tab.grid"),
                    },
                    {
                        id: "rect",
                        label: t("render.guide_settings.tab.rect"),
                    },
                    {
                        id: "lines",
                        label: t("render.guide_settings.tab.lines"),
                    },
                    {
                        id: "dimension",
                        label: t("render.guide_settings.tab.dimension"),
                    },
                ]}
                value={activeTab}
                onValueChange={(id) => setActiveTab(id as SettingsTab)}
                testIdPrefix="dimension-settings.guide"
            />

            <TabPanel
                active={activeTab === "grid"}
                testId="dimension-settings.guide.panel.grid"
            >
                <DimensionGuideGridSection
                    grid={guides.grid}
                    onChange={onGridChange}
                    onAlignOriginToView={onAlignOriginToView}
                    t={t}
                />
            </TabPanel>

            <TabPanel
                active={activeTab === "rect"}
                testId="dimension-settings.guide.panel.rect"
            >
                <DimensionGuideRectSection
                    rects={rectItems}
                    selectedRectId={selectedGuideRectId}
                    baselineRectId={guides.baselineRectId ?? null}
                    isDrawMode={isGuideRectDrawMode}
                    onStartDraw={startGuideRectDraw}
                    onCancelDraw={cancelGuideRectDraw}
                    onSelectRect={selectGuideRect}
                    onUpdateRect={updateGuideRect}
                    onDeleteRect={deleteGuideRect}
                    onDuplicateRect={duplicateGuideRect}
                    onSetBaseline={setBaselineGuideRectId}
                    t={t}
                />

                <DimensionGuideCompareSection
                    rects={rectItems}
                    baselineRectId={guides.baselineRectId ?? null}
                    selectedRectId={selectedGuideRectId}
                    onSetBaseline={setBaselineGuideRectId}
                    onApplyRatio={applyRatioToImage}
                    canApplyToImage={canApplyRatioToImage}
                    t={t}
                />

                <div className="grid gap-2 rounded-lg border p-4">
                    <p className="text-sm font-medium">
                        {t("render.guide_settings.rect.link_title")}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!selectedGuideRectId || !selectedImageId}
                            onClick={linkSelectedRectToImage}
                            data-testid="dimension-settings.guide.rect.link"
                        >
                            {t("render.guide_settings.rect.link")}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={selectedRect?.shape.kind !== "linked"}
                            onClick={unlinkSelectedRect}
                            data-testid="dimension-settings.guide.rect.unlink"
                        >
                            {t("render.guide_settings.rect.unlink")}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("render.guide_settings.rect.link_helper")}
                    </p>
                </div>
            </TabPanel>

            <TabPanel
                active={activeTab === "lines"}
                testId="dimension-settings.guide.panel.lines"
            >
                <div className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        {t("render.guide_settings.lines.edit_helper")}
                    </p>
                    {isGuideLineEditMode ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateInteractionMode("default")}
                            data-testid="dimension-settings.guide.lines.edit-done"
                        >
                            {t("render.dimension_line_settings.done")}
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() =>
                                updateInteractionMode("guide_line_select")
                            }
                            data-testid="dimension-settings.guide.lines.edit-start"
                        >
                            {t("render.guide_settings.lines.edit_start")}
                        </Button>
                    )}
                </div>

                <DimensionGuideLinesSection
                    lines={guides.lines}
                    onChange={onLinesChange}
                    onAddLine={addGuideLineAtView}
                    onMoveLine={moveGuideLine}
                    onRemoveLine={removeGuideLine}
                    onGenerate={generateGuideLines}
                    onClear={clearGuideLines}
                    t={t}
                />
            </TabPanel>

            <TabPanel
                active={activeTab === "dimension"}
                testId="dimension-settings.guide.panel.dimension"
            >
                <DimensionGuideDimensionSection
                    dimension={guides.dimension}
                    onChange={onDimensionGuideChange}
                    t={t}
                />

                <DimensionLineModeSection
                    isDimensionAddMode={isDimensionAddMode}
                    isDimensionSelectMode={isDimensionSelectMode}
                    modeLabel={modeLabel}
                    onCancelAddMode={exitDimensionMode}
                    onDoneSelectMode={exitDimensionMode}
                    onEnterAddMode={enterDimensionAddMode}
                    t={t}
                />

                <DimensionLineUnitSection
                    unitFactor={unitFactor}
                    unit={unit}
                    setUnitFactor={setUnitFactor}
                    setUnit={setUnit}
                    t={t}
                />

                <DimensionLineListSection
                    dimensionLines={dimensionLines}
                    selectedDimensionLineId={selectedDimensionLineId}
                    unitFactor={unitFactor}
                    unit={unit}
                    onSelectLine={selectDimensionLine}
                    onUpdateLine={updateDimensionLine}
                    onDeleteLine={deleteDimensionLine}
                    t={t}
                />
            </TabPanel>
        </div>
    );
}
