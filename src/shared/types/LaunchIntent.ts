import type { DimensionLine } from "./DimensionLine";
import type { GuideConfig } from "./Guide";
import type {
    ResolvedSceneImage,
    SceneCanvasState,
    SceneUnit,
    SceneWindowSettings,
} from "./SceneFile";

export type LaunchIntentImage = ResolvedSceneImage;

export interface LaunchIntent {
    window?: SceneWindowSettings;
    unitFactor?: number;
    unit?: SceneUnit;
    canvas?: SceneCanvasState;
    images: LaunchIntentImage[];
    dimensionLines?: DimensionLine[];
    guides?: GuideConfig;
}
