import type { LaunchIntent } from "../../shared/types/LaunchIntent";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";

export const CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING =
    "Scene window.clickThrough is ignored because window.alwaysOnTop is false.";

export interface ResolvedLaunchIntentResult {
    launchIntent: LaunchIntent;
    warnings: string[];
}

export const resolveLaunchIntentFromScene = (
    scene: ResolvedSceneFile
): ResolvedLaunchIntentResult => {
    const requestedAlwaysOnTop = scene.window?.alwaysOnTop ?? false;
    const requestedClickThrough = Boolean(scene.window?.clickThrough);
    const warnings: string[] = [];

    if (requestedClickThrough && !requestedAlwaysOnTop) {
        warnings.push(CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING);
    }

    return {
        launchIntent: {
            window: {
                color: scene.window?.color,
                alwaysOnTop: requestedAlwaysOnTop,
                clickThrough: requestedAlwaysOnTop && requestedClickThrough,
                showWindowFrame: scene.window?.showWindowFrame,
            },
            unitFactor: scene.unitFactor,
            unit: scene.unit,
            canvas: scene.canvas,
            images: scene.images.map((image) => ({
                ...image,
            })),
            dimensionLines: scene.dimensionLines?.map((line) => ({
                ...line,
            })),
            guides: scene.guides,
        },
        warnings,
    };
};
