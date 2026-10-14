import { RefObject, useCallback, useRef } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { setKonvaDragButtons } from "../utils/setKonvaDragButtons";
import {
    resolvePointerButton,
    resolvePointerPolicy,
    resolveSessionOnMouseDown,
    type PointerSession,
} from "./pointerSessionMachine";
import type { InteractionMode } from "../../../shared/types/InteractionMode";

interface UseStagePointerHandlersParams {
    stageRef: RefObject<Konva.Stage | null>;
    /**
     * 現在の操作モード。
     * 以前は真偽値に圧縮して受け取っていたが、モードが増えると
     * 誤判定するため、実際のモードをそのまま受け取る。
     */
    interactionMode: InteractionMode;
    setSelectedImageId: (id: string | null) => void;
    /** 左ドラッグで開始されるツール操作（寸法線 / 参考枠） */
    onToolMouseDown: (
        e: KonvaEventObject<MouseEvent | TouchEvent>
    ) => void;
    onToolMouseMove: () => void;
    onToolMouseUp: () => void;
    onUpdateStage: (newPos: { x: number; y: number; scale: number }) => void;
}

export const useStagePointerHandlers = ({
    stageRef,
    interactionMode,
    setSelectedImageId,
    onToolMouseDown,
    onToolMouseMove,
    onToolMouseUp,
    onUpdateStage,
}: UseStagePointerHandlersParams) => {
    const pointerSessionRef = useRef<PointerSession>("idle");

    const applyPointerPolicy = useCallback(
        (session: PointerSession) => {
            // 状態機械の出力をもとに、Konvaのドラッグボタン設定とStageのdraggableを切り替える。
            const policy = resolvePointerPolicy(interactionMode, session);
            setKonvaDragButtons(policy.dragButtons);
            stageRef.current?.draggable(policy.stageDraggable);
        },
        [interactionMode, stageRef]
    );

    const onDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            if (e.target.getType() === "Stage") {
                const stage = e.target as Konva.Stage;
                onUpdateStage({
                    x: stage.x(),
                    y: stage.y(),
                    scale: stage.scaleX(),
                });
            }
        },
        [onUpdateStage]
    );

    const onMouseDown = useCallback(
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            const pointerButton = resolvePointerButton(e.evt);
            const nextSession = resolveSessionOnMouseDown(
                interactionMode,
                pointerButton
            );
            pointerSessionRef.current = nextSession;
            applyPointerPolicy(nextSession);

            if (interactionMode === "default") {
                if (pointerButton === 0 && e.target.getType() === "Stage") {
                    setSelectedImageId(null);
                }
            }

            onToolMouseDown(e);
        },
        [
            applyPointerPolicy,
            interactionMode,
            onToolMouseDown,
            setSelectedImageId,
        ]
    );

    const onMouseMove = useCallback(() => {
        onToolMouseMove();
    }, [onToolMouseMove]);

    const onMouseUp = useCallback(() => {
        pointerSessionRef.current = "idle";
        applyPointerPolicy("idle");
        onToolMouseUp();
    }, [applyPointerPolicy, onToolMouseUp]);

    return { onDragEnd, onMouseDown, onMouseMove, onMouseUp };
};
