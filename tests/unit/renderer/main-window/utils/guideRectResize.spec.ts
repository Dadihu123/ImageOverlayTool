import { describe, expect, it } from "vitest";

import {
    computeSizeRatio,
    getRectHandlePoints,
    isEdgeHandle,
    resizeGuideRect,
    scaleAnchors,
} from "@/renderer/main-window/utils/guideGeometry";
import type { AnchorPos } from "@/shared/types/AnchorPos";

const BASE = { x: 100, y: 100, width: 200, height: 100 };
const MIN = 1;

describe("resizeGuideRect", () => {
    it("moves only the dragged edge and keeps the opposite edge fixed", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "right",
            pointer: { x: 400, y: 0 },
            minSize: MIN,
        });
        expect(result).toEqual({
            x: 100,
            y: 100,
            width: 300,
            height: 100,
        });
    });

    it("keeps the opposite edge fixed when dragging left", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "left",
            pointer: { x: 50, y: 0 },
            minSize: MIN,
        });
        // 右辺は 300 のまま
        expect(result.x).toBe(50);
        expect(result.x + result.width).toBe(300);
    });

    it("keeps the opposite edge fixed when dragging top", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "top",
            pointer: { x: 0, y: 20 },
            minSize: MIN,
        });
        // 下辺は 200 のまま
        expect(result.y).toBe(20);
        expect(result.y + result.height).toBe(200);
    });

    it("keeps the opposite edge fixed when dragging bottom", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "bottom",
            pointer: { x: 0, y: 500 },
            minSize: MIN,
        });
        expect(result.y).toBe(100);
        expect(result.y + result.height).toBe(500);
    });

    it("moves two edges and fixes the opposite corner when dragging a corner", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "rb",
            pointer: { x: 500, y: 400 },
            minSize: MIN,
        });
        // 左上は固定
        expect(result.x).toBe(100);
        expect(result.y).toBe(100);
        expect(result.width).toBe(400);
        expect(result.height).toBe(300);
    });

    it("does not let a rect collapse below the minimum size", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "right",
            pointer: { x: -500, y: 0 },
            minSize: 10,
        });
        expect(result.width).toBe(10);
        expect(result.x).toBe(100);
    });

    it("preserves the aspect ratio on a corner drag when requested", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "rb",
            pointer: { x: 500, y: 100 },
            minSize: MIN,
            keepAspectRatio: true,
        });
        const ratio = result.width / result.height;
        expect(ratio).toBeCloseTo(BASE.width / BASE.height, 5);
        // 固定された左上は動かない
        expect(result.x).toBe(100);
        expect(result.y).toBe(100);
    });

    it("ignores the aspect ratio flag for edge handles", () => {
        const result = resizeGuideRect({
            rect: BASE,
            handle: "right",
            pointer: { x: 400, y: 0 },
            minSize: MIN,
            keepAspectRatio: true,
        });
        expect(result.height).toBe(100);
        expect(result.width).toBe(300);
    });
});

describe("isEdgeHandle", () => {
    it("distinguishes edges from corners", () => {
        expect(isEdgeHandle("left")).toBe(true);
        expect(isEdgeHandle("bottom")).toBe(true);
        expect(isEdgeHandle("lt")).toBe(false);
        expect(isEdgeHandle("rb")).toBe(false);
    });
});

describe("getRectHandlePoints", () => {
    it("returns the four corners and four edge midpoints", () => {
        const points = getRectHandlePoints(BASE);
        expect(points.lt).toEqual({ x: 100, y: 100 });
        expect(points.rt).toEqual({ x: 300, y: 100 });
        expect(points.rb).toEqual({ x: 300, y: 200 });
        expect(points.lb).toEqual({ x: 100, y: 200 });
        expect(points.left).toEqual({ x: 100, y: 150 });
        expect(points.right).toEqual({ x: 300, y: 150 });
        expect(points.top).toEqual({ x: 200, y: 100 });
        expect(points.bottom).toEqual({ x: 200, y: 200 });
    });
});

describe("computeSizeRatio", () => {
    it("computes per-axis and average ratios", () => {
        const result = computeSizeRatio(
            { x: 0, y: 0, width: 318, height: 238 },
            { x: 0, y: 0, width: 320, height: 240 }
        );
        expect(result?.width).toBeCloseTo(0.99375, 5);
        expect(result?.height).toBeCloseTo(0.991667, 5);
        expect(result?.average).toBeCloseTo(0.9927, 3);
    });

    it("returns null for a degenerate baseline", () => {
        expect(
            computeSizeRatio(
                { x: 0, y: 0, width: 10, height: 10 },
                { x: 0, y: 0, width: 0, height: 10 }
            )
        ).toBeNull();
    });
});

describe("scaleAnchors", () => {
    const anchors: AnchorPos = {
        lt: { x: 0, y: 0 },
        rt: { x: 100, y: 0 },
        lb: { x: 0, y: 100 },
        rb: { x: 100, y: 100 },
    };

    it("scales about the anchor centre by default", () => {
        const result = scaleAnchors(anchors, 2);
        expect(result.lt).toEqual({ x: -50, y: -50 });
        expect(result.rb).toEqual({ x: 150, y: 150 });
    });

    it("scales about an explicit origin", () => {
        const result = scaleAnchors(anchors, 0.5, { x: 0, y: 0 });
        expect(result.lt).toEqual({ x: 0, y: 0 });
        expect(result.rb).toEqual({ x: 50, y: 50 });
    });

    it("is a no-op for a factor of 1", () => {
        expect(scaleAnchors(anchors, 1)).toEqual(anchors);
    });
});
