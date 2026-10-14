import { useEffect, useRef } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import {
    createProjectSyncBridge,
    type ProjectSyncBridge,
} from "../services/sync/createProjectSyncBridge";
import {
    createSyncBroadcaster,
    type ProjectSyncSnapshot,
} from "../services/sync/syncBroadcaster";
import { useAppStore } from "../store/useAppStore";
import {
    selectDimensionLines,
    selectGuides,
    selectImageSets,
    selectInteractionMode,
    selectProjectDataChangeOrigin,
    selectSelectedDimensionLineId,
    selectSelectedImageId,
    selectUnit,
    selectUnitFactor,
} from "../store/selectors";

/**
 * アプリケーション状態の同期を行うフック（送信側）。
 * 自身のZustand Storeの変更を監視し、変更があった場合に他のウィンドウへ差分をブロードキャストする。
 *
 * ローカル操作（ユーザーによる直接の操作）によって発生したデータ変更のみを送信対象とする。
 * これにより、他ウィンドウからの同期（受信）によって発生したStore変更が、
 * 再び送信されて無限ループに陥ることを防いでいる。
 */
export const useBroadcastProjectData = () => {
    const imageSets = useAppStore(selectImageSets);
    const dimensionLines = useAppStore(selectDimensionLines);
    const guides = useAppStore(selectGuides);
    const unitFactor = useAppStore(selectUnitFactor);
    const unit = useAppStore(selectUnit);
    const projectDataChangeOrigin = useAppStore(selectProjectDataChangeOrigin);
    const interactionMode = useAppStore(selectInteractionMode);
    const selectedImageId = useAppStore(selectSelectedImageId);
    const selectedDimensionLineId = useAppStore(selectSelectedDimensionLineId);
    const ipcService = useIpcService();

    const bridgeRef = useRef<ProjectSyncBridge | null>(null);
    const previousIpcServiceRef = useRef(ipcService);

    useEffect(() => {
        const snapshot: ProjectSyncSnapshot = {
            imageSets,
            dimensionLines,
            guides,
            unitFactor,
            unit,
            projectDataChangeOrigin,
            interactionMode,
            selectedImageId,
            selectedDimensionLineId,
        };

        if (
            !bridgeRef.current ||
            previousIpcServiceRef.current !== ipcService
        ) {
            bridgeRef.current = createProjectSyncBridge({
                initialSnapshot: snapshot,
                broadcaster: createSyncBroadcaster(ipcService),
            });
            previousIpcServiceRef.current = ipcService;
            return;
        }

        bridgeRef.current.sync(snapshot);
    }, [
        imageSets,
        dimensionLines,
        guides,
        unitFactor,
        unit,
        projectDataChangeOrigin,
        interactionMode,
        selectedImageId,
        selectedDimensionLineId,
        ipcService,
    ]);
};
