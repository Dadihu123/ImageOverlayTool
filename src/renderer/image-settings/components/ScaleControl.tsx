import { useTranslation } from "react-i18next";
import { ZoomIn } from "lucide-react";

import { NumericInput } from "@/renderer/components/ui/numeric-input";
import { Slider } from "@/renderer/components/ui/slider";
import {
    SCALE_MAX,
    SCALE_MIN,
    SCALE_PERCENT_MAX,
    SCALE_PERCENT_MIN,
    SCALE_SLIDER_STEP,
    fromPercent,
    toPercent,
} from "@/shared/constants/imageTransform";

interface ScaleControlProps {
    /** 拡大/縮小倍率（1 = 等倍） */
    scale: number;
    onChange: (value: number) => void;
}

export function ScaleControl(props: ScaleControlProps) {
    const { scale, onChange } = props;
    const { t } = useTranslation();
    const label = t("render.image_settings.scale");

    return (
        <div className="flex items-center gap-3 mt-2">
            <span className="w-[68px] shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {label}
            </span>
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
                value={[scale]}
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={SCALE_SLIDER_STEP}
                onValueChange={(values) => onChange(values[0])}
                className="min-w-0 flex-grow"
                data-testid="settings.image-item.scale.slider"
            />
            <NumericInput
                value={toPercent(scale)}
                min={SCALE_PERCENT_MIN}
                max={SCALE_PERCENT_MAX}
                step={1}
                precision={2}
                aria-label={label}
                onCommit={(percent) => onChange(fromPercent(percent))}
                className="w-[62px]"
                data-testid="settings.image-item.scale.input"
            />
            <span className="shrink-0 text-xs text-muted-foreground">%</span>
        </div>
    );
}
