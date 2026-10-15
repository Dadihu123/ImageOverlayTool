import type { AppState } from "../../store/useAppStore";
import type { IIPCService } from "../ipcService";

type ProjectSyncIPC = Pick<
    IIPCService,
    | "updateImageSets"
    | "updateDimensionLines"
    | "updateGuides"
    | "updateUnitFactor"
    | "updateUnit"
    | "updateInteractionMode"
    | "updateSelectedImageId"
    | "updateSelectedDimensionLineId"
>;

export type ProjectSyncSnapshot = Pick<
    AppState,
    | "imageSets"
    | "dimensionLines"
    | "guides"
    | "unitFactor"
    | "unit"
    | "projectDataChangeOrigin"
    | "interactionMode"
    | "selectedImageId"
    | "selectedDimensionLineId"
>;

export const toProjectSyncSnapshot = (
    state: AppState
): ProjectSyncSnapshot => ({
    imageSets: state.imageSets,
    dimensionLines: state.dimensionLines,
    guides: state.guides,
    unitFactor: state.unitFactor,
    unit: state.unit,
    projectDataChangeOrigin: state.projectDataChangeOrigin,
    interactionMode: state.interactionMode,
    selectedImageId: state.selectedImageId,
    selectedDimensionLineId: state.selectedDimensionLineId,
});

/**
 * 他のウィンドウへ現在の状態（スナップショット）や差分を送信するための専用インターフェース。
 * `useBroadcastProjectData`（送信側）などで利用される。
 */
export interface SyncBroadcaster {
    /** 前回との差分を計算し、変更があった項目のみを送信する */
    broadcastDiff: (
        previous: ProjectSyncSnapshot,
        next: ProjectSyncSnapshot
    ) => void;
    /** 現在の状態を丸ごと（すべての項目を）送信する。新規ウィンドウが開いたときなどに呼ぶ */
    broadcastSnapshot: (snapshot: ProjectSyncSnapshot) => void;
    /** 画像データだけを送信する */
    broadcastImageSets: (imageSets: ProjectSyncSnapshot["imageSets"]) => void;
}

export const createSyncBroadcaster = (
    ipcService: ProjectSyncIPC
): SyncBroadcaster => ({
    broadcastDiff: (previous, next) => {
        // ① [Undo/Redo 対象のデータ]
        // ユーザーの手動操作（local）によって変更された場合のみ、他のウィンドウへ変更を伝播させる
        if (next.projectDataChangeOrigin === "local") {
            if (previous.imageSets !== next.imageSets) {
                void ipcService.updateImageSets(next.imageSets);
            }
            if (previous.dimensionLines !== next.dimensionLines) {
                void ipcService.updateDimensionLines(next.dimensionLines);
            }
            if (previous.guides !== next.guides) {
                void ipcService.updateGuides(next.guides);
            }
            if (previous.unitFactor !== next.unitFactor) {
                void ipcService.updateUnitFactor(next.unitFactor);
            }
            if (previous.unit !== next.unit) {
                void ipcService.updateUnit(next.unit);
            }
        }

        // ② [Undo/Redo 対象外のデータ]
        // これらのUI状態（選択中IDなど）は履歴管理されないため、originに関わらず
        // 変更があった瞬間（常に）別のウィンドウへと送信して同期（追従）させる
        if (previous.interactionMode !== next.interactionMode) {
            void ipcService.updateInteractionMode(next.interactionMode);
        }
        if (previous.selectedImageId !== next.selectedImageId) {
            void ipcService.updateSelectedImageId(next.selectedImageId);
        }
        if (previous.selectedDimensionLineId !== next.selectedDimensionLineId) {
            void ipcService.updateSelectedDimensionLineId(
                next.selectedDimensionLineId
            );
        }
    },
    broadcastSnapshot: (snapshot) => {
        void ipcService.updateImageSets(snapshot.imageSets);
        void ipcService.updateDimensionLines(snapshot.dimensionLines);
        void ipcService.updateGuides(snapshot.guides);
        void ipcService.updateUnitFactor(snapshot.unitFactor);
        void ipcService.updateUnit(snapshot.unit);
        void ipcService.updateInteractionMode(snapshot.interactionMode);
        void ipcService.updateSelectedImageId(snapshot.selectedImageId);
        void ipcService.updateSelectedDimensionLineId(
            snapshot.selectedDimensionLineId
        );
    },
    broadcastImageSets: (imageSets) => {
        void ipcService.updateImageSets(imageSets);
    },
});
