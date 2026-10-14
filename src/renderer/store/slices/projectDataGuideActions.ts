import { sanitizeGuideConfig } from "../../../shared/constants/guide";

import type {
    ProjectDataSlice,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataGuideActionsParams {
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

export const createProjectDataGuideActions = ({
    setProjectDataWithOrigin,
}: CreateProjectDataGuideActionsParams): Pick<
    ProjectDataSlice,
    "setGuides" | "receiveGuides" | "updateGuides"
> => ({
    setGuides: (guides) =>
        setProjectDataWithOrigin("local", {
            guides: sanitizeGuideConfig(guides),
            hasUnsavedChanges: true,
        }),

    receiveGuides: (guides) =>
        setProjectDataWithOrigin("remote", {
            guides: sanitizeGuideConfig(guides),
            hasUnsavedChanges: true,
        }),

    updateGuides: (patch) =>
        setProjectDataWithOrigin("local", (state) => ({
            guides: sanitizeGuideConfig(patch(state.guides)),
            hasUnsavedChanges: true,
        })),
});
