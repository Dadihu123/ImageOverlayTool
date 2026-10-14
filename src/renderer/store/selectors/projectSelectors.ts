import type { AppState } from "../useAppStore";

export const selectImageSets = (state: AppState) => state.imageSets;
export const selectSetImageSets = (state: AppState) => state.setImageSets;
export const selectUpdateImageSet = (state: AppState) => state.updateImageSet;
export const selectSyncImageSets = (state: AppState) => state.syncImageSets;
export const selectAddImageSetWithPath = (state: AppState) =>
    state.addImageSetWithPath;

export const selectDimensionLines = (state: AppState) => state.dimensionLines;
export const selectAddDimensionLine = (state: AppState) =>
    state.addDimensionLine;
export const selectUpdateDimensionLine = (state: AppState) =>
    state.updateDimensionLine;
export const selectRemoveDimensionLine = (state: AppState) =>
    state.removeDimensionLine;

export const selectGuides = (state: AppState) => state.guides;
export const selectSetGuides = (state: AppState) => state.setGuides;
export const selectUpdateGuides = (state: AppState) => state.updateGuides;
export const selectGuideGrid = (state: AppState) => state.guides.grid;
export const selectGuideLines = (state: AppState) => state.guides.lines;
export const selectGuideRects = (state: AppState) => state.guides.rects;
export const selectAddGuideRect = (state: AppState) => state.addGuideRect;
export const selectUpdateGuideRect = (state: AppState) => state.updateGuideRect;
export const selectRemoveGuideRect = (state: AppState) => state.removeGuideRect;
export const selectDuplicateGuideRect = (state: AppState) =>
    state.duplicateGuideRect;
export const selectSetBaselineGuideRectId = (state: AppState) =>
    state.setBaselineGuideRectId;

export const selectUnitFactor = (state: AppState) => state.unitFactor;
export const selectSetUnitFactor = (state: AppState) => state.setUnitFactor;
export const selectUnit = (state: AppState) => state.unit;
export const selectSetUnit = (state: AppState) => state.setUnit;
export const selectWindowColor = (state: AppState) => state.windowColor;
export const selectSetWindowColor = (state: AppState) => state.setWindowColor;
export const selectHasUnsavedChanges = (state: AppState) =>
    state.hasUnsavedChanges;

export const selectMarkProjectSaved = (state: AppState) =>
    state.markProjectSaved;
export const selectReplaceImageSetsAfterSave = (state: AppState) =>
    state.replaceImageSetsAfterSave;
