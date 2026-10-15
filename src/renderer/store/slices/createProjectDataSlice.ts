import type { StateCreator } from "zustand";

import { createEmptyImageSet } from "../../factories/imageSetFactory";
import { createDefaultGuideConfig } from "../../../shared/constants/guide";
import type { TemporalStoreAccessor } from "../temporalHistory";
import { createProjectDataBulkActions } from "./projectDataBulkActions";
import { createProjectDataDimensionActions } from "./projectDataDimensionActions";
import { createProjectDataGuideActions } from "./projectDataGuideActions";
import { createProjectDataImageSetActions } from "./projectDataImageSetActions";
import { createProjectDataMetaActions } from "./projectDataMetaActions";
import {
    PROJECT_DATA_DEFAULTS,
    createProjectDataSettingActions,
} from "./projectDataSettingActions";
import type {
    ProjectDataPatch,
    ProjectDataSlice,
    ProjectDataStoreState,
} from "./projectDataSliceTypes";
import type { ProjectDataChangeOrigin } from "./createSyncOriginSlice";

export type { ProjectDataSlice } from "./projectDataSliceTypes";

const createSetProjectDataWithOrigin = (
    set: Parameters<
        StateCreator<ProjectDataStoreState, [], [], ProjectDataSlice>
    >[0]
) => {
    return (
        origin: ProjectDataChangeOrigin,
        patch:
            | ProjectDataPatch
            | ((state: ProjectDataStoreState) => ProjectDataPatch | null)
    ) => {
        if (typeof patch === "function") {
            set((state) => {
                const result = patch(state);
                if (!result) {
                    return state;
                }
                return {
                    ...result,
                    projectDataChangeOrigin: origin,
                };
            });
            return;
        }

        set({
            ...patch,
            projectDataChangeOrigin: origin,
        });
    };
};

export const createProjectDataSlice = (
    getTemporal: TemporalStoreAccessor
): StateCreator<ProjectDataStoreState, [], [], ProjectDataSlice> => {
    return (set) => {
        const setProjectDataWithOrigin = createSetProjectDataWithOrigin(set);

        return {
            imageSets: [createEmptyImageSet()],
            dimensionLines: [],
            guides: createDefaultGuideConfig(),
            unitFactor: PROJECT_DATA_DEFAULTS.unitFactor,
            unit: PROJECT_DATA_DEFAULTS.unit,
            windowColor: PROJECT_DATA_DEFAULTS.windowColor,
            hasUnsavedChanges: false,

            ...createProjectDataMetaActions({
                getTemporal,
                set,
                setProjectDataWithOrigin,
            }),
            ...createProjectDataImageSetActions({
                getTemporal,
                setProjectDataWithOrigin,
            }),
            ...createProjectDataDimensionActions({
                setProjectDataWithOrigin,
            }),
            ...createProjectDataGuideActions({
                setProjectDataWithOrigin,
            }),
            ...createProjectDataSettingActions({
                getTemporal,
                setProjectDataWithOrigin,
            }),
            ...createProjectDataBulkActions({
                setProjectDataWithOrigin,
            }),
        };
    };
};
