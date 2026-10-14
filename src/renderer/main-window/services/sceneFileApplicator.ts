import { sanitizeUnitFactor } from "../../../shared/constants/unitFactor";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { LaunchIntent } from "../../../shared/types/LaunchIntent";
import type { ProjectFile } from "../../../shared/types/ProjectFile";
import type { ResolvedSceneFile } from "../../../shared/types/SceneFile";
import {
    createImageSet,
    toLocalFileUrl,
} from "../../factories/imageSetFactory";
import { useAppStore, type AppState } from "../../store/useAppStore";
import { runAsSystemMutation } from "../../store/temporalHistory";

const createIntentImageSet = (
    image: LaunchIntent["images"][number]
): ImageSet =>
    createImageSet({
        id: image.id,
        path: toLocalFileUrl(image.path),
        transparency: image.transparency,
        rotation: image.rotation,
        initAnchorPos: image.initAnchorPos,
        currentAnchorPos: image.currentAnchorPos,
        locked: image.locked,
        visible: image.visible,
        filters: image.filters,
    });

const buildProjectFromLaunchIntent = (
    launchIntent: LaunchIntent,
    current: AppState
): ProjectFile<ImageSet> => ({
    version: "1.0.0",
    window: {
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0,
        color: launchIntent.window?.color ?? current.windowColor,
    },
    settings: {
        unitFactor: sanitizeUnitFactor(
            launchIntent.unitFactor ?? current.unitFactor
        ),
        unit: launchIntent.unit ?? current.unit,
    },
    canvas: launchIntent.canvas ?? current.canvas,
    images: launchIntent.images.map((image) => createIntentImageSet(image)),
    dimensionLines: launchIntent.dimensionLines ?? [],
    ...(launchIntent.guides ? { guides: launchIntent.guides } : {}),
});

export const applyLaunchIntent = (launchIntent: LaunchIntent): void => {
    const current = useAppStore.getState();
    const project = buildProjectFromLaunchIntent(launchIntent, current);

    current.loadProject(project);

    runAsSystemMutation(
        () => useAppStore.temporal,
        () => {
            const state = useAppStore.getState();
            const alwaysOnTop = launchIntent.window?.alwaysOnTop ?? false;
            const clickThrough = launchIntent.window?.clickThrough ?? false;

            state.setAlwaysOnTopMode(alwaysOnTop);
            state.setClickThroughMode(clickThrough);

            if (launchIntent.window?.showWindowFrame !== undefined) {
                state.setWindowFrameVisible(
                    launchIntent.window.showWindowFrame
                );
            }

            state.setCurrentProjectFilePath(null);
            state.markProjectSaved();
        }
    );
};

const toLaunchIntentFromResolvedScene = (
    scene: ResolvedSceneFile
): LaunchIntent => {
    const alwaysOnTop = scene.window?.alwaysOnTop ?? false;

    return {
        window: {
            color: scene.window?.color,
            alwaysOnTop,
            clickThrough: alwaysOnTop && Boolean(scene.window?.clickThrough),
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
    };
};

export const applyResolvedSceneFile = (scene: ResolvedSceneFile): void => {
    applyLaunchIntent(toLaunchIntentFromResolvedScene(scene));
};
