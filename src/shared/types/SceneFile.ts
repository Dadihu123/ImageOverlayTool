import type { AnchorPos } from "./AnchorPos";
import type { DimensionLine } from "./DimensionLine";
import type { GuideConfig } from "./Guide";
import type { ImageSet } from "./ImageSet";

export const SCENE_FILE_VERSION = "1.0.0";

export type SceneUnit = "nm" | "um" | "mm";

export interface SceneWindowSettings {
    color?: string;
    alwaysOnTop?: boolean;
    clickThrough?: boolean;
    showWindowFrame?: boolean;
}

export interface SceneCanvasState {
    x: number;
    y: number;
    scale: number;
}

export interface SceneImageInput {
    source: string;
    id?: string;
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface SceneFile {
    version: string;
    window?: SceneWindowSettings;
    unitFactor?: number;
    unit?: SceneUnit;
    canvas?: SceneCanvasState;
    imagePathAliases?: Record<string, string>;
    images: SceneImageInput[];
    dimensionLines?: DimensionLine[];
    /** 参考物（グリッド / 参考線 / 参考枠）設定 */
    guides?: GuideConfig;
}

export interface ResolvedSceneImage {
    path: string;
    id?: string;
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface ResolvedSceneFile {
    version: string;
    window?: SceneWindowSettings;
    unitFactor?: number;
    unit?: SceneUnit;
    canvas?: SceneCanvasState;
    imagePathAliases?: Record<string, string>;
    images: ResolvedSceneImage[];
    dimensionLines?: DimensionLine[];
    guides?: GuideConfig;
}
