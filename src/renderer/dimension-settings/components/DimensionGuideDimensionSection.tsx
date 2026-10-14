import { Label } from "@/renderer/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Switch } from "@/renderer/components/ui/switch";
import type {
    DimensionConstraint,
    DimensionGuideConfig,
} from "@/shared/types/Guide";

interface DimensionGuideDimensionSectionProps {
    dimension: DimensionGuideConfig;
    onChange: (patch: Partial<DimensionGuideConfig>) => void;
    t: (key: string) => string;
}

export function DimensionGuideDimensionSection({
    dimension,
    onChange,
    t,
}: DimensionGuideDimensionSectionProps) {
    return (
        <div className="grid gap-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
                {t("render.guide_settings.dimension.title")}
            </p>

            <div className="grid gap-1.5">
                <Label htmlFor="guide-dimension-constraint">
                    {t("render.guide_settings.dimension.default_constraint")}
                </Label>
                <Select
                    value={dimension.defaultConstraint}
                    onValueChange={(value: DimensionConstraint) =>
                        onChange({ defaultConstraint: value })
                    }
                >
                    <SelectTrigger
                        id="guide-dimension-constraint"
                        className="w-[200px]"
                        data-testid="dimension-settings.guide.dimension.constraint"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            value="free"
                            data-testid="dimension-settings.guide.dimension.constraint.free"
                        >
                            {t(
                                "render.guide_settings.dimension.constraint_option.free"
                            )}
                        </SelectItem>
                        <SelectItem
                            value="horizontal"
                            data-testid="dimension-settings.guide.dimension.constraint.horizontal"
                        >
                            {t(
                                "render.guide_settings.dimension.constraint_option.horizontal"
                            )}
                        </SelectItem>
                        <SelectItem
                            value="vertical"
                            data-testid="dimension-settings.guide.dimension.constraint.vertical"
                        >
                            {t(
                                "render.guide_settings.dimension.constraint_option.vertical"
                            )}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {t("render.guide_settings.dimension.constraint_helper")}
                </p>
            </div>

            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">
                    {t("render.guide_settings.dimension.show_cell_count")}
                </Label>
                <Switch
                    checked={dimension.showCellCount}
                    onCheckedChange={(checked) =>
                        onChange({ showCellCount: checked })
                    }
                    data-testid="dimension-settings.guide.dimension.show-cell-count"
                />
            </div>
        </div>
    );
}
