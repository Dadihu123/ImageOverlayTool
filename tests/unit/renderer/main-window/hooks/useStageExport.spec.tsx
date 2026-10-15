/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import type Konva from "konva";

import { useStageExport } from "@/renderer/main-window/hooks/useStageExport";
import { IpcServiceProvider } from "@/renderer/providers/IpcServiceProvider";
import { MockIPCService } from "../../../support/mocks/MockIPCService";

interface LayerStub {
    name: () => string;
    visible: (value?: boolean) => boolean | void;
}

const createLayer = (name: string): LayerStub => {
    let visible = true;
    return {
        name: () => name,
        visible: (value?: boolean) => {
            if (value === undefined) {
                return visible;
            }
            visible = value;
            return visible;
        },
    };
};

const createStageStub = (layers: LayerStub[]) =>
    ({
        getLayers: () => layers,
        batchDraw: vi.fn(),
        toDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
    }) as unknown as Konva.Stage;

const renderExport = (stage: Konva.Stage | null, ipc: MockIPCService) => {
    const setUIHidden = vi.fn();
    const { result } = renderHook(
        () =>
            useStageExport({
                stageRef: { current: stage } as RefObject<Konva.Stage | null>,
                setUIHidden,
            }),
        {
            wrapper: ({ children }) => (
                <IpcServiceProvider service={ipc}>{children}</IpcServiceProvider>
            ),
        }
    );
    return { result, setUIHidden };
};

describe("useStageExport", () => {
    let ipc: MockIPCService;

    beforeEach(() => {
        ipc = new MockIPCService();
    });

    it("hides guide layers while exporting the canvas and restores them", async () => {
        const guideLayer = createLayer("guideLayer");
        const imageLayer = createLayer("");
        const stage = createStageStub([guideLayer, imageLayer]);

        let visibleDuringExport: boolean | undefined;
        (stage as unknown as { toDataURL: () => string }).toDataURL = vi.fn(
            () => {
                visibleDuringExport = guideLayer.visible() as boolean;
                return "data:image/png;base64,AAAA";
            }
        );

        const { result } = renderExport(stage, ipc);

        await result.current.exportImage(false);

        // 書き出し中は参考物が隠れている
        expect(visibleDuringExport).toBe(false);
        // 画像レイヤーは触らない
        expect(imageLayer.visible()).toBe(true);
        // 書き出し後は元に戻る
        expect(guideLayer.visible()).toBe(true);
        expect(ipc.saveImageCalls).toHaveLength(1);
    });

    it("restores guide visibility even when saving fails", async () => {
        const guideLayer = createLayer("guideLayer");
        const stage = createStageStub([guideLayer]);

        ipc.saveImage = vi.fn(async () => {
            throw new Error("save failed");
        });

        const { result } = renderExport(stage, ipc);

        await expect(result.current.exportImage(false)).rejects.toThrow(
            "save failed"
        );

        expect(guideLayer.visible()).toBe(true);
    });

    it("hides guides for window capture exports too", async () => {
        const guideLayer = createLayer("guideLayer");
        const stage = createStageStub([guideLayer]);
        const captureSpy = vi.fn(async () => {
            expect(guideLayer.visible()).toBe(false);
            return { filePath: "x.png", width: 1, height: 1 };
        });
        ipc.captureWindow = captureSpy;

        const { result, setUIHidden } = renderExport(stage, ipc);

        await result.current.exportImage(true);

        expect(captureSpy).toHaveBeenCalledTimes(1);
        expect(guideLayer.visible()).toBe(true);
        expect(setUIHidden).toHaveBeenCalledWith(true);
        expect(setUIHidden).toHaveBeenLastCalledWith(false);
    });

    it("no-ops when the stage is unavailable", async () => {
        const { result } = renderExport(null, ipc);
        await result.current.exportImage(false);
        expect(ipc.saveImageCalls).toHaveLength(0);
    });
});
