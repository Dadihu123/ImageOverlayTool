import { ipcMain } from "electron";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { GuideConfig } from "../../../shared/types/Guide";
import { ImageSet } from "../../../shared/types/ImageSet";
import type { InteractionMode } from "../../../shared/types/InteractionMode";
import type { Unit } from "../../../shared/ipc/contracts/sync";
import {
    syncEventContracts,
    syncIpcContracts,
} from "../../../shared/ipc/contracts";
import log from "../../logger";
import { broadcastToOtherWindows } from "../../windows/broadcast";
import type { ImageSettingsWindowHandlerDependencies } from "./types";

const registerSyncBroadcastHandler = <TPayload>(
    windowManager: ImageSettingsWindowHandlerDependencies,
    args: {
        channel: string;
        event: string;
        formatLog: (payload: TPayload) => string;
    }
): void => {
    ipcMain.handle(args.channel, (event, payload: TPayload) => {
        log.debug(args.formatLog(payload));
        broadcastToOtherWindows(
            windowManager,
            event.sender.id,
            args.event,
            payload
        );
    });
};

/**
 * ドラッグによる画像や寸法線の変更、単位変更など、
 * 異なるウィンドウ(メイン / 設定ウィンドウ等)間で状態を同期するためのIPCハンドラーを登録します。
 *
 * あるウィンドウからの更新要求を受け取り、送信元以外のすべてのウィンドウへ状態をブロードキャストします。
 *
 * @param windowManager ウィンドウコレクションやプロジェクトのDirty状態を管理するオブジェクト
 */
export const registerSyncHandlers = (
    windowManager: ImageSettingsWindowHandlerDependencies
): void => {
    registerSyncBroadcastHandler<ImageSet[]>(windowManager, {
        channel: syncIpcContracts.updateImageSets.channel,
        event: syncEventContracts.imageSetsUpdated.event,
        formatLog: (imageSets) =>
            `[IPC] imageSets:update called with ${imageSets.length} images`,
    });
    registerSyncBroadcastHandler<DimensionLine[]>(windowManager, {
        channel: syncIpcContracts.updateDimensionLines.channel,
        event: syncEventContracts.dimensionLinesUpdated.event,
        formatLog: (dimensionLines) =>
            `[IPC] dimensionLines:update called with ${dimensionLines.length} lines`,
    });
    registerSyncBroadcastHandler<GuideConfig>(windowManager, {
        channel: syncIpcContracts.updateGuides.channel,
        event: syncEventContracts.guidesUpdated.event,
        formatLog: (guides) =>
            `[IPC] guides:update called with ${guides.rects.length} rects, ${guides.lines.xs.length}/${guides.lines.ys.length} lines`,
    });
    registerSyncBroadcastHandler<number>(windowManager, {
        channel: syncIpcContracts.updateUnitFactor.channel,
        event: syncEventContracts.unitFactorUpdated.event,
        formatLog: (unitFactor) =>
            `[IPC] unitFactor:update called with value: ${unitFactor}`,
    });
    registerSyncBroadcastHandler<Unit>(windowManager, {
        channel: syncIpcContracts.updateUnit.channel,
        event: syncEventContracts.unitUpdated.event,
        formatLog: (unit) => `[IPC] unit:update called with value: ${unit}`,
    });
    registerSyncBroadcastHandler<InteractionMode>(windowManager, {
        channel: syncIpcContracts.updateInteractionMode.channel,
        event: syncEventContracts.interactionModeUpdated.event,
        formatLog: (mode) =>
            `[IPC] interactionMode:update called with value: ${mode}`,
    });
    registerSyncBroadcastHandler<string | null>(windowManager, {
        channel: syncIpcContracts.updateSelectedImageId.channel,
        event: syncEventContracts.selectedImageIdUpdated.event,
        formatLog: (id) =>
            `[IPC] selectedImageId:update called with value: ${id}`,
    });
    registerSyncBroadcastHandler<string | null>(windowManager, {
        channel: syncIpcContracts.updateSelectedDimensionLineId.channel,
        event: syncEventContracts.selectedDimensionLineIdUpdated.event,
        formatLog: (id) =>
            `[IPC] selectedDimensionLineId:update called with value: ${id}`,
    });

    ipcMain.handle(
        syncIpcContracts.updateProjectDirty.channel,
        (_event, isDirty) => {
            windowManager.setProjectDirty(Boolean(isDirty));
        }
    );

    ipcMain.handle(syncIpcContracts.requestInitialState.channel, (event) => {
        log.debug("[IPC] state:requestInitial called");
        broadcastToOtherWindows(
            windowManager,
            event.sender.id,
            syncEventContracts.requestStateSync.event
        );
    });
};
