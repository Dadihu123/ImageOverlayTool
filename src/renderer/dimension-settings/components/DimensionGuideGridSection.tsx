import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Switch } from "@/renderer/components/ui/switch";
import {
    GUIDE_GRID_SPACING_MAX,
    GUIDE_GRID_SPACING_MIN,
    GUIDE_GRID_SUBDIVISIONS_MAX,
    GUIDE_GRID_SUBDIVISIONS_MIN,
    GUIDE_LINE_WIDTH_MAX,
    GUIDE_LINE_WIDTH_MIN,
} from "@/shared/constants/guide";
import type { GridConfig, GuideLayerPlacement } from "@/shared/types/Guide";

interface DimensionGuideGridSectionProps {
    grid: GridConfig;
    onChange: (patch: Partial<GridConfig>) => void;
    /** 現在の表示領域左上のワールド座標（原点合わせに使う） */
    onAlignOriginToView: () => void;
    t: (key: string) => string;
}

const SPACING_STEP = "any";

export function DimensionGuideGridSection({
    grid,
    onChange,
    onAlignOriginToView,
    t,
}: DimensionGuideGridSectionProps) {
    const updateSpacingX = (value: number) => {
        if (!Number.isFinite(value)) {
            return;
        }
        onChange(
            grid.linkSpacing
                ? { spacingX: value, spacingY: value }
                : { spacingX: value }
        );
    };

    const updateSpacingY = (value: number) => {
        if (!Number.isFinite(value)) {
            return;
        }
        onChange(
            grid.linkSpacing
                ? { spacingX: value, spacingY: value }
                : { spacingY: value }
        );
    };

    return (
        <div className="grid gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                    {t("render.guide_settings.grid.title")}
                </p>
                <Switch
                    checked={grid.enabled}
                    onCheckedChange={(checked) => onChange({ enabled: checked })}
                    data-testid="dimension-settings.guide.grid.enabled"
                />
            </div>

            <div className="grid gap-2">
                <div className="flex items-end gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-spacing-x">
                            {t("render.guide_settings.grid.spacing_x")}
                        </Label>
                        <Input
                            id="guide-grid-spacing-x"
                            type="number"
                            value={grid.spacingX}
                            min={GUIDE_GRID_SPACING_MIN}
                            max={GUIDE_GRID_SPACING_MAX}
                            step={SPACING_STEP}
                            onChange={(e) =>
                                updateSpacingX(e.currentTarget.valueAsNumber)
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[100px]"
                            data-testid="dimension-settings.guide.grid.spacing-x"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-spacing-y">
                            {t("render.guide_settings.grid.spacing_y")}
                        </Label>
                        <Input
                            id="guide-grid-spacing-y"
                            type="number"
                            value={grid.spacingY}
                            min={GUIDE_GRID_SPACING_MIN}
                            max={GUIDE_GRID_SPACING_MAX}
                            step={SPACING_STEP}
                            onChange={(e) =>
                                updateSpacingY(e.currentTarget.valueAsNumber)
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[100px]"
                            data-testid="dimension-settings.guide.grid.spacing-y"
                        />
                    </div>

                    <div className="flex items-center gap-2 pb-2">
                        <Switch
                            checked={grid.linkSpacing}
                            onCheckedChange={(checked) =>
                                onChange({ linkSpacing: checked })
                            }
                            data-testid="dimension-settings.guide.grid.link-spacing"
                        />
                        <Label className="text-xs whitespace-nowrap">
                            {t("render.guide_settings.grid.link_spacing")}
                        </Label>
                    </div>
                </div>

                <div className="flex items-end gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-subdivisions">
                            {t("render.guide_settings.grid.subdivisions")}
                        </Label>
                        <Input
                            id="guide-grid-subdivisions"
                            type="number"
                            value={grid.subdivisions}
                            min={GUIDE_GRID_SUBDIVISIONS_MIN}
                            max={GUIDE_GRID_SUBDIVISIONS_MAX}
                            step={1}
                            onChange={(e) => {
                                const value = e.currentTarget.valueAsNumber;
                                if (Number.isNaN(value)) {
                                    return;
                                }
                                onChange({ subdivisions: Math.round(value) });
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[100px]"
                            data-testid="dimension-settings.guide.grid.subdivisions"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-layer">
                            {t("render.guide_settings.grid.layer")}
                        </Label>
                        <Select
                            value={grid.layer}
                            onValueChange={(value: GuideLayerPlacement) =>
                                onChange({ layer: value })
                            }
                        >
                            <SelectTrigger
                                id="guide-grid-layer"
                                className="w-[150px]"
                                data-testid="dimension-settings.guide.grid.layer"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    value="belowImages"
                                    data-testid="dimension-settings.guide.grid.layer.below"
                                >
                                    {t(
                                        "render.guide_settings.grid.layer_option.below_images"
                                    )}
                                </SelectItem>
                                <SelectItem
                                    value="aboveImages"
                                    data-testid="dimension-settings.guide.grid.layer.above"
                                >
                                    {t(
                                        "render.guide_settings.grid.layer_option.above_images"
                                    )}
                                </SelectItem>
                                <SelectItem
                                    value="screenLocked"
                                    data-testid="dimension-settings.guide.grid.layer.screen"
                                >
                                    {t(
                                        "render.guide_settings.grid.layer_option.screen_locked"
                                    )}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-end gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-origin-x">
                            {t("render.guide_settings.grid.origin_x")}
                        </Label>
                        <Input
                            id="guide-grid-origin-x"
                            type="number"
                            value={grid.origin.x}
                            step={SPACING_STEP}
                            onChange={(e) => {
                                const value = e.currentTarget.valueAsNumber;
                                if (Number.isNaN(value)) {
                                    return;
                                }
                                onChange({
                                    origin: { x: value, y: grid.origin.y },
                                });
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[100px]"
                            data-testid="dimension-settings.guide.grid.origin-x"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-origin-y">
                            {t("render.guide_settings.grid.origin_y")}
                        </Label>
                        <Input
                            id="guide-grid-origin-y"
                            type="number"
                            value={grid.origin.y}
                            step={SPACING_STEP}
                            onChange={(e) => {
                                const value = e.currentTarget.valueAsNumber;
                                if (Number.isNaN(value)) {
                                    return;
                                }
                                onChange({
                                    origin: { x: grid.origin.x, y: value },
                                });
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[100px]"
                            data-testid="dimension-settings.guide.grid.origin-y"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onAlignOriginToView}
                        className="mb-0.5 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                        data-testid="dimension-settings.guide.grid.align-origin"
                    >
                        {t("render.guide_settings.grid.align_to_view")}
                    </button>
                </div>

                <div className="flex items-end gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-color">
                            {t("render.guide_settings.grid.color")}
                        </Label>
                        <Input
                            id="guide-grid-color"
                            type="color"
                            value={grid.color}
                            onChange={(e) =>
                                onChange({ color: e.currentTarget.value })
                            }
                            className="h-9 w-14 p-1"
                            data-testid="dimension-settings.guide.grid.color"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-minor-color">
                            {t("render.guide_settings.grid.minor_color")}
                        </Label>
                        <Input
                            id="guide-grid-minor-color"
                            type="color"
                            value={grid.minorColor}
                            onChange={(e) =>
                                onChange({ minorColor: e.currentTarget.value })
                            }
                            className="h-9 w-14 p-1"
                            data-testid="dimension-settings.guide.grid.minor-color"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-opacity">
                            {t("render.guide_settings.grid.opacity")}
                        </Label>
                        <Input
                            id="guide-grid-opacity"
                            type="number"
                            value={grid.opacity}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(e) => {
                                const value = e.currentTarget.valueAsNumber;
                                if (Number.isNaN(value)) {
                                    return;
                                }
                                onChange({ opacity: value });
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[80px]"
                            data-testid="dimension-settings.guide.grid.opacity"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="guide-grid-line-width">
                            {t("render.guide_settings.grid.line_width")}
                        </Label>
                        <Input
                            id="guide-grid-line-width"
                            type="number"
                            value={grid.lineWidth}
                            min={GUIDE_LINE_WIDTH_MIN}
                            max={GUIDE_LINE_WIDTH_MAX}
                            step={0.5}
                            onChange={(e) => {
                                const value = e.currentTarget.valueAsNumber;
                                if (Number.isNaN(value)) {
                                    return;
                                }
                                onChange({ lineWidth: value });
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-[80px]"
                            data-testid="dimension-settings.guide.grid.line-width"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-2 border-t pt-3">
                <p className="text-xs font-medium">
                    {t("render.guide_settings.grid.snap_title")}
                </p>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">
                            {t(
                                "render.guide_settings.grid.snap.grid_intersection"
                            )}
                        </Label>
                        <Switch
                            checked={grid.snap.gridIntersection}
                            onCheckedChange={(checked) =>
                                onChange({
                                    snap: {
                                        ...grid.snap,
                                        gridIntersection: checked,
                                    },
                                })
                            }
                            data-testid="dimension-settings.guide.grid.snap.grid"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">
                            {t("render.guide_settings.grid.snap.guide_lines")}
                        </Label>
                        <Switch
                            checked={grid.snap.guideLines}
                            onCheckedChange={(checked) =>
                                onChange({
                                    snap: {
                                        ...grid.snap,
                                        guideLines: checked,
                                    },
                                })
                            }
                            data-testid="dimension-settings.guide.grid.snap.lines"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">
                            {t(
                                "render.guide_settings.grid.snap.guide_rect_edges"
                            )}
                        </Label>
                        <Switch
                            checked={grid.snap.guideRectEdges}
                            onCheckedChange={(checked) =>
                                onChange({
                                    snap: {
                                        ...grid.snap,
                                        guideRectEdges: checked,
                                    },
                                })
                            }
                            data-testid="dimension-settings.guide.grid.snap.rects"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">
                            {t(
                                "render.guide_settings.grid.snap.dimension_endpoints"
                            )}
                        </Label>
                        <Switch
                            checked={grid.snap.dimensionEndpoints}
                            onCheckedChange={(checked) =>
                                onChange({
                                    snap: {
                                        ...grid.snap,
                                        dimensionEndpoints: checked,
                                    },
                                })
                            }
                            data-testid="dimension-settings.guide.grid.snap.dimensions"
                        />
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {t("render.guide_settings.grid.helper")}
            </p>
        </div>
    );
}
