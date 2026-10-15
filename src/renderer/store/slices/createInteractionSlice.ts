import { StateCreator } from "zustand";
import type { InteractionMode } from "../../../shared/types/InteractionMode";
import { isToolInteractionMode } from "../../../shared/types/InteractionMode";

export interface InteractionSlice {
    interactionMode: InteractionMode;
    selectedImageId: string | null;
    selectedDimensionLineId: string | null;
    selectedGuideRectId: string | null;

    setInteractionMode: (mode: InteractionMode) => void;
    setSelectedImageId: (id: string | null) => void;
    setSelectedDimensionLineId: (id: string | null) => void;
    setSelectedGuideRectId: (id: string | null) => void;
    clearSelection: () => void;
}

export const createInteractionSlice: StateCreator<InteractionSlice> = (
    set
) => ({
    interactionMode: "default",
    selectedImageId: null,
    selectedDimensionLineId: null,
    selectedGuideRectId: null,

    setInteractionMode: (mode) =>
        set(() => {
            if (mode === "default") {
                return {
                    interactionMode: mode,
                    selectedDimensionLineId: null,
                    selectedGuideRectId: null,
                };
            }

            // 追加・描画モードに入るときは選択をすべて解除する
            if (mode === "dimension_add" || mode === "guide_rect_draw") {
                return {
                    interactionMode: mode,
                    selectedImageId: null,
                    selectedDimensionLineId: null,
                    selectedGuideRectId: null,
                };
            }

            // 選択モードでは画像選択のみ解除する
            return {
                interactionMode: mode,
                selectedImageId: null,
            };
        }),

    setSelectedImageId: (id) => {
        set({
            selectedImageId: id,
            // 画像選択時は他の選択を解除
            selectedDimensionLineId: null,
            selectedGuideRectId: null,
        });
    },

    setSelectedDimensionLineId: (id) =>
        set({
            selectedDimensionLineId: id,
            // 寸法線選択時は他の選択を解除
            selectedImageId: null,
            selectedGuideRectId: null,
        }),

    setSelectedGuideRectId: (id) =>
        set({
            selectedGuideRectId: id,
            // 参考枠選択時は他の選択を解除
            selectedImageId: null,
            selectedDimensionLineId: null,
        }),

    clearSelection: () => {
        set({
            selectedImageId: null,
            selectedDimensionLineId: null,
            selectedGuideRectId: null,
        });
    },
});

/** ツールモードかどうか（画像選択の同期可否判定などに使う） */
export const isToolMode = (mode: InteractionMode): boolean =>
    isToolInteractionMode(mode);
