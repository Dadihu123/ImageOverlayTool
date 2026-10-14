import { RefObject } from "react";
import Konva from "konva";

import { useIpcService } from "../../providers/IpcServiceProvider";

interface UseStageExportParams {
    stageRef: RefObject<Konva.Stage | null>;
    setUIHidden: (hidden: boolean) => void;
}

/**
 * 参考物（グリッド / 参考線 / 参考枠）を一時的に隠す。
 *
 * 書き出した画像に参考物が写り込まないようにするため、
 * 対象のレイヤーを visible(false) にして後で元へ戻す。
 */
const withGuidesHidden = async <T,>(
    stage: Konva.Stage,
    run: () => Promise<T> | T
): Promise<T> => {
    const layers = stage.getLayers();
    const previous = layers.map((layer) => layer.visible());

    // 参考物は name で識別する（画像レイヤーは対象外）
    layers.forEach((layer) => {
        if (layer.name() === "guideLayer") {
            layer.visible(false);
        }
    });
    stage.batchDraw();

    try {
        return await run();
    } finally {
        layers.forEach((layer, index) => layer.visible(previous[index]));
        stage.batchDraw();
    }
};

export const useStageExport = ({
    stageRef,
    setUIHidden,
}: UseStageExportParams) => {
    const ipcService = useIpcService();

    const exportImage = async (includeBackground: boolean) => {
        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        if (includeBackground) {
            setUIHidden(true);
            await new Promise((resolve) => setTimeout(resolve, 500));

            try {
                // ウィンドウ全体を撮るため、参考物も明示的に隠す必要がある
                await withGuidesHidden(stage, () => ipcService.captureWindow());
            } finally {
                setUIHidden(false);
            }
            return;
        }

        await withGuidesHidden(stage, () => {
            const dataUrl = stage.toDataURL({ pixelRatio: 2 });
            return ipcService.saveImage(dataUrl);
        });
    };

    return { exportImage };
};
