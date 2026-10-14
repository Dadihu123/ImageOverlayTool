import { useTranslation } from "react-i18next";
import { RefreshCcw, Save } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import type { ImageSet } from "@/shared/types/ImageSet";
import { RotationControl } from "./RotationControl";
import { ScaleControl } from "./ScaleControl";
import { TransparencyControl } from "./TransparencyControl";
import { FilterControl } from "./FilterControl";
import { MissingImageWarning } from "./MissingImageWarning";

interface ImageListItemControlsProps {
    imageSet: ImageSet;
    isMissing: boolean;
    isCacheImage: boolean;
    imageScale: number;
    filters: NonNullable<ImageSet["filters"]>;
    onRelinkMissingImage: () => void;
    onChangeTransparency: (value: number) => void;
    onChangeScale: (value: number) => void;
    onChangeRotation: (value: number) => void;
    onResetTransformation: () => void;
    onChangeFilters: (filters: ImageSet["filters"]) => void;
    onSaveCacheImageAs: () => void;
}

export function ImageListItemControls({
    imageSet,
    isMissing,
    isCacheImage,
    imageScale,
    filters,
    onRelinkMissingImage,
    onChangeTransparency,
    onChangeScale,
    onChangeRotation,
    onResetTransformation,
    onChangeFilters,
    onSaveCacheImageAs,
}: ImageListItemControlsProps) {
    const { t } = useTranslation();

    return (
        <>
            {isMissing && (
                <MissingImageWarning
                    message={t("render.image_settings.missing_file")}
                    relinkLabel={t("render.image_settings.relink")}
                    onRelink={onRelinkMissingImage}
                />
            )}

            {imageSet.path && !isMissing && (
                <TransparencyControl
                    transparency={imageSet.transparency}
                    onChange={onChangeTransparency}
                />
            )}

            {imageSet.path &&
                !isMissing &&
                imageSet.initAnchorPos &&
                imageSet.currentAnchorPos && (
                    <ScaleControl scale={imageScale} onChange={onChangeScale} />
                )}

            {imageSet.path && !isMissing && imageSet.currentAnchorPos && (
                <RotationControl
                    rotation={imageSet.rotation || 0}
                    onRotationChange={onChangeRotation}
                />
            )}

            {imageSet.path && !isMissing && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={onResetTransformation}
                        data-testid="settings.image-item.reset-transformation"
                        title={t(
                            "render.image_settings.tooltip.reset_transformation"
                        )}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t("render.image_settings.reset_transformation")}
                    </Button>

                    <div className="flex-1">
                        <FilterControl
                            filters={filters}
                            onFilterChange={onChangeFilters}
                        />
                    </div>
                </div>
            )}

            {isCacheImage && imageSet.path && !isMissing && (
                <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={onSaveCacheImageAs}
                    data-testid="settings.image-item.save-cache-image-as"
                    title={t(
                        "render.image_settings.tooltip.save_cache_image_as"
                    )}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {t("render.image_settings.tooltip.save_cache_image_as")}
                </Button>
            )}
        </>
    );
}
