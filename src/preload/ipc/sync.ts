import {
    syncEventContracts,
    syncIpcContracts,
} from "../../shared/ipc/contracts";
import type { Unit } from "../../shared/ipc/contracts/sync";
import type { DimensionLine } from "../../shared/types/DimensionLine";
import type { GuideConfig } from "../../shared/types/Guide";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { InteractionMode } from "../../shared/types/InteractionMode";
import { invokeIpcContract, onIpcEventContract } from "./client";

/**
 * 複数ウィンドウ間での状態同期に関するIPC通信APIの構築関数
 */
export const createSyncApi = () => ({
    updateImageSets: (imageSets: ImageSet[]) =>
        invokeIpcContract(syncIpcContracts.updateImageSets, imageSets),
    onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) =>
        onIpcEventContract(syncEventContracts.imageSetsUpdated, callback),
    updateDimensionLines: (dimensionLines: DimensionLine[]) =>
        invokeIpcContract(
            syncIpcContracts.updateDimensionLines,
            dimensionLines
        ),
    onDimensionLinesUpdated: (
        callback: (dimensionLines: DimensionLine[]) => void
    ) => onIpcEventContract(syncEventContracts.dimensionLinesUpdated, callback),
    updateGuides: (guides: GuideConfig) =>
        invokeIpcContract(syncIpcContracts.updateGuides, guides),
    onGuidesUpdated: (callback: (guides: GuideConfig) => void) =>
        onIpcEventContract(syncEventContracts.guidesUpdated, callback),
    updateUnit: (unit: Unit) =>
        invokeIpcContract(syncIpcContracts.updateUnit, unit),
    onUnitUpdated: (callback: (unit: Unit) => void) =>
        onIpcEventContract(syncEventContracts.unitUpdated, callback),
    updateInteractionMode: (mode: InteractionMode) =>
        invokeIpcContract(syncIpcContracts.updateInteractionMode, mode),
    onInteractionModeUpdated: (callback: (mode: InteractionMode) => void) =>
        onIpcEventContract(syncEventContracts.interactionModeUpdated, callback),
    updateUnitFactor: (unitFactor: number) =>
        invokeIpcContract(syncIpcContracts.updateUnitFactor, unitFactor),
    onUnitFactorUpdated: (callback: (unitFactor: number) => void) =>
        onIpcEventContract(syncEventContracts.unitFactorUpdated, callback),
    updateSelectedImageId: (id: string | null) =>
        invokeIpcContract(syncIpcContracts.updateSelectedImageId, id),
    onSelectedImageIdUpdated: (callback: (id: string | null) => void) =>
        onIpcEventContract(syncEventContracts.selectedImageIdUpdated, callback),
    updateSelectedDimensionLineId: (id: string | null) =>
        invokeIpcContract(syncIpcContracts.updateSelectedDimensionLineId, id),
    onSelectedDimensionLineIdUpdated: (callback: (id: string | null) => void) =>
        onIpcEventContract(
            syncEventContracts.selectedDimensionLineIdUpdated,
            callback
        ),
    updateProjectDirty: (isDirty: boolean) =>
        invokeIpcContract(syncIpcContracts.updateProjectDirty, isDirty),
    requestInitialState: () =>
        invokeIpcContract(syncIpcContracts.requestInitialState),
    onRequestStateSync: (callback: () => void) =>
        onIpcEventContract(syncEventContracts.requestStateSync, callback),
});
