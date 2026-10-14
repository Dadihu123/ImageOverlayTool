/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReceiveProjectData } from "@/renderer/hooks/useReceiveProjectData";
import { useRespondProjectDataSyncRequest } from "@/renderer/hooks/useRespondProjectDataSyncRequest";
import { useAppStore } from "@/renderer/store/useAppStore";
import { ImageSet } from "@/shared/types/ImageSet";
import { DimensionLine } from "@/shared/types/DimensionLine";
import type { GuideConfig } from "@/shared/types/Guide";
import { createDefaultGuideConfig } from "@/shared/constants/guide";
import type { InteractionMode } from "@/shared/types/InteractionMode";

const callbacks = vi.hoisted(() => ({
    unitFactor: null as ((factor: number) => void) | null,
    unit: null as ((unit: "nm" | "um" | "mm") => void) | null,
    imageSets: null as ((imageSets: ImageSet[]) => void) | null,
    dimensionLines: null as ((dimensionLines: DimensionLine[]) => void) | null,

    guides: null as ((guides: GuideConfig) => void) | null,
    interactionMode: null as ((mode: InteractionMode) => void) | null,
    selectedImageId: null as ((id: string | null) => void) | null,
    selectedDimensionLineId: null as ((id: string | null) => void) | null,
    requestSync: null as (() => void) | null,
}));

const unsubscribers = vi.hoisted(() => ({
    unitFactor: vi.fn(),
    unit: vi.fn(),
    imageSets: vi.fn(),
    dimensionLines: vi.fn(),

    guides: vi.fn(),
    interactionMode: vi.fn(),
    selectedImageId: vi.fn(),
    selectedDimensionLineId: vi.fn(),
    requestSync: vi.fn(),
}));

const mockIPC = vi.hoisted(() => ({
    onUnitFactorUpdated: vi.fn((cb: (factor: number) => void) => {
        callbacks.unitFactor = cb;
        return unsubscribers.unitFactor;
    }),
    onUnitUpdated: vi.fn((cb: (unit: "nm" | "um" | "mm") => void) => {
        callbacks.unit = cb;
        return unsubscribers.unit;
    }),
    onImageSetsUpdated: vi.fn((cb: (imageSets: ImageSet[]) => void) => {
        callbacks.imageSets = cb;
        return unsubscribers.imageSets;
    }),
    onDimensionLinesUpdated: vi.fn(
        (cb: (dimensionLines: DimensionLine[]) => void) => {
            callbacks.dimensionLines = cb;
            return unsubscribers.dimensionLines;
        }
    ),
    onGuidesUpdated: vi.fn((cb: (guides: GuideConfig) => void) => {
        callbacks.guides = cb;
        return unsubscribers.guides;
    }),
    onInteractionModeUpdated: vi.fn((cb: (mode: InteractionMode) => void) => {
        callbacks.interactionMode = cb;
        return unsubscribers.interactionMode;
    }),
    onSelectedImageIdUpdated: vi.fn((cb: (id: string | null) => void) => {
        callbacks.selectedImageId = cb;
        return unsubscribers.selectedImageId;
    }),
    onSelectedDimensionLineIdUpdated: vi.fn(
        (cb: (id: string | null) => void) => {
            callbacks.selectedDimensionLineId = cb;
            return unsubscribers.selectedDimensionLineId;
        }
    ),
    onRequestStateSync: vi.fn((cb: () => void) => {
        callbacks.requestSync = cb;
        return unsubscribers.requestSync;
    }),
    updateImageSets: vi.fn(),
    updateDimensionLines: vi.fn(),

    updateGuides: vi.fn(),
    updateUnitFactor: vi.fn(),
    updateUnit: vi.fn(),
    updateInteractionMode: vi.fn(),
    updateSelectedImageId: vi.fn(),
    updateSelectedDimensionLineId: vi.fn(),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
}));

const mountProjectDataSyncHooks = () => {
    const receive = renderHook(() => useReceiveProjectData());
    const respond = renderHook(() => useRespondProjectDataSyncRequest());

    return {
        unmount: () => {
            receive.unmount();
            respond.unmount();
        },
    };
};

