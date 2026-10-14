import { Copy, Lock, Plus, Trash2, Unlock } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { Switch } from "@/renderer/components/ui/switch";
import { cn } from "@/renderer/utils/cn";
import {
    GUIDE_RECT_COLOR_DEFAULT,
    sanitizeHexColorOrDefault,
} from "@/shared/constants/guide";
import type { GuideRect } from "@/shared/types/Guide";
import type { WorldRect } from "@/renderer/main-window/utils/stageCoords";

interface GuideRectListItem {
    rect: GuideRect;
    world: WorldRect | null;
}

interface DimensionGuideRectSectionProps {
    rects: GuideRectListItem[];
    selectedRectId: string | null;
    baselineRectId: string | null;
    isDrawMode: boolean;
    onStartDraw: () => void;
    onCancelDraw: () => void;
    onSelectRect: (id: string) => void;
    onUpdateRect: (rect: GuideRect) => void;
    onDeleteRect: (id: string) => void;
    onDuplicateRect: (id: string) => void;
    onSetBaseline: (id: string | null) => void;
    t: (key: string, options?: Record<string, unknown>) => string;
}

const formatRectSize = (world: WorldRect | null): string => {
    if (!world) {
        return "-";
    }
    return `${world.width.toFixed(1)} x ${world.height.toFixed(1)} px`;
};

export function DimensionGuideRectSection({
    rects,
    selectedRectId,
    baselineRectId,
    isDrawMode,
    onStartDraw,
    onCancelDraw,
    onSelectRect,
    onUpdateRect,
    onDeleteRect,
    onDuplicateRect,
    onSetBaseline,
    t,
}: DimensionGuideRectSectionProps) {
    return (
        <div className="grid gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                    {t("render.guide_settings.rect.title")}
                </p>
                <div className="flex items-center gap-2">
                    {isDrawMode ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancelDraw}
                            data-testid="dimension-settings.guide.rect.cancel-draw"
                        >
                            {t("common.cancel")}
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={onStartDraw}
                            data-testid="dimension-settings.guide.rect.start-draw"
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            {t("render.guide_settings.rect.draw_button")}
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {t("render.guide_settings.rect.helper")}
            </p>

            <div
                className="max-h-72 overflow-y-auto rounded-lg border p-2"
                data-testid="dimension-settings.guide.rect.list"
            >
                {rects.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground">
                        {t("render.guide_settings.rect.empty")}
                    </p>
                )}

                {rects.map(({ rect, world }, index) => {
                    const isSelected = selectedRectId === rect.id;
                    const isBaseline = baselineRectId === rect.id;
                    const colorValue = sanitizeHexColorOrDefault(
                        rect.color,
                        GUIDE_RECT_COLOR_DEFAULT
                    );

                    return (
                        <div
                            key={rect.id}
                            className={cn(
                                "mb-2 grid gap-2 rounded-md border px-3 py-2 last:mb-0",
                                isSelected && "border-primary"
                            )}
                            onClick={() => onSelectRect(rect.id)}
                            onKeyDown={(event) => {
                                if (event.currentTarget !== event.target) {
                                    return;
                                }
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault();
                                    onSelectRect(rect.id);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            data-testid={`dimension-settings.guide.rect.${index}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {rect.label ||
                                            t(
                                                "render.guide_settings.rect.name",
                                                { index: index + 1 }
                                            )}
                                        {isBaseline && (
                                            <span className="ml-2 rounded bg-primary/15 px-1 text-xs text-primary">
                                                {t(
                                                    "render.guide_settings.rect.baseline_badge"
                                                )}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRectSize(world)}
                                    </p>
                                </div>

                                <Input
                                    type="color"
                                    value={colorValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                        onUpdateRect({
                                            ...rect,
                                            color: e.currentTarget.value,
                                        })
                                    }
                                    className="h-8 w-12 p-1"
                                    data-testid={`dimension-settings.guide.rect.${index}.color`}
                                />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateRect({
                                            ...rect,
                                            locked: !rect.locked,
                                        });
                                    }}
                                    title={t(
                                        rect.locked
                                            ? "render.guide_settings.rect.unlock"
                                            : "render.guide_settings.rect.lock"
                                    )}
                                    data-testid={`dimension-settings.guide.rect.${index}.lock`}
                                >
                                    {rect.locked ? (
                                        <Lock className="h-4 w-4" />
                                    ) : (
                                        <Unlock className="h-4 w-4" />
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicateRect(rect.id);
                                    }}
                                    title={t(
                                        "render.guide_settings.rect.duplicate"
                                    )}
                                    data-testid={`dimension-settings.guide.rect.${index}.duplicate`}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteRect(rect.id);
                                    }}
                                    data-testid={`dimension-settings.guide.rect.${index}.delete`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs whitespace-nowrap">
                                        {t(
                                            "render.guide_settings.rect.show_size_label"
                                        )}
                                    </Label>
                                    <Switch
                                        checked={rect.showSizeLabel !== false}
                                        onClick={(e) => e.stopPropagation()}
                                        onCheckedChange={(checked) =>
                                            onUpdateRect({
                                                ...rect,
                                                showSizeLabel: checked,
                                            })
                                        }
                                        data-testid={`dimension-settings.guide.rect.${index}.show-label`}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label className="text-xs whitespace-nowrap">
                                        {t(
                                            "render.guide_settings.rect.set_baseline"
                                        )}
                                    </Label>
                                    <Switch
                                        checked={isBaseline}
                                        onClick={(e) => e.stopPropagation()}
                                        onCheckedChange={(checked) =>
                                            onSetBaseline(
                                                checked ? rect.id : null
                                            )
                                        }
                                        data-testid={`dimension-settings.guide.rect.${index}.baseline`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
