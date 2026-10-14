import type { AppState } from "../useAppStore";

export const selectInteractionMode = (state: AppState) => state.interactionMode;
export const selectSetInteractionMode = (state: AppState) =>
    state.setInteractionMode;
export const selectSelectedImageId = (state: AppState) => state.selectedImageId;
export const selectSetSelectedImageId = (state: AppState) =>
    state.setSelectedImageId;
export const selectSelectedDimensionLineId = (state: AppState) =>
    state.selectedDimensionLineId;
export const selectSetSelectedDimensionLineId = (state: AppState) =>
    state.setSelectedDimensionLineId;
export const selectSelectedGuideRectId = (state: AppState) =>
    state.selectedGuideRectId;
export const selectSetSelectedGuideRectId = (state: AppState) =>
    state.setSelectedGuideRectId;
export const selectClearSelection = (state: AppState) => state.clearSelection;
