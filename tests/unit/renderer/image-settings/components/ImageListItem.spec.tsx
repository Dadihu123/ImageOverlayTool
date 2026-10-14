/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ImageListItem } from "@/renderer/image-settings/components/ImageListItem";
import { IpcServiceProvider } from "@/renderer/providers/IpcServiceProvider";
import { useAppStore } from "@/renderer/store/useAppStore";
import type { ImageFileStatus } from "@/renderer/hooks/useImageFileStatus";
import { MockIPCService } from "../../../support/mocks/MockIPCService";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/image-settings/components/ImageItemHeader", () => ({
    ImageItemHeader: (props: any) => (
        <div>
            <button data-testid="header-open" onClick={props.onFileOpen}>
                open
            </button>
            <button data-testid="header-delete" onClick={props.onDelete}>
                delete
            </button>
            <button data-testid="header-lock" onClick={props.onToggleLock}>
                lock
            </button>
            <button data-testid="header-visible" onClick={props.onToggleVisible}>
                visible
            </button>
            <span>{props.fileName}</span>
        </div>
    ),
}));

vi.mock("@/renderer/image-settings/components/RotationControl", () => ({
    RotationControl: (props: any) => (
        <div>
            <button
                data-testid="rotation-slider"
                onClick={() => props.onRotationChange(45)}
            >
                rotate
            </button>
            <input
                data-testid="rotation-input"
                onChange={(event) =>
                    props.onRotationChange(Number(event.target.value))
                }
            />
        </div>
    ),
}));

vi.mock("@/renderer/image-settings/components/ScaleControl", () => ({
    ScaleControl: (props: any) => (
        <button data-testid="scale-control" onClick={() => props.onChange(2)}>
            scale
        </button>
    ),
}));

vi.mock("@/renderer/image-settings/components/TransparencyControl", () => ({
    TransparencyControl: (props: any) => (
        <button
            data-testid="transparency-control"
            onClick={() => props.onChange(0.2)}
        >
            transparency
        </button>
    ),
}));

vi.mock("@/renderer/image-settings/components/FilterControl", () => ({
    FilterControl: (props: any) => (
        <button
            data-testid="filter-control"
            onClick={() =>
                props.onFilterChange({
                    binarization: { enabled: true, threshold: 150 },
                    hsv: { enabled: true, h: 1, s: 2, v: 3 },
                })
            }
        >
            filter
        </button>
    ),
}));

