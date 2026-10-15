import type { InteractionMode } from "@/shared/types/InteractionMode";
import { isToolInteractionMode } from "@/shared/types/InteractionMode";

export type PointerSession = "idle" | "stage_pan" | "tool_interaction";

export interface PointerPolicy {
    dragButtons: number[];
    stageDraggable: boolean;
}

/*
状態遷移（mousedown時）
- default モード: 左/中/右 -> stage_pan
- ツールモード（寸法線/参考物）: 左 -> tool_interaction
- ツールモード（寸法線/参考物）: 中/右 -> stage_pan

mouseup時
- 常に idle に戻す（呼び出し元で実施）
*/
const PAN_DRAG_BUTTONS = [1, 2];
const TOOL_DRAG_BUTTONS = [0];

export const resolvePointerButton = (evt: MouseEvent | TouchEvent): number => {
    return "button" in evt ? evt.button : 0;
};

// mousedown時に開始するポインターセッションを決定する。
export const resolveSessionOnMouseDown = (
    interactionMode: InteractionMode,
    pointerButton: number
): PointerSession => {
    if (!isToolInteractionMode(interactionMode)) {
        return "stage_pan";
    }
    if (pointerButton === 1 || pointerButton === 2) {
        return "stage_pan";
    }
    return "tool_interaction";
};

// 抽象的なセッション状態を、Konvaの具体的なドラッグ設定へ変換する。
export const resolvePointerPolicy = (
    interactionMode: InteractionMode,
    session: PointerSession
): PointerPolicy => {
    const shouldPan =
        !isToolInteractionMode(interactionMode) || session === "stage_pan";
    return {
        dragButtons: shouldPan ? PAN_DRAG_BUTTONS : TOOL_DRAG_BUTTONS,
        stageDraggable: shouldPan,
    };
};
