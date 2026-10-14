import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppStore } from "@/renderer/store/useAppStore";
import {
    selectCanvas,
    selectDimensionLines,
    selectDuplicateGuideRect,
    selectGuides,
    selectImageSets,
    selectInteractionMode,
    selectRemoveDimensionLine,
    selectRemoveGuideRect,
    selectSelectedDimensionLineId,
    selectSelectedGuideRectId,
    selectSetBaselineGuideRectId,
    selectSetInteractionMode,
    selectSetSelectedDimensionLineId,
    selectSetSelectedGuideRectId,
    selectSetUnit,
    selectSetUnitFactor,
    selectUnit,
    selectUnitFactor,
    selectUpdateDimensionLine,
    selectUpdateGuideRect,
    selectUpdateGuides,
} from "@/renderer/store/selectors";
import { TabPanel, TabStrip } from "@/renderer/components/ui/tab-strip";
import { resolveGuideRectWorldRect } from "@/renderer/main-window/utils/guideGeometry";
import type { AnchorPos } from "@/shared/types/AnchorPos";
import type { InteractionMode } from "@/shared/types/InteractionMode";
import type {
    DimensionGuideConfig,
    GridConfig,
} from "@/shared/types/Guide";
import { DimensionLineListSection } from "./DimensionLineListSection";
import { DimensionLineModeSection } from "./DimensionLineModeSection";
import { DimensionLineUnitSection } from "./DimensionLineUnitSection";
import { DimensionGuideGridSection } from "./DimensionGuideGridSection";
import { DimensionGuideRectSection } from "./DimensionGuideRectSection";
import { DimensionGuideDimensionSection } from "./DimensionGuideDimensionSection";

type SettingsTab = "grid" | "rect" | "dimension";

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

    const [activeTab, setActiveTab] = useState<SettingsTab>("grid");

    const isDimensionAddMode = interactionMode === "dimension_add";
    const isDimensionSelectMode = interactionMode === "dimension_select";
    const isGuideRectDrawMode = interactionMode === "guide_rect_draw";

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