describe("ImageListItem", () => {
    const initAnchorPos = {
        lt: { x: 0, y: 0 },
        rt: { x: 10, y: 0 },
        rb: { x: 10, y: 10 },
        lb: { x: 0, y: 10 },
    };

    const createImageSet = () => ({
        id: "image-1",
        path: "local-file://C:/old.png",
        transparency: 0.7,
        rotation: 35,
        initAnchorPos,
        currentAnchorPos: {
            lt: { x: 2, y: 2 },
            rt: { x: 14, y: 1 },
            rb: { x: 13, y: 13 },
            lb: { x: 1, y: 12 },
        },
        locked: false,
        visible: true,
        filters: {
            binarization: { enabled: false, threshold: 128 },
            hsv: { enabled: false, h: 0, s: 0, v: 0 },
        },
    });

    const renderItem = (
        service: MockIPCService,
        fileStatus?: ImageFileStatus
    ) => {
        const imageSet = useAppStore.getState().imageSets[0];
        return render(
            <IpcServiceProvider service={service}>
                <ImageListItem
                    imageSet={imageSet}
                    index={0}
                    fileStatus={fileStatus}
                />
            </IpcServiceProvider>
        );
    };

    beforeEach(() => {
        useAppStore.getState().resetAll();
        useAppStore.setState((state) => ({
            ...state,
            imageSets: [createImageSet()],
            selectedImageId: null,
        }));
        vi.clearAllMocks();
    });

    it("loads image and resets image parameters", async () => {
        const service = new MockIPCService();
        service.log.debug = vi.fn().mockResolvedValue(undefined);
        service.log.info = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(service, "loadImage").mockResolvedValue("C:\\img\\new.png");
        renderItem(service);

        fireEvent.click(screen.getByTestId("header-open"));

        await waitFor(() => {
            expect(useAppStore.getState().imageSets[0].path).toBe(
                "local-file://C:/img/new.png"
            );
        });

        expect(useAppStore.getState().imageSets[0]).toMatchObject({
            transparency: 0,
            rotation: 0,
            initAnchorPos: null,
            currentAnchorPos: null,
            visible: true,
            filters: {
                binarization: { enabled: false, threshold: 128 },
                hsv: { enabled: false, h: 0, s: 0, v: 0 },
            },
        });
    });

    it("updates lock and visible state", () => {
        const service = new MockIPCService();
        renderItem(service);

        fireEvent.click(screen.getByTestId("header-lock"));
        expect(useAppStore.getState().imageSets[0].locked).toBe(true);

        fireEvent.click(screen.getByTestId("header-visible"));
        expect(useAppStore.getState().imageSets[0].visible).toBe(false);
    });

    it("deletes image item from store", () => {
        const service = new MockIPCService();
        useAppStore.setState((state) => ({
            ...state,
            imageSets: [createImageSet(), { ...createImageSet(), id: "image-2" }],
        }));

        renderItem(service);
        fireEvent.click(screen.getByTestId("header-delete"));

        expect(useAppStore.getState().imageSets.map((item) => item.id)).toEqual([
            "image-2",
        ]);
    });

    it("selects image on card click", () => {
        const service = new MockIPCService();
        renderItem(service);

        fireEvent.click(screen.getByText("old.png"));

        expect(useAppStore.getState().selectedImageId).toBe("image-1");
    });

    it("updates transparency, rotation, filters and supports reset transformation", () => {
        const service = new MockIPCService();
        renderItem(service);

        fireEvent.click(screen.getByTestId("transparency-control"));
        expect(useAppStore.getState().imageSets[0].transparency).toBe(0.2);

        fireEvent.click(screen.getByTestId("rotation-slider"));
        expect(useAppStore.getState().imageSets[0].rotation).toBe(45);

        fireEvent.change(screen.getByTestId("rotation-input"), {
            target: { value: "30" },
        });
        expect(useAppStore.getState().imageSets[0].rotation).toBe(30);

        fireEvent.click(screen.getByTestId("filter-control"));
        expect(useAppStore.getState().imageSets[0].filters).toEqual({
            binarization: { enabled: true, threshold: 150 },
            hsv: { enabled: true, h: 1, s: 2, v: 3 },
        });

        fireEvent.click(
            screen.getByText("render.image_settings.reset_transformation")
        );

        expect(useAppStore.getState().imageSets[0]).toMatchObject({
            rotation: 0,
            currentAnchorPos: {
                lt: { x: 2.5, y: 2 },
                rt: { x: 12.5, y: 2 },
                rb: { x: 12.5, y: 12 },
                lb: { x: 2.5, y: 12 },
            },
        });
    });

    it("updates image anchors when scale slider changes", () => {
        const service = new MockIPCService();
        useAppStore.setState((state) => ({
            ...state,
            imageSets: [
                {
                    ...createImageSet(),
                    initAnchorPos: {
                        lt: { x: 0, y: 0 },
                        rt: { x: 10, y: 0 },
                        rb: { x: 10, y: 10 },
                        lb: { x: 0, y: 10 },
                    },
                    currentAnchorPos: {
                        lt: { x: 0, y: 0 },
                        rt: { x: 10, y: 0 },
                        rb: { x: 10, y: 10 },
                        lb: { x: 0, y: 10 },
                    },
                },
            ],
        }));

        renderItem(service);
        fireEvent.click(screen.getByTestId("scale-control"));

        expect(useAppStore.getState().imageSets[0].currentAnchorPos).toEqual({
            lt: { x: -5, y: -5 },
            rt: { x: 15, y: -5 },
            rb: { x: 15, y: 15 },
            lb: { x: -5, y: 15 },
        });
    });

    it("shows missing warning and relinks while preserving current transform", async () => {
        const service = new MockIPCService();
        vi.spyOn(service, "loadImage").mockResolvedValue("C:\\img\\relinked.png");
        vi.spyOn(service, "getImageInfo").mockResolvedValue({
            exists: true,
            width: 20,
            height: 20,
        });

        const before = useAppStore.getState().imageSets[0];
        renderItem(service, { checked: true, exists: false });

        expect(screen.getByTestId("settings.image-item.missing-warning")).toBeTruthy();
        fireEvent.click(screen.getByTestId("settings.image-item.relink"));

        await waitFor(() => {
            expect(useAppStore.getState().imageSets[0].path).toBe(
                "local-file://C:/img/relinked.png"
            );
        });

        expect(useAppStore.getState().imageSets[0]).toMatchObject({
            transparency: before.transparency,
            rotation: before.rotation,
            currentAnchorPos: before.currentAnchorPos,
            filters: before.filters,
            initAnchorPos: {
                lt: { x: 0, y: 0 },
                rt: { x: 20, y: 0 },
                rb: { x: 20, y: 20 },
                lb: { x: 0, y: 20 },
            },
        });
    });
});

