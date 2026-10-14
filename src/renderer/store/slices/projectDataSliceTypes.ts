import type { StateCreator } from "zustand";

import type { DimensionLine } from "../../../shared/types/DimensionLine";
import type { GuideConfig } from "../../../shared/types/Guide";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { ProjectFile } from "../../../shared/types/ProjectFile";
import type {
    ProjectDataChangeOrigin,
    SyncOriginSlice,
} from "./createSyncOriginSlice";

export interface ProjectDataSlice {
    imageSets: ImageSet[];
    dimensionLines: DimensionLine[];
    guides: GuideConfig;
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    windowColor: string;
    hasUnsavedChanges: boolean;

    markProjectSaved: () => void;
    replaceImageSetsAfterSave: (imageSets: ImageSet[]) => void;

    setImageSets: (imageSets: ImageSet[]) => void;
    addImageSetWithPath: (
        path: string,
        options?: { sourceType?: ImageSet["sourceType"] }
    ) => void;
    updateImageSet: (payload: {
        index?: number;
        id?: string;
        imageSet: ImageSet;
    }) => void;
    syncImageSets: (imageSets: ImageSet[]) => void;
    receiveImageSets: (imageSets: ImageSet[]) => void;

    setDimensionLines: (lines: DimensionLine[]) => void;
    receiveDimensionLines: (lines: DimensionLine[]) => void;
    addDimensionLine: (line: DimensionLine) => void;
    updateDimensionLine: (line: DimensionLine) => void;
    removeDimensionLine: (id: string) => void;

    setGuides: (guides: GuideConfig) => void;
    receiveGuides: (guides: GuideConfig) => void;
    updateGuides: (patch: (guides: GuideConfig) => GuideConfig) => void;

    setUnitFactor: (factor: number) => void;
    syncUnitFactor: (factor: number) => void;

    setUnit: (unit: "nm" | "um" | "mm") => void;
    syncUnit: (unit: "nm" | "um" | "mm") => void;

    setWindowColor: (color: string) => void;

    loadProjectData: (project: ProjectFile<ImageSet>) => void;
    resetProjectData: () => void;
}

export type ProjectDataStoreState = ProjectDataSlice & SyncOriginSlice;

export type ProjectDataMutableFields = Pick<
    ProjectDataStoreState,
    | "imageSets"
    | "dimensionLines"
    | "guides"
    | "unitFactor"
    | "unit"
    | "windowColor"
    | "hasUnsavedChanges"
>;

export type ProjectDataPatch = Partial<ProjectDataMutableFields>;

export type SetProjectDataWithOrigin = (
    origin: ProjectDataChangeOrigin,
    patch:
        | ProjectDataPatch
        | ((state: ProjectDataStoreState) => ProjectDataPatch | null)
) => void;

export type ProjectDataSet = Parameters<
    StateCreator<ProjectDataStoreState, [], [], ProjectDataSlice>
>[0];
