import { useEffect } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

/**
 * アプリケーション状態の同期を行うフック（受信側）。
 * 他のウィンドウで発生した変更（ブロードキャスト）をIPC経由で受け取り、自身のZustand Storeを更新する。
 */
export const useReceiveProjectData = () => {
    const ipcService = useIpcService();

    useEffect(() => {
        const unsubscribeUnitFactor = ipcService.onUnitFactorUpdated(
            (unitFactor) => {
                useAppStore.getState().syncUnitFactor(unitFactor);
            }
        );

        const unsubscribeUnit = ipcService.onUnitUpdated((unit) => {
            useAppStore.getState().syncUnit(unit);
        });

        // imageSetsの更新監視
        // receiveImageSetsを使用することで、ローカル操作（変更元）として扱わず、
        // かつUndo/Redoの履歴（Temporal）に自動的に積まれるようにしている
        const unsubscribeImageSets = ipcService.onImageSetsUpdated(
            (imageSets) => {
                useAppStore.getState().receiveImageSets(imageSets);
            }
        );

        const unsubscribeDimensionLines = ipcService.onDimensionLinesUpdated(
            (dimensionLines) => {
                useAppStore.getState().receiveDimensionLines(dimensionLines);
            }
        );

        const unsubscribeGuides = ipcService.onGuidesUpdated((guides) => {
            useAppStore.getState().receiveGuides(guides);
        });

        // 選択画像の更新監視
        // 寸法線操作中（selectedDimensionLineIdが存在する状態）は、
        // setSelectedImageIdが呼ばれると連動して寸法線の選択状態が解除されてしまうため
        // リモートからの画像選択の変更（同期）をあえて無視する仕様になっている
        const unsubscribeSelectedImageId = ipcService.onSelectedImageIdUpdated(
            (id) => {
                const { interactionMode } = useAppStore.getState();
                if (interactionMode === "default") {
                    useAppStore.getState().setSelectedImageId(id);
                }
            }
        );

        const unsubscribeSelectedDimensionLineId =
            ipcService.onSelectedDimensionLineIdUpdated((id) => {
                useAppStore.getState().setSelectedDimensionLineId(id);
            });

        const unsubscribeInteractionMode = ipcService.onInteractionModeUpdated(
            (mode) => {
                useAppStore.getState().setInteractionMode(mode);
            }
        );

        return () => {
            unsubscribeUnitFactor();
            unsubscribeUnit();
            unsubscribeImageSets();
            unsubscribeDimensionLines();
            unsubscribeGuides();
            unsubscribeSelectedImageId();
            unsubscribeSelectedDimensionLineId();
            unsubscribeInteractionMode();
        };
    }, [ipcService]);
};
