import {
    sanitizeUnitFactor,
    UNIT_FACTOR_DEFAULT,
} from "../../../shared/constants/unitFactor";
import {
    createDefaultGuideConfig,
    sanitizeGuideConfig,
} from "../../../shared/constants/guide";
import { createEmptyImageSet } from "../../factories/imageSetFactory";

import type {
    ProjectDataSlice,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataBulkActionsParams {
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

export const createProjectDataBulkActions = ({
    setProjectDataWithOrigin,
}: CreateProjectDataBulkActionsParams): Pick<
    ProjectDataSlice,
    "loadProjectData" | "resetProjectData"
> => ({
    loadProjectData: (project) => {
        const newImageSets = project.images.map((imageSet) => ({
            ...imageSet,
            sourceType: imageSet.sourceType ?? "file",
        }));
        const newDimensionLines = project.dimensionLines || [];
        const newGuides = project.guides
            ? sanitizeGuideConfig(project.guides)
            : createDefaultGuideConfig();
        const newUnitFactor = sanitizeUnitFactor(project.settings.unitFactor);
        const newUnit = project.settings.unit || "um";
        const newWindowColor = project.window.color;

        setProjectDataWithOrigin("local", {
            imageSets: newImageSets,
            dimensionLines: newDimensionLines,
            guides: newGuides,
            unitFactor: newUnitFactor,
            unit: newUnit,
            windowColor: newWindowColor,
            hasUnsavedChanges: false,
        });
    },

    resetProjectData: () => {
        const defaultImageSets = [createEmptyImageSet()];
        // windowColorは意図的に保持する（ユーザーの背景色設定を維持）
        setProjectDataWithOrigin("local", {
            imageSets: defaultImageSets,
            dimensionLines: [],
            guides: createDefaultGuideConfig(),
            unitFactor: UNIT_FACTOR_DEFAULT,
            unit: "um",
            hasUnsavedChanges: false,
        });
    },
});
