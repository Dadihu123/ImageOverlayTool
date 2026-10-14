import { useTranslation } from "react-i18next";
import { RotateCw } from "lucide-react";

import { NumericInput } from "@/renderer/components/ui/numeric-input";
import { Slider } from "@/renderer/components/ui/slider";
import {
    ROTATION_MAX,
    ROTATION_MIN,
    ROTATION_SLIDER_STEP,
} from "@/shared/constants/imageTransform";

interface RotationControlProps {
    /** 回転角度（度） */
    rotation: number;
    onRotationChange: (value: number) => void;
}

export function RotationControl(props: RotationControlProps) {
    const { rotation, onRotationChange } = props;
    const { t } = useTranslation();
    const label = t("render.image_settings.rotation");

    return (
        <div className="flex items-center gap-3 mt-2">
            <span className="w-[68px] shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {label}
            </span>
            <RotateCw className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
                value={[rotation]}
                min={ROTATION_MIN}
                max={ROTATION_MAX}
                step={ROTATION_SLIDER_STEP}
                onValueChange={(values) => onRotationChange(values[0])}
                className="min-w-0 flex-grow"
                data-testid="settings.image-item.rotation.slider"
            />
            <NumericInput
                value={rotation}
                min={ROTATION_MIN}
                max={ROTATION_MAX}
                step={1}
                precision={1}
                aria-label={label}
                onCommit={onRotationChange}
                className="w-[62px]"
                data-testid="settings.image-item.rotation.input"
            />
            <span className="shrink-0 text-xs text-muted-foreground">°</span>
        </div>
    );
}
