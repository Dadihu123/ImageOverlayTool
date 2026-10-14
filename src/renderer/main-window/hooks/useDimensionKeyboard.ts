import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
    selectDuplicateGuideRect,
    selectRemoveDimensionLine,
    selectRemoveGuideRect,
    selectSelectedDimensionLineId,
    selectSelectedGuideRectId,
    selectSetSelectedDimensionLineId,
    selectSetSelectedGuideRectId,
} from "../../store/selectors";

/**
 * テキスト入力中はショートカットを無効化する。
 * 設定パネルの数値入力で Backspace を押したときに
 * 参考物を消してしまうのを防ぐ。
 */
const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    const tag = target.tagName.toLowerCase();
    return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
    );
};

/**
 * 寸法線・参考枠モード時のキーボードイベントを処理するフック
 * - Delete / Backspace: 選択中の参考物を削除
 * - Ctrl/Cmd + D: 選択中の参考枠を複製
 */
export const useDimensionKeyboard = () => {
    const selectedDimensionLineId = useAppStore(
        selectSelectedDimensionLineId
    );
    const selectedGuideRectId = useAppStore(selectSelectedGuideRectId);
    const removeDimensionLine = useAppStore(selectRemoveDimensionLine);
    const removeGuideRect = useAppStore(selectRemoveGuideRect);
    const duplicateGuideRect = useAppStore(selectDuplicateGuideRect);
    const setSelectedDimensionLineId = useAppStore(
        selectSetSelectedDimensionLineId
    );
    const setSelectedGuideRectId = useAppStore(selectSetSelectedGuideRectId);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (isEditableTarget(e.target)) {
                return;
            }

            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                (selectedDimensionLineId || selectedGuideRectId)
            ) {
                e.preventDefault();
                if (selectedGuideRectId) {
                    removeGuideRect(selectedGuideRectId);
                    setSelectedGuideRectId(null);
                    return;
                }
                if (selectedDimensionLineId) {
                    removeDimensionLine(selectedDimensionLineId);
                    setSelectedDimensionLineId(null);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
                if (!selectedGuideRectId) {
                    return;
                }
                e.preventDefault();
                duplicateGuideRect(selectedGuideRectId);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        selectedDimensionLineId,
        selectedGuideRectId,
        removeDimensionLine,
        removeGuideRect,
        duplicateGuideRect,
        setSelectedDimensionLineId,
        setSelectedGuideRectId,
    ]);
};
