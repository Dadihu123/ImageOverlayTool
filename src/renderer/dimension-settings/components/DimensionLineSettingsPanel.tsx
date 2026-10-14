import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppStore } from "@/renderer/store/useAppStore";
import {
    selectCanvas,
    selectDimensionLines,
    selectGuides,
    selectInteractionMode,
    selectRemoveDimensionLine,
    selectSelectedDimensionLineId,
    selectSetInteractionMode,
    selectSetSelectedDimensionLineId,
    selectSetUnit,
    selectSetUnitFactor,
    selectUnit,
    selectUnitFactor,
    selectUpdateDimensionLine,
    selectUpdateGuides,
} from "@/renderer/store/selectors";
import { TabPanel, TabStrip } from "@/renderer/components/ui/tab-strip";
import type { InteractionMode } from "@/shared/types/InteractionMode";
import type {
    DimensionGuideConfig,
    GridConfig,
} from "@/shared/types/Guide";
import { DimensionLineListSection } from "./DimensionLineListSection";
import { DimensionLineModeSection } from "./DimensionLineModeSection";
import { DimensionLineUnitSection } from "./DimensionLineUnitSection";
import { DimensionGuideGridSection } from "./DimensionGuideGridSection";
import { DimensionGuideDimensionSection } from "./DimensionGuideDimensionSection";

type SettingsTab = "grid" | "dimension";

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

    const [activeTab, setActiveTab] = useState<SettingsTab>("grid");

    const isDimensionAddMode = interactionMode === "dimension_add";
    const isDimensionSelectMode = interactionMode === "dimension_select";

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
