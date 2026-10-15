import { create, type StoreApi } from "zustand";
import { temporal, type TemporalState } from "zundo";
import {
    ProjectDataSlice,
    createProjectDataSlice,
} from "./slices/createProjectDataSlice";
import { ViewSlice, createViewSlice } from "./slices/createViewSlice";
import {
    InteractionSlice,
    createInteractionSlice,
} from "./slices/createInteractionSlice";
import {
    AppConfigSlice,
    createAppConfigSlice,
} from "./slices/createAppConfigSlice";
import {
    SyncOriginSlice,
    createSyncOriginSlice,
} from "./slices/createSyncOriginSlice";

import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../../shared/types/ImageSet";
import { clearTemporalHistory, runAsSystemMutation } from "./temporalHistory";

type StoreActions = {
    currentProjectFilePath: string | null;
    setCurrentProjectFilePath: (filePath: string | null) => void;
    resetAll: () => void;
    loadProject: (project: ProjectFile<ImageSet>) => void;
};

type UndoSnapshot = Pick<
    AppState,
    | "imageSets"
    | "dimensionLines"
    | "guides"
    | "unitFactor"
    | "unit"
    | "windowColor"
    | "hasUnsavedChanges"
>;

export type AppState = ProjectDataSlice &
    SyncOriginSlice &
    AppConfigSlice &
    ViewSlice &
    InteractionSlice &
    StoreActions;

const temporalStoreRef: {
    current: StoreApi<TemporalState<unknown>> | undefined;
} = {
    current: undefined,
};

const isSameUndoSnapshot = (
    pastState: Partial<UndoSnapshot>,
    currentState: Partial<UndoSnapshot>
): boolean => {
    return (
        pastState.imageSets === currentState.imageSets &&
        pastState.dimensionLines === currentState.dimensionLines &&
        pastState.guides === currentState.guides &&
        pastState.unitFactor === currentState.unitFactor &&
        pastState.unit === currentState.unit &&
        pastState.windowColor === currentState.windowColor &&
        pastState.hasUnsavedChanges === currentState.hasUnsavedChanges
    );
};

// AppStore definition
export const useAppStore = create<AppState>()(
    temporal(
        (...args) => {
            const [set, get] = args;
            const getTemporal = () => temporalStoreRef.current;

            const clearHistory = () => {
                clearTemporalHistory(getTemporal);
            };

            const withHistoryPaused = (fn: () => void) => {
                runAsSystemMutation(getTemporal, fn);
            };

            return {
                ...createSyncOriginSlice(...args),
                ...createProjectDataSlice(getTemporal)(...args),
                ...createAppConfigSlice(...args),
                ...createViewSlice(...args),
                ...createInteractionSlice(...args),

                currentProjectFilePath: null,
                setCurrentProjectFilePath: (filePath: string | null) =>
                    set({ currentProjectFilePath: filePath }),

                loadProject: (project: ProjectFile<ImageSet>) => {
                    withHistoryPaused(() => {
                        // プロジェクトデータをロード (ProjectDataSlice)
                        get().loadProjectData(project);
                        // View情報をロード (ViewSlice)
                        if (project.canvas) {
                            get().setCanvasState(project.canvas);
                        } else {
                            get().resetView();
                        }
                        // 選択状態などをリセット
                        get().clearSelection();
                        get().setInteractionMode("default");
                    });

                    // 履歴をクリア
                    clearHistory();
                },

                resetAll: () => {
                    withHistoryPaused(() => {
                        get().resetProjectData();
                        get().resetView();
                        get().clearSelection();
                        get().setInteractionMode("default");
                        get().setCurrentProjectFilePath(null);
                    });

                    // 履歴をクリア
                    clearHistory();
                },
            };
        },
        {
            partialize: (state) => {
                const {
                    imageSets,
                    dimensionLines,
                    guides,
                    unitFactor,
                    unit,
                    windowColor,
                    hasUnsavedChanges,
                } = state;
                return {
                    imageSets,
                    dimensionLines,
                    guides,
                    unitFactor,
                    unit,
                    windowColor,
                    hasUnsavedChanges,
                };
            },
            equality: isSameUndoSnapshot,
            limit: 50,
        }
    )
);

temporalStoreRef.current = useAppStore.temporal;
