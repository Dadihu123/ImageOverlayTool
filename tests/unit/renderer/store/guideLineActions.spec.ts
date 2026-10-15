import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "@/renderer/store/useAppStore";
import type { GuideRect } from "@/shared/types/Guide";

const createWorldRect = (id: string): GuideRect => ({
    id,
    shape: { kind: "world", x: 0, y: 0, width: 100, height: 50 },
});

describe("guide line store actions", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    it("adds lines and keeps them sorted without duplicates", () => {
        const store = useAppStore.getState();
        store.addGuideLine("x", 100);
        store.addGuideLine("x", 50);
        store.addGuideLine("x", 100);

        expect(useAppStore.getState().guides.lines.xs).toEqual([50, 100]);
    });

    it("ignores non-finite values", () => {
        useAppStore.getState().addGuideLine("x", Number.NaN);
        expect(useAppStore.getState().guides.lines.xs).toEqual([]);
    });

    it("moves a line by index", () => {
        const store = useAppStore.getState();
        store.addGuideLine("y", 10);
        store.addGuideLine("y", 20);

        useAppStore.getState().moveGuideLine("y", 1, 5);

        expect(useAppStore.getState().guides.lines.ys).toEqual([5, 10]);
    });

    it("ignores moves for an out-of-range index", () => {
        useAppStore.getState().addGuideLine("y", 10);
        useAppStore.getState().moveGuideLine("y", 5, 99);
        expect(useAppStore.getState().guides.lines.ys).toEqual([10]);
    });

    it("removes a line by index", () => {
        const store = useAppStore.getState();
        store.addGuideLine("x", 10);
        store.addGuideLine("x", 20);

        useAppStore.getState().removeGuideLine("x", 0);

        expect(useAppStore.getState().guides.lines.xs).toEqual([20]);
    });

    it("generates evenly spaced lines", () => {
        useAppStore.getState().generateGuideLines({
            axis: "x",
            start: 0,
            interval: 25,
            count: 5,
        });

        expect(useAppStore.getState().guides.lines.xs).toEqual([
            0, 25, 50, 75, 100,
        ]);
    });

    it("supports a negative interval", () => {
        useAppStore.getState().generateGuideLines({
            axis: "y",
            start: 100,
            interval: -50,
            count: 3,
        });

        expect(useAppStore.getState().guides.lines.ys).toEqual([0, 50, 100]);
    });

    it("rejects invalid generation parameters", () => {
        const store = useAppStore.getState();
        const cases = [
            { axis: "x" as const, start: 0, interval: 0, count: 5 },
            { axis: "x" as const, start: 0, interval: 10, count: 0 },
            { axis: "x" as const, start: 0, interval: 10, count: 2.5 },
            { axis: "x" as const, start: Number.NaN, interval: 10, count: 5 },
            { axis: "x" as const, start: 0, interval: 10, count: 100000 },
        ];

        for (const params of cases) {
            store.generateGuideLines(params);
        }

        expect(useAppStore.getState().guides.lines.xs).toEqual([]);
    });

    it("merges generated lines with existing ones", () => {
        useAppStore.getState().addGuideLine("x", 25);
        useAppStore.getState().generateGuideLines({
            axis: "x",
            start: 0,
            interval: 25,
            count: 3,
        });
        expect(useAppStore.getState().guides.lines.xs).toEqual([0, 25, 50]);
    });

    it("clears one axis only", () => {
        const store = useAppStore.getState();
        store.addGuideLine("x", 10);
        store.addGuideLine("y", 20);

        useAppStore.getState().clearGuideLines("x");

        expect(useAppStore.getState().guides.lines.xs).toEqual([]);
        expect(useAppStore.getState().guides.lines.ys).toEqual([20]);
    });
});

describe("guide rect image linking", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    it("links a rect to an image", () => {
        useAppStore.getState().addGuideRect(createWorldRect("r1"));

        useAppStore.getState().linkGuideRectToImage({
            rectId: "r1",
            imageSetId: "img-1",
            shape: {
                kind: "linked",
                imageSetId: "img-1",
                u0: 0.1,
                v0: 0.1,
                u1: 0.5,
                v1: 0.5,
            },
        });

        expect(useAppStore.getState().guides.rects[0].shape).toEqual({
            kind: "linked",
            imageSetId: "img-1",
            u0: 0.1,
            v0: 0.1,
            u1: 0.5,
            v1: 0.5,
        });
    });

    it("rejects a link whose shape targets a different image", () => {
        useAppStore.getState().addGuideRect(createWorldRect("r1"));

        useAppStore.getState().linkGuideRectToImage({
            rectId: "r1",
            imageSetId: "img-1",
            shape: {
                kind: "linked",
                imageSetId: "img-2",
                u0: 0,
                v0: 0,
                u1: 1,
                v1: 1,
            },
        });

        expect(useAppStore.getState().guides.rects[0].shape.kind).toBe("world");
    });

    it("unlinks a rect back to a world rect", () => {
        useAppStore.getState().addGuideRect({
            id: "r1",
            shape: {
                kind: "linked",
                imageSetId: "img-1",
                u0: 0,
                v0: 0,
                u1: 1,
                v1: 1,
            },
        });

        useAppStore.getState().unlinkGuideRect({
            rectId: "r1",
            worldRect: { x: 10, y: 20, width: 30, height: 40 },
        });

        expect(useAppStore.getState().guides.rects[0].shape).toEqual({
            kind: "world",
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
    });

    it("ignores unlink for an unknown rect", () => {
        useAppStore.getState().unlinkGuideRect({
            rectId: "missing",
            worldRect: { x: 0, y: 0, width: 10, height: 10 },
        });
        expect(useAppStore.getState().guides.rects).toEqual([]);
    });
});
