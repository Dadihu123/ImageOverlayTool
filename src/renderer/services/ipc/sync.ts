import type { DimensionLine } from "../../../shared/types/DimensionLine";
import type { GuideConfig } from "../../../shared/types/Guide";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { InteractionMode } from "../../../shared/types/InteractionMode";
import { getElectronApi } from "./electronApi";
import type { IElectronAPI, Unit } from "../../../shared/ipc/electronApi";

/**
 * レンダラープロセス内でウィンドウ間状態同期通信を担うサービスのインターフェース
 */
type SyncIPCService = Pick<
    IElectronAPI,
    | "updateImageSets"
    | "onImageSetsUpdated"
    | "updateDimensionLines"
    | "onDimensionLinesUpdated"
    | "updateGuides"
    | "onGuidesUpdated"
    | "updateUnitFactor"
    | "onUnitFactorUpdated"
    | "updateUnit"
    | "onUnitUpdated"
    | "updateInteractionMode"
    | "onInteractionModeUpdated"
    | "requestInitialState"
    | "onRequestStateSync"
    | "onAlwaysOnTopShortcutTriggered"
    | "onClickThroughShortcutTriggered"
    | "onFileOpen"
    | "onLaunchIntentApply"
    | "onAppControlCommandApply"
    | "updateSelectedImageId"
    | "onSelectedImageIdUpdated"
    | "updateSelectedDimensionLineId"
    | "onSelectedDimensionLineIdUpdated"
    | "updateProjectDirty"
>;

/**
 * 状態同期管理IPC通信サービスを生成して返します。
 */
export const createSyncIPCService = (): SyncIPCService => ({
    updateImageSets: (imageSets: ImageSet[]) =>
        getElectronApi().updateImageSets(imageSets),
    onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) =>
        getElectronApi().onImageSetsUpdated(callback),
    updateDimensionLines: (dimensionLines: DimensionLine[]) =>
        getElectronApi().updateDimensionLines(dimensionLines),
    onDimensionLinesUpdated: (
        callback: (dimensionLines: DimensionLine[]) => void
    ) => getElectronApi().onDimensionLinesUpdated(callback),
    updateGuides: (guides: GuideConfig) =>
        getElectronApi().updateGuides(guides),
    onGuidesUpdated: (callback: (guides: GuideConfig) => void) =>
        getElectronApi().onGuidesUpdated(callback),
    updateUnitFactor: (factor: number) =>
        getElectronApi().updateUnitFactor(factor),
    onUnitFactorUpdated: (callback: (factor: number) => void) =>
        getElectronApi().onUnitFactorUpdated(callback),
    updateUnit: (unit: Unit) => getElectronApi().updateUnit(unit),
    onUnitUpdated: (callback: (unit: Unit) => void) =>
        getElectronApi().onUnitUpdated(callback),
    updateInteractionMode: (mode: InteractionMode) =>
        getElectronApi().updateInteractionMode(mode),
    onInteractionModeUpdated: (callback: (mode: InteractionMode) => void) =>
        getElectronApi().onInteractionModeUpdated(callback),
    requestInitialState: () => getElectronApi().requestInitialState(),
    onRequestStateSync: (callback: () => void) =>
        getElectronApi().onRequestStateSync(callback),
    onAlwaysOnTopShortcutTriggered: (callback: () => void) =>
        getElectronApi().onAlwaysOnTopShortcutTriggered(callback),
    onClickThroughShortcutTriggered: (callback: () => void) =>
        getElectronApi().onClickThroughShortcutTriggered(callback),
    onFileOpen: (callback) => getElectronApi().onFileOpen(callback),
    onLaunchIntentApply: (callback) =>
        getElectronApi().onLaunchIntentApply(callback),
    onAppControlCommandApply: (callback) =>
        getElectronApi().onAppControlCommandApply(callback),
    updateSelectedImageId: (id: string | null) =>
        getElectronApi().updateSelectedImageId(id),
    onSelectedImageIdUpdated: (callback: (id: string | null) => void) =>
        getElectronApi().onSelectedImageIdUpdated(callback),
    updateSelectedDimensionLineId: (id: string | null) =>
        getElectronApi().updateSelectedDimensionLineId(id),
    onSelectedDimensionLineIdUpdated: (callback: (id: string | null) => void) =>
        getElectronApi().onSelectedDimensionLineIdUpdated(callback),
    updateProjectDirty: (isDirty: boolean) =>
        getElectronApi().updateProjectDirty(isDirty),
});
