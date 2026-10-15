import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "@/renderer/store/useAppStore";
import { createDefaultGuideConfig } from "@/shared/constants/guide";
import type { GuideRect } from "@/shared/types/Guide";
import {
    resolvePointerPolicy,
    resolveSessionOnMouseDown,
} from "@/renderer/main-window/hooks/pointerSessionMachine";

const createRect = (id: string, x = 0, y = 0): GuideRect => ({
    id,
    shape: { kind: "world", x, y, width: 100, height: 50 },
});

describe("guide rect store actions", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    it("starts with no rects and no baseline", () => {
        const { guides } = useAppStore.getState();
        expect(guides.rects).toEqual([]);
        expect(guides.baselineRectId).toBeNull();
        expect(guides).toEqual(createDefaultGuideConfig());
    });

    it("adds, updates and removes a rect", () => {
        const store = useAppStore.getState();
        store.addGuideRect(createRect("r1"));
        expect(useAppStore.getState().guides.rects).toHaveLength(1);

        store.updateGuideRect({
            ...createRect("r1", 500, 500),
        });
        expect(useAppStore.getState().guides.rects[0].shape).toEqual({
            kind: "world",
            x: 500,
            y: 500,
            width: 100,
            height: 50,
        });

        store.removeGuideRect("r1");
        expect(useAppStore.getState().guides.rects).toHaveLength(0);
    });

    it("marks the project dirty when rects change", () => {
        useAppStore.getState().markProjectSaved();
        expect(useAppStore.getState().hasUnsavedChanges).toBe(false);

        useAppStore.getState().addGuideRect(createRect("r1"));
        expect(useAppStore.getState().hasUnsavedChanges).toBe(true);
    });

    it("ignores updates for an unknown rect id", () => {
        useAppStore.getState().addGuideRect(createRect("r1"));
        useAppStore.getState().updateGuideRect(createRect("missing"));
        expect(useAppStore.getState().guides.rects).toHaveLength(1);
        expect(useAppStore.getState().guides.rects[0].id).toBe("r1");
    });

    it("duplicates a rect with a new id and an offset", () => {
        useAppStore.getState().addGuideRect({
            ...createRect("r1", 10, 20),
            label: "head",
            locked: true,
        });

        useAppStore.getState().duplicateGuideRect("r1");

        const rects = useAppStore.getState().guides.rects;
        expect(rects).toHaveLength(2);
        const copy = rects[1];
        expect(copy.id).not.toBe("r1");
        expect(copy.label).toBe("head");
        // 複製はすぐ動かせるよう固定を引き継がない
        expect(copy.locked).toBeUndefined();
        expect(copy.shape).toEqual({
            kind: "world",
            x: 30,
            y: 40,
            width: 100,
            height: 50,
        });
    });

    it("duplicates a linked rect without offsetting its normalized coords", () => {
        useAppStore.getState().addGuideRect({
            id: "linked",
            shape: {
                kind: "linked",
                imageSetId: "img",
                u0: 0.1,
                v0: 0.1,
                u1: 0.5,
                v1: 0.5,
            },
        });

        useAppStore.getState().duplicateGuideRect("linked");

        const copy = useAppStore.getState().guides.rects[1];
        expect(copy.shape).toEqual({
            kind: "linked",
            imageSetId: "img",
            u0: 0.1,
            v0: 0.1,
            u1: 0.5,
            v1: 0.5,
        });
    });

    it("clears the baseline when its rect is removed", () => {
        useAppStore.getState().addGuideRect(createRect("r1"));
        useAppStore.getState().setBaselineGuideRectId("r1");
        expect(useAppStore.getState().guides.baselineRectId).toBe("r1");

        useAppStore.getState().removeGuideRect("r1");
        expect(useAppStore.getState().guides.baselineRectId).toBeNull();
    });

    it("rejects a baseline id that does not exist", () => {
        useAppStore.getState().setBaselineGuideRectId("nope");
        expect(useAppStore.getState().guides.baselineRectId).toBeNull();
    });

    it("resets guides on new project", () => {
        useAppStore.getState().addGuideRect(createRect("r1"));
        useAppStore.getState().resetProjectData();
        expect(useAppStore.getState().guides).toEqual(
            createDefaultGuideConfig()
        );
    });

    it("keeps guides out of the undo snapshot only when unchanged", () => {
        useAppStore.temporal.getState().clear();
        useAppStore.getState().addGuideRect(createRect("r1"));
        expect(
            useAppStore.temporal.getState().pastStates.length
        ).toBeGreaterThan(0);

        // 同じ状態で再度追加しても履歴は増えない扱いにはならないが、
        // 変更が積まれていることを確認する
        const before = useAppStore.temporal.getState().pastStates.length;
        useAppStore.getState().addGuideRect(createRect("r2"));
        expect(useAppStore.temporal.getState().pastStates.length).toBe(
            before + 1
        );
    });
});

describe("pointer session policy for guide modes", () => {
    it("treats guide rect draw mode as a tool interaction, not a stage pan", () => {
        const session = resolveSessionOnMouseDown("guide_rect_draw", 0);
        expect(session).toBe("tool_interaction");

        const policy = resolvePointerPolicy("guide_rect_draw", session);
        expect(policy.stageDraggable).toBe(false);
        expect(policy.dragButtons).toEqual([0]);
    });

    it("keeps panning available on middle/right click in guide modes", () => {
        expect(resolveSessionOnMouseDown("guide_rect_draw", 1)).toBe(
            "stage_pan"
        );
        expect(resolveSessionOnMouseDown("guide_rect_select", 2)).toBe(
            "stage_pan"
        );
    });

    it("keeps default mode pannable on left click", () => {
        const session = resolveSessionOnMouseDown("default", 0);
        expect(session).toBe("stage_pan");
        const policy = resolvePointerPolicy("default", session);
        expect(policy.stageDraggable).toBe(true);
        expect(policy.dragButtons).toEqual([1, 2]);
    });

    it("does not treat guide modes as dimension modes", () => {
        // 以前は mode !== "default" で判定していたため、ここが誤判定していた
        const policy = resolvePointerPolicy(
            "guide_rect_select",
            "tool_interaction"
        );
        expect(policy.dragButtons).toEqual([0]);
        expect(policy.stageDraggable).toBe(false);
    });
});
