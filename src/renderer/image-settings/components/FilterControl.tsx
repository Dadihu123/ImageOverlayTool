import React from "react";
import { useTranslation } from "react-i18next";
import { Settings2 } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/renderer/components/ui/popover";
import { Switch } from "@/renderer/components/ui/switch";
import { Label } from "@/renderer/components/ui/label";
import { Slider } from "@/renderer/components/ui/slider";
import { NumericInput } from "@/renderer/components/ui/numeric-input";
import { ImageSet } from "../../../shared/types/ImageSet";

/** 各フィルタパラメータの許容範囲（スライダーと数値入力で共有） */
const THRESHOLD_RANGE = { min: 0, max: 255, step: 1 } as const;
const HUE_RANGE = { min: -180, max: 180, step: 1 } as const;
const SATURATION_RANGE = { min: -100, max: 100, step: 1 } as const;
const VALUE_RANGE = { min: -100, max: 100, step: 1 } as const;

interface FilterControlProps {
    filters: ImageSet["filters"];
    onFilterChange: (filters: ImageSet["filters"]) => void;
}

/**
 * スライダーと数値入力を並べた 1 行分のコントロール。
 * 数値入力からは厳密な値を、スライダーからは直感的な操作を得る。
 */
function FilterSliderRow(props: {
    label: string;
    value: number;
    range: { min: number; max: number; step: number };
    testId: string;
    onValueChange: (value: number) => void;
}) {
    const { label, value, range, testId, onValueChange } = props;

    return (
        <div className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">{label}</Label>
                <NumericInput
                    value={value}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    precision={0}
                    aria-label={label}
                    onCommit={onValueChange}
                    className="w-[64px]"
                    data-testid={`${testId}.input`}
                />
            </div>
            <Slider
                min={range.min}
                max={range.max}
                step={range.step}
                value={[value]}
                data-testid={testId}
                onValueChange={(val) => onValueChange(val[0])}
            />
        </div>
    );
}

export function FilterControl({ filters, onFilterChange }: FilterControlProps) {
    const { t } = useTranslation();

    // デフォルト値の安全な取得
    const binarization = filters?.binarization ?? {
        enabled: false,
        threshold: 128,
    };
    const hsv = filters?.hsv ?? { enabled: false, h: 0, s: 0, v: 0 };

    const handleBinarizationChange = (
        updates: Partial<typeof binarization>
    ) => {
        onFilterChange({
            ...filters,
            binarization: { ...binarization, ...updates },
        });
    };

    const handleHSVChange = (updates: Partial<typeof hsv>) => {
        onFilterChange({
            ...filters,
            hsv: { ...hsv, ...updates },
        });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid="settings.filters.trigger"
                >
                    <Settings2 className="mr-2 h-4 w-4" />
                    {t("render.image_settings.filters")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            {t("render.image_settings.filters")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {/* 必要なら説明文 */}
                        </p>
                    </div>

                    {/* 2値化 */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="binarization-switch">
                                {t("render.image_settings.binarization")}
                            </Label>
                            <Switch
                                id="binarization-switch"
                                checked={binarization.enabled}
                                data-testid="settings.filters.binarization.switch"
                                onCheckedChange={(checked) =>
                                    handleBinarizationChange({
                                        enabled: checked,
                                    })
                                }
                            />
                        </div>
                        {binarization.enabled && (
                            <div className="ml-2 border-l pl-4 grid gap-2">
                                <FilterSliderRow
                                    label={t("render.image_settings.threshold")}
                                    value={binarization.threshold}
                                    range={THRESHOLD_RANGE}
                                    testId="settings.filters.binarization.threshold"
                                    onValueChange={(threshold) =>
                                        handleBinarizationChange({ threshold })
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* HSV */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="hsv-switch">
                                {t("render.image_settings.hsv")}
                            </Label>
                            <Switch
                                id="hsv-switch"
                                checked={hsv.enabled}
                                data-testid="settings.filters.hsv.switch"
                                onCheckedChange={(checked) =>
                                    handleHSVChange({ enabled: checked })
                                }
                            />
                        </div>
                        {hsv.enabled && (
                            <div className="ml-2 border-l pl-4 grid gap-3">
                                <FilterSliderRow
                                    label={t("render.image_settings.hue")}
                                    value={hsv.h}
                                    range={HUE_RANGE}
                                    testId="settings.filters.hsv.h"
                                    onValueChange={(h) => handleHSVChange({ h })}
                                />
                                <FilterSliderRow
                                    label={t("render.image_settings.saturation")}
                                    value={hsv.s}
                                    range={SATURATION_RANGE}
                                    testId="settings.filters.hsv.s"
                                    onValueChange={(s) => handleHSVChange({ s })}
                                />
                                <FilterSliderRow
                                    label={t("render.image_settings.value")}
                                    value={hsv.v}
                                    range={VALUE_RANGE}
                                    testId="settings.filters.hsv.v"
                                    onValueChange={(v) => handleHSVChange({ v })}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
