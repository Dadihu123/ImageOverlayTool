import { useCallback, useMemo } from "react";

import i18n from "../../../i18n/configs";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { createProjectCommandService } from "../services/projectCommandService";
import { getCurrentWindowState } from "../services/project/buildProjectFile";
import { useAppStore } from "../../store/useAppStore";
import {
    selectCurrentProjectFilePath,
    selectHasUnsavedChanges,
    selectLoadProject,
    selectMarkProjectSaved,
    selectReplaceImageSetsAfterSave,
    selectResetAll,
    selectSetCurrentProjectFilePath,
} from "../../store/selectors";

export const useProjectOperations = () => {
    const currentProjectFilePath = useAppStore(selectCurrentProjectFilePath);
    const hasUnsavedChanges = useAppStore(selectHasUnsavedChanges);
    const loadProject = useAppStore(selectLoadProject);
    const resetAll = useAppStore(selectResetAll);
    const setCurrentProjectFilePath = useAppStore(
        selectSetCurrentProjectFilePath
    );
    const markProjectSaved = useAppStore(selectMarkProjectSaved);
    const replaceImageSetsAfterSave = useAppStore(
        selectReplaceImageSetsAfterSave
    );

    const ipcService = useIpcService();

    const confirmWithNativeDialog = useCallback(
        async (message: string): Promise<boolean> => {
            try {
                return await ipcService.showConfirmDialog({
                    message,
                    title: i18n.t("render.menu_button.app_title"),
                });
            } catch {
                try {
                    return window.confirm(message);
                } catch {
                    return true;
                }
            }
        },
        [ipcService]
    );

    const projectCommands = useMemo(
        () =>
            createProjectCommandService({
                ipcService,
                readSnapshot: () => {
                    const {
                        unitFactor,
                        unit,
                        windowColor,
                        canvas,
                        imageSets,
                        dimensionLines,
                        guides,
                    } = useAppStore.getState();

                    return {
                        unitFactor,
                        unit,
                        windowColor,
                        canvas,
                        imageSets,
                        dimensionLines,
                        guides,
                    };
                },
                readCurrentProjectFilePath: () =>
                    useAppStore.getState().currentProjectFilePath,
                readWindowState: getCurrentWindowState,
                confirmCacheImageMaterialization: () =>
                    confirmWithNativeDialog(
                        i18n.t("render.project_save.cache_warning.confirm_move")
                    ),
                mutations: {
                    loadProject,
                    resetAll,
                    setCurrentProjectFilePath,
                    markProjectSaved,
                    replaceImageSetsAfterSave,
                },
            }),
        [
            ipcService,
            loadProject,
            resetAll,
            setCurrentProjectFilePath,
            markProjectSaved,
            replaceImageSetsAfterSave,
            confirmWithNativeDialog,
        ]
    );

    const confirmDiscardUnsavedChanges = async (): Promise<boolean> => {
        if (!hasUnsavedChanges) {
            return true;
        }

        return confirmWithNativeDialog(
            i18n.t("render.unsaved_changes.confirm_discard")
        );
    };

    return {
        currentProjectFilePath,
        newProject: async () => {
            if (!(await confirmDiscardUnsavedChanges())) {
                return;
            }
            await projectCommands.newProject();
        },
        openProject: async () => {
            if (!(await confirmDiscardUnsavedChanges())) {
                return;
            }
            await projectCommands.openProject();
        },
        openProjectFromPath: async (filePath: string) => {
            if (!(await confirmDiscardUnsavedChanges())) {
                return;
            }
            await projectCommands.openProjectFromPath(filePath);
        },
        saveProject: projectCommands.saveProject,
        saveProjectAs: projectCommands.saveProjectAs,
    };
};
