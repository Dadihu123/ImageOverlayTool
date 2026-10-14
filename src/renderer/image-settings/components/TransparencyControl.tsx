import { useTranslation } from "react-i18next";

import { NumericInput } from "@/renderer/components/ui/numeric-input";
import { Slider } from "@/renderer/components/ui/slider";
import {
    TRANSPARENCY_MAX,
    TRANSPARENCY_MIN,
    TRANSPARENCY_PERCENT_MAX,
    TRANSPARENCY_PERCENT_MIN,
    TRANSPARENCY_SLIDER_STEP,
    fromPercent,
    toPercent,
} from "@/shared/constants/imageTransform";

interface TransparencyControlProps {
    /** 透過度（0 = 不透明, 1 = 完全透明） */
    transparency: number;
    onChange: (value: number) => void;
}

export function TransparencyControl(props: TransparencyControlProps) {
    const { transparency, onChange } = props;
    const { t } = useTranslation();
    const label = t("render.image_settings.transparency");

    return (
        <div className="flex items-center gap-3 mt-2">
            <span className="w-[68px] shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {label}
            </span>
            <Slider
                value={[transparency]}
                min={TRANSPARENCY_MIN}
                max={TRANSPARENCY_MAX}
                step={TRANSPARENCY_SLIDER_STEP}
                onValueChange={(values) => onChange(values[0])}
                className="min-w-0 flex-grow"
                data-testid="settings.image-item.transparency.slider"
            />
            <NumericInput
                value={toPercent(transparency)}
                min={TRANSPARENCY_PERCENT_MIN}
                max={TRANSPARENCY_PERCENT_MAX}
                step={1}
                precision={1}
                aria-label={label}
                onCommit={(percent) => onChange(fromPercent(percent))}
                className="w-[56px]"
                data-testid="settings.image-item.transparency.input"
            />
            <span className="shrink-0 text-xs text-muted-foreground">%</span>
        </div>
    );
}