describe("project data sync hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        callbacks.unitFactor = null;
        callbacks.unit = null;
        callbacks.imageSets = null;
        callbacks.dimensionLines = null;

        callbacks.guides = null;
        callbacks.interactionMode = null;
        callbacks.selectedImageId = null;
        callbacks.selectedDimensionLineId = null;
        callbacks.requestSync = null;
        useAppStore.getState().resetAll();
    });

    it("should sync unitFactor when receiving unitFactor update event", () => {
        mountProjectDataSyncHooks();

        expect(callbacks.unitFactor).toBeTypeOf("function");

        act(() => {
            callbacks.unitFactor?.(2.5);
        });

        expect(useAppStore.getState().unitFactor).toBe(2.5);
    });

    it("should sync unit, imageSets, dimensionLines and interaction mode from IPC", () => {
        mountProjectDataSyncHooks();

        const imageSets: ImageSet[] = [
            {
                id: "img-sync",
                path: "local-file:///tmp/sync.png",
                transparency: 0.2,
                rotation: 10,
                initAnchorPos: null,
                currentAnchorPos: null,
            },
        ];
        const dimensionLines: DimensionLine[] = [
            {
                id: "dim-sync",
                start: { x: 1, y: 2 },
                end: { x: 3, y: 4 },
                color: "#ff0000",
            },
        ];

        act(() => {
            callbacks.unit?.("mm");
            callbacks.imageSets?.(imageSets);
            callbacks.dimensionLines?.(dimensionLines);
            callbacks.interactionMode?.("dimension_add");
        });

        const state = useAppStore.getState();
        expect(state.unit).toBe("mm");
        expect(state.imageSets).toEqual(imageSets);
        expect(state.dimensionLines).toEqual(dimensionLines);
        expect(state.interactionMode).toBe("dimension_add");
    });

    it("should sync selectedImageId only in default interaction mode", () => {
        mountProjectDataSyncHooks();

        act(() => {
            useAppStore.setState({ interactionMode: "default" });
            callbacks.selectedImageId?.("img-default");
        });
        expect(useAppStore.getState().selectedImageId).toBe("img-default");

        act(() => {
            useAppStore.setState({ interactionMode: "dimension_select" });
            callbacks.selectedImageId?.("img-ignored");
        });
        expect(useAppStore.getState().selectedImageId).toBe("img-default");
    });

    it("should always sync selectedDimensionLineId", () => {
        mountProjectDataSyncHooks();

        act(() => {
            callbacks.selectedDimensionLineId?.("line-selected");
        });

        expect(useAppStore.getState().selectedDimensionLineId).toBe(
            "line-selected"
        );
    });

    it("should include unitFactor when responding to state:requestSync", () => {
        const imageSets: ImageSet[] = [
            {
                id: "img-1",
                path: "local-file:///tmp/test.png",
                transparency: 0,
                rotation: 0,
                initAnchorPos: null,
                currentAnchorPos: null,
            },
        ];

        act(() => {
            useAppStore.setState({
                imageSets,
                dimensionLines: [
                    {
                        id: "line-1",
                        start: { x: 0, y: 0 },
                        end: { x: 10, y: 10 },
                        color: "#ffffff",
                    },
                ],
                unitFactor: 3.2,
                unit: "mm",
                interactionMode: "dimension_select",
                selectedImageId: "img-1",
                selectedDimensionLineId: "line-1",
            });
        });

        mountProjectDataSyncHooks();

        act(() => {
            callbacks.requestSync?.();
        });

        expect(mockIPC.updateImageSets).toHaveBeenCalledWith(imageSets);
        expect(mockIPC.updateDimensionLines).toHaveBeenCalledWith([
            {
                id: "line-1",
                start: { x: 0, y: 0 },
                end: { x: 10, y: 10 },
                color: "#ffffff",
            },
        ]);
        expect(mockIPC.updateUnitFactor).toHaveBeenCalledWith(3.2);
        expect(mockIPC.updateUnit).toHaveBeenCalledWith("mm");
        expect(mockIPC.updateInteractionMode).toHaveBeenCalledWith(
            "dimension_select"
        );
        expect(mockIPC.updateSelectedImageId).toHaveBeenCalledWith("img-1");
        expect(mockIPC.updateSelectedDimensionLineId).toHaveBeenCalledWith(
            "line-1"
        );
    });

    it("should sync guides when receiving a guides update event", () => {
        mountProjectDataSyncHooks();

        expect(callbacks.guides).toBeTypeOf("function");

        const guides = {
            ...createDefaultGuideConfig(),
            grid: {
                ...createDefaultGuideConfig().grid,
                enabled: true,
                spacingX: 25,
            },
        };

        act(() => {
            callbacks.guides?.(guides);
        });

        expect(useAppStore.getState().guides.grid.enabled).toBe(true);
        expect(useAppStore.getState().guides.grid.spacingX).toBe(25);
    });

    it("should include guides when responding to state:requestSync", () => {
        const guides = {
            ...createDefaultGuideConfig(),
            grid: { ...createDefaultGuideConfig().grid, enabled: true },
        };

        act(() => {
            useAppStore.setState({ guides });
        });

        mountProjectDataSyncHooks();

        act(() => {
            callbacks.requestSync?.();
        });

        expect(mockIPC.updateGuides).toHaveBeenCalledWith(guides);
    });

    it("should unsubscribe all IPC listeners on unmount", () => {
        const { unmount } = mountProjectDataSyncHooks();

        unmount();

        expect(unsubscribers.unitFactor).toHaveBeenCalledTimes(1);
        expect(unsubscribers.unit).toHaveBeenCalledTimes(1);
        expect(unsubscribers.imageSets).toHaveBeenCalledTimes(1);
        expect(unsubscribers.dimensionLines).toHaveBeenCalledTimes(1);
        expect(unsubscribers.guides).toHaveBeenCalledTimes(1);
        expect(unsubscribers.interactionMode).toHaveBeenCalledTimes(1);
        expect(unsubscribers.selectedImageId).toHaveBeenCalledTimes(1);
        expect(unsubscribers.selectedDimensionLineId).toHaveBeenCalledTimes(1);
        expect(unsubscribers.requestSync).toHaveBeenCalledTimes(1);
    });
});
