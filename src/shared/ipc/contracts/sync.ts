import type { DimensionLine } from "../../types/DimensionLine";
import type { GuideConfig } from "../../types/Guide";
import type { ImageSet } from "../../types/ImageSet";
import type { InteractionMode } from "../../types/InteractionMode";
import {
    defineEventContract,
    defineInvokeContract,
    type EventContract,
    type InvokeContract,
} from "../contract";
import { IPC_CHANNELS, IPC_EVENTS } from "../channels";

/** 長さの単位 */
export type Unit = "nm" | "um" | "mm";

/**
 * 複数ウィンドウ間での状態同期を依頼するためのIPC通信(Request/Response)の型定義群
 */
export type SyncInvokeContracts = {
    updateImageSets: InvokeContract<[imageSets: ImageSet[]], void>;
    updateDimensionLines: InvokeContract<
        [dimensionLines: DimensionLine[]],
        void
    >;
    updateGuides: InvokeContract<[guides: GuideConfig], void>;
    updateUnitFactor: InvokeContract<[unitFactor: number], void>;
    updateUnit: InvokeContract<[unit: Unit], void>;
    updateInteractionMode: InvokeContract<[mode: InteractionMode], void>;
    updateSelectedImageId: InvokeContract<[id: string | null], void>;
    updateSelectedDimensionLineId: InvokeContract<[id: string | null], void>;
    updateProjectDirty: InvokeContract<[isDirty: boolean], void>;
    requestInitialState: InvokeContract<[], void>;
};

/**
 * 複数ウィンドウ間での状態同期を通知するためのIPC通信(Publish/Subscribe)の型定義群
 */
export type SyncEventContracts = {
    imageSetsUpdated: EventContract<[imageSets: ImageSet[]]>;
    dimensionLinesUpdated: EventContract<[dimensionLines: DimensionLine[]]>;
    guidesUpdated: EventContract<[guides: GuideConfig]>;
    unitFactorUpdated: EventContract<[unitFactor: number]>;
    unitUpdated: EventContract<[unit: Unit]>;
    interactionModeUpdated: EventContract<[mode: InteractionMode]>;
    selectedImageIdUpdated: EventContract<[id: string | null]>;
    selectedDimensionLineIdUpdated: EventContract<[id: string | null]>;
    requestStateSync: EventContract<[]>;
};

/** 状態同期依頼関連IPC通信の契約定義オブジェクト */
export const syncIpcContracts: SyncInvokeContracts = {
    updateImageSets: defineInvokeContract(IPC_CHANNELS.sync.updateImageSets),
    updateDimensionLines: defineInvokeContract(
        IPC_CHANNELS.sync.updateDimensionLines
    ),
    updateGuides: defineInvokeContract(IPC_CHANNELS.sync.updateGuides),
    updateUnitFactor: defineInvokeContract(IPC_CHANNELS.sync.updateUnitFactor),
    updateUnit: defineInvokeContract(IPC_CHANNELS.sync.updateUnit),
    updateInteractionMode: defineInvokeContract(
        IPC_CHANNELS.sync.updateInteractionMode
    ),
    updateSelectedImageId: defineInvokeContract(
        IPC_CHANNELS.sync.updateSelectedImageId
    ),
    updateSelectedDimensionLineId: defineInvokeContract(
        IPC_CHANNELS.sync.updateSelectedDimensionLineId
    ),
    updateProjectDirty: defineInvokeContract(
        IPC_CHANNELS.sync.updateProjectDirty
    ),
    requestInitialState: defineInvokeContract(
        IPC_CHANNELS.sync.requestInitialState
    ),
};

/** 状態同期通知関連IPC通信の契約定義オブジェクト */
export const syncEventContracts: SyncEventContracts = {
    imageSetsUpdated: defineEventContract(IPC_EVENTS.imageSetsUpdated),
    dimensionLinesUpdated: defineEventContract(
        IPC_EVENTS.dimensionLinesUpdated
    ),
    guidesUpdated: defineEventContract(IPC_EVENTS.guidesUpdated),
    unitFactorUpdated: defineEventContract(IPC_EVENTS.unitFactorUpdated),
    unitUpdated: defineEventContract(IPC_EVENTS.unitUpdated),
    interactionModeUpdated: defineEventContract(
        IPC_EVENTS.interactionModeUpdated
    ),
    selectedImageIdUpdated: defineEventContract(
        IPC_EVENTS.selectedImageIdUpdated
    ),
    selectedDimensionLineIdUpdated: defineEventContract(
        IPC_EVENTS.selectedDimensionLineIdUpdated
    ),
    requestStateSync: defineEventContract(IPC_EVENTS.requestStateSync),
};
