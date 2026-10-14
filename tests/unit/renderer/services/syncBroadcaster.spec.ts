/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

import {
    createSyncBroadcaster,
    type ProjectSyncSnapshot,
} from "@/renderer/services/sync/syncBroadcaster";
import { createDefaultGuideConfig } from "@/shared/constants/guide";

const createSnapshot = (
    overrides: Partial<ProjectSyncSnapshot> = {}
): ProjectSyncSnapshot => ({
    imageSets: [],
    dimensionLines: [],
    guides: createDefaultGuideConfig(),
    unitFactor: 1,
    unit: "um",
    projectDataChangeOrigin: "local",
    interactionMode: "default",
    selectedImageId: null,
    selectedDimensionLineId: null,
    ...overrides,
});

describe("syncBroadcaster", () => {
    it("broadcasts only changed local project fields and selection fields", () => {
        const ipc = {
            updateImageSets: vi.fn(),
            updateDimensionLines: vi.fn(),
            updateGuides: vi.fn(),
            updateUnitFactor: vi.fn(),
            updateUnit: vi.fn(),
            updateInteractionMode: vi.fn(),
            updateSelectedImageId: vi.fn(),
            updateSelectedDimensionLineId: vi.fn(),
        };
        const broadcaster = createSyncBroadcaster(ipc);
        const dimensionLines: ProjectSyncSnapshot["dimensionLines"] = [];

        const previous = createSnapshot({ dimensionLines });
        const next = createSnapshot({
            imageSets: [
                {
                    id: "img-1",
                    path: "local-file:///tmp/a.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
            dimensionLines,
            unitFactor: 2,
            interactionMode: "dimension_select",
            selectedImageId: "img-1",
        });

        broadcaster.broadcastDiff(previous, next);

        expect(ipc.updateImageSets).toHaveBeenCalledTimes(1);
        expect(ipc.updateDimensionLines).not.toHaveBeenCalled();
        expect(ipc.updateUnitFactor).toHaveBeenCalledWith(2);
        expect(ipc.updateUnit).not.toHaveBeenCalled();
        expect(ipc.updateInteractionMode).toHaveBeenCalledWith(
            "dimension_select"
        );
        expect(ipc.updateSelectedImageId).toHaveBeenCalledWith("img-1");
        expect(ipc.updateSelectedDimensionLineId).not.toHaveBeenCalled();
    });

    it("does not re-broadcast remote project data changes", () => {
        const ipc = {
            updateImageSets: vi.fn(),
            updateDimensionLines: vi.fn(),
            updateGuides: vi.fn(),
            updateUnitFactor: vi.fn(),
            updateUnit: vi.fn(),
            updateInteractionMode: vi.fn(),
            updateSelectedImageId: vi.fn(),
            updateSelectedDimensionLineId: vi.fn(),
        };
        const broadcaster = createSyncBroadcaster(ipc);

        const previous = createSnapshot();
        const next = createSnapshot({
            imageSets: [
                {
                    id: "img-2",
                    path: "local-file:///tmp/b.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
            unitFactor: 4,
            unit: "nm",
            projectDataChangeOrigin: "remote",
            selectedDimensionLineId: "line-1",
        });

        broadcaster.broadcastDiff(previous, next);

        expect(ipc.updateImageSets).not.toHaveBeenCalled();
        expect(ipc.updateDimensionLines).not.toHaveBeenCalled();
        expect(ipc.updateUnitFactor).not.toHaveBeenCalled();
        expect(ipc.updateUnit).not.toHaveBeenCalled();
        expect(ipc.updateSelectedDimensionLineId).toHaveBeenCalledWith(
            "line-1"
        );
    });

    it("broadcastSnapshot sends all sync targets", () => {
        const ipc = {
            updateImageSets: vi.fn(),
            updateDimensionLines: vi.fn(),
            updateGuides: vi.fn(),
            updateUnitFactor: vi.fn(),
            updateUnit: vi.fn(),
            updateInteractionMode: vi.fn(),
            updateSelectedImageId: vi.fn(),
            updateSelectedDimensionLineId: vi.fn(),
        };
        const broadcaster = createSyncBroadcaster(ipc);
        const snapshot = createSnapshot({
            unitFactor: 3.2,
            unit: "mm",
            interactionMode: "dimension_add",
            selectedImageId: "img-3",
            selectedDimensionLineId: "line-3",
        });

        broadcaster.broadcastSnapshot(snapshot);

        expect(ipc.updateImageSets).toHaveBeenCalledWith(snapshot.imageSets);
        expect(ipc.updateDimensionLines).toHaveBeenCalledWith(
            snapshot.dimensionLines
        );
        expect(ipc.updateUnitFactor).toHaveBeenCalledWith(3.2);
        expect(ipc.updateUnit).toHaveBeenCalledWith("mm");
        expect(ipc.updateInteractionMode).toHaveBeenCalledWith("dimension_add");
        expect(ipc.updateSelectedImageId).toHaveBeenCalledWith("img-3");
        expect(ipc.updateSelectedDimensionLineId).toHaveBeenCalledWith(
            "line-3"
        );
    });
});
