import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
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
import type { GuideLinesConfig } from "@/shared/types/Guide";

interface DimensionGuideLinesSectionProps {
    lines: GuideLinesConfig;
    onChange: (patch: Partial<GuideLinesConfig>) => void;
    onAddLine: (axis: "x" | "y") => void;
    onMoveLine: (axis: "x" | "y", index: number, value: number) => void;
    onRemoveLine: (axis: "x" | "y", index: number) => void;
    onGenerate: (params: {
        axis: "x" | "y";
        start: number;
        interval: number;
        count: number;
    }) => void;
    onClear: (axis: "x" | "y") => void;
    t: (key: string, options?: Record<string, unknown>) => string;
}

export function DimensionGuideLinesSection({
    lines,
    onChange,
    onAddLine,
    onMoveLine,
    onRemoveLine,
    onGenerate,
    onClear,
    t,
}: DimensionGuideLinesSectionProps) {
    const [genAxis, setGenAxis] = useState<"x" | "y">("x");
    const [genStart, setGenStart] = useState(0);
    const [genInterval, setGenInterval] = useState(50);
    const [genCount, setGenCount] = useState(5);

    const renderList = (axis: "x" | "y", values: number[]) => (
        <div className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">
                    {t(
                        axis === "x"
                            ? "render.guide_settings.lines.vertical"
                            : "render.guide_settings.lines.horizontal"
                    )}
                </p>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddLine(axis)}
                        data-testid={`dimension-settings.guide.lines.add.${axis}`}
                    >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t("render.guide_settings.lines.add")}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onClear(axis)}
                        data-testid={`dimension-settings.guide.lines.clear.${axis}`}
                    >
                        {t("render.guide_settings.lines.clear")}
                    </Button>
                </div>
            </div>

            <div
                className="max-h-40 overflow-y-auto rounded-md border p-1"
                data-testid={`dimension-settings.guide.lines.list.${axis}`}
            >
                {values.length === 0 && (
                    <p className="p-1 text-xs text-muted-foreground">
                        {t("render.guide_settings.lines.empty")}
                    </p>
                )}
                {values.map((value, index) => (
                    <div
                        key={`${axis}-${index}`}
                        className="flex items-center gap-2 p-0.5"
                    >
                        <Input
                            type="number"
                            value={value}
                            step="any"
                            onChange={(e) => {
                                const next = e.currentTarget.valueAsNumber;
                                if (Number.isNaN(next)) {
                                    return;
                                }
                                onMoveLine(axis, index, next);
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="h-7 w-[110px]"
                            data-testid={`dimension-settings.guide.lines.${axis}.${index}`}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveLine(axis, index)}
                            data-testid={`dimension-settings.guide.lines.${axis}.${index}.delete`}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="grid gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                    {t("render.guide_settings.lines.title")}
                </p>
                <Switch
                    checked={lines.enabled}
                    onCheckedChange={(checked) =>
                        onChange({ enabled: checked })
                    }
                    data-testid="dimension-settings.guide.lines.enabled"
                />
            </div>

            {renderList("x", lines.xs)}
            {renderList("y", lines.ys)}

            <div className="grid gap-2 border-t pt-3">
                <p className="text-xs font-medium">
                    {t("render.guide_settings.lines.generate_title")}
                </p>

                <div className="flex flex-wrap items-end gap-2">
                    <div className="grid gap-1">
                        <Label className="text-xs">
                            {t("render.guide_settings.lines.axis")}
                        </Label>
                        <Select
                            value={genAxis}
                            onValueChange={(value: "x" | "y") =>
                                setGenAxis(value)
                            }
                        >
                            <SelectTrigger
                                className="w-[90px]"
                                data-testid="dimension-settings.guide.lines.gen.axis"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    value="x"
                                    data-testid="dimension-settings.guide.lines.gen.axis.x"
                                >
                                    {t(
                                        "render.guide_settings.lines.vertical"
                                    )}
                                </SelectItem>
                                <SelectItem
                                    value="y"
                                    data-testid="dimension-settings.guide.lines.gen.axis.y"
                                >
                                    {t(
                                        "render.guide_settings.lines.horizontal"
                                    )}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1">
                        <Label className="text-xs">
                            {t("render.guide_settings.lines.start")}
                        </Label>
                        <Input
                            type="number"
                            value={genStart}
                            step="any"
                            onChange={(e) => {
                                const v = e.currentTarget.valueAsNumber;
                                if (!Number.isNaN(v)) setGenStart(v);
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="h-8 w-[90px]"
                            data-testid="dimension-settings.guide.lines.gen.start"
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label className="text-xs">
                            {t("render.guide_settings.lines.interval")}
                        </Label>
                        <Input
                            type="number"
                            value={genInterval}
                            step="any"
                            onChange={(e) => {
                                const v = e.currentTarget.valueAsNumber;
                                if (!Number.isNaN(v)) setGenInterval(v);
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="h-8 w-[90px]"
                            data-testid="dimension-settings.guide.lines.gen.interval"
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label className="text-xs">
                            {t("render.guide_settings.lines.count")}
                        </Label>
                        <Input
                            type="number"
                            value={genCount}
                            min={1}
                            step={1}
                            onChange={(e) => {
                                const v = e.currentTarget.valueAsNumber;
                                if (!Number.isNaN(v)) setGenCount(v);
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="h-8 w-[80px]"
                            data-testid="dimension-settings.guide.lines.gen.count"
                        />
                    </div>

                    <Button
                        size="sm"
                        onClick={() =>
                            onGenerate({
                                axis: genAxis,
                                start: genStart,
                                interval: genInterval,
                                count: genCount,
                            })
                        }
                        data-testid="dimension-settings.guide.lines.gen.apply"
                    >
                        {t("render.guide_settings.lines.generate")}
                    </Button>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {t("render.guide_settings.lines.helper")}
            </p>
        </div>
    );
}
