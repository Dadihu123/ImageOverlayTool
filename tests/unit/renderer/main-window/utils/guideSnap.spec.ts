import { describe, expect, it } from "vitest";

import {
    createDefaultGridConfig,
    createDefaultGuideLinesConfig,
    createDefaultGuideConfig,
    sanitizeGuideConfig,
    sanitizeGuideRect,
} from "@/shared/constants/guide";
import { resolveSnap, type SnapContext } from "@/renderer/main-window/utils/guideSnap";

const createContext = (
    overrides: Partial<SnapContext> = {}
): SnapContext => ({
    grid: {
        ...createDefaultGridConfig(),
        enabled: true,
        snap: {
            gridIntersection: true,
            guideLines: true,
            guideRectEdges: true,
            dimensionEndpoints: true,
        },
    },
    guideLines: createDefaultGuideLinesConfig(),
    rects: [],
    dimensionLines: [],
    radius: 8,
    gridStepX: 50,
    gridStepY: 50,
    axis: "both",
    ...overrides,
});

describe("resolveSnap", () => {
    it("does not snap when the radius is zero", () => {
        const context = createContext({ radius: 0 });
        const result = resolveSnap({ x: 3, y: 4 }, context);
        expect(result.point).toEqual({ x: 3, y: 4 });
        expect(result.primary).toBeNull();
    });

    it("snaps to the nearest grid intersection", () => {
        const result = resolveSnap({ x: 4, y: 46 }, createContext());
        expect(result.point).toEqual({ x: 0, y: 50 });
        expect(result.primary).toEqual({ kind: "gridIntersection" });
    });

    it("does not snap when outside the radius", () => {
        const result = resolveSnap({ x: 25, y: 25 }, createContext());
        expect(result.point).toEqual({ x: 25, y: 25 });
        expect(result.primary).toBeNull();
    });

    it("prefers a guide rect corner over the grid", () => {
        // 角 (3, 47) はグリッド交点 (0, 50) と競合するが、優先度が高い
        const result = resolveSnap(
            { x: 4, y: 46 },
            createContext({
                rects: [
                    { id: "r1", rect: { x: 3, y: 47, width: 100, height: 100 } },
                ],
            })
        );
        expect(result.point).toEqual({ x: 3, y: 47 });
        expect(result.primary).toEqual({
            kind: "rectCorner",
            rectId: "r1",
            corner: "lt",
        });
    });

    it("prefers a guide line over the grid", () => {
        const result = resolveSnap(
            { x: 22, y: 48 },
            createContext({
                guideLines: {
                    ...createDefaultGuideLinesConfig(),
                    enabled: true,
                    xs: [20],
                },
            })
        );
        // x は参考線、y はグリッド
        expect(result.point.x).toBe(20);
        expect(result.point.y).toBe(50);
        expect(result.x.source).toEqual({
            kind: "guideLine",
            axis: "x",
            index: 0,
        });
    });

    it("prefers a rect edge over a guide line", () => {
        const result = resolveSnap(
            { x: 21, y: 48 },
            createContext({
                rects: [
                    { id: "r1", rect: { x: 19, y: 0, width: 100, height: 100 } },
                ],
                guideLines: {
                    ...createDefaultGuideLinesConfig(),
                    enabled: true,
                    xs: [21],
                },
            })
        );
        expect(result.point.x).toBe(19);
        expect(result.x.source).toEqual({
            kind: "rectEdge",
            rectId: "r1",
            edge: "left",
        });
    });

    it("snaps to dimension endpoints only when nothing else matches", () => {
        const result = resolveSnap(
            { x: 24, y: 26 },
            createContext({
                dimensionLines: [
                    {
                        id: "d1",
                        start: { x: 24, y: 26 },
                        end: { x: 200, y: 200 },
                    },
                ],
            })
        );
        expect(result.point).toEqual({ x: 24, y: 26 });
        expect(result.primary).toEqual({
            kind: "dimensionEndpoint",
            lineId: "d1",
            which: "start",
        });
    });

    it("does not let dimension endpoints override the grid", () => {
        const result = resolveSnap(
            { x: 4, y: 46 },
            createContext({
                dimensionLines: [
                    {
                        id: "d1",
                        start: { x: 4, y: 46 },
                        end: { x: 200, y: 200 },
                    },
                ],
            })
        );
        expect(result.point).toEqual({ x: 0, y: 50 });
        expect(result.primary).toEqual({ kind: "gridIntersection" });
    });

    it("restricts snapping to the requested axis", () => {
        const result = resolveSnap(
            { x: 4, y: 46 },
            createContext({ axis: "x" })
        );
        expect(result.point.x).toBe(0);
        expect(result.point.y).toBe(46);
        expect(result.y.snapped).toBe(false);
    });

    it("ignores disabled snap sources", () => {
        const context = createContext();
        context.grid.snap.gridIntersection = false;
        const result = resolveSnap({ x: 4, y: 46 }, context);
        expect(result.point).toEqual({ x: 4, y: 46 });
    });

    it("does not snap to the grid when the grid is disabled", () => {
        const context = createContext();
        context.grid.enabled = false;
        const result = resolveSnap({ x: 4, y: 46 }, context);
        expect(result.point).toEqual({ x: 4, y: 46 });
    });
});

describe("sanitizeGuideConfig", () => {
    it("falls back to defaults for junk input", () => {
        expect(sanitizeGuideConfig(null)).toEqual(createDefaultGuideConfig());
        expect(sanitizeGuideConfig("nonsense")).toEqual(
            createDefaultGuideConfig()
        );
        expect(sanitizeGuideConfig({})).toEqual(createDefaultGuideConfig());
    });

    it("keeps valid values", () => {
        const result = sanitizeGuideConfig({
            grid: { enabled: true, spacingX: 12.5, spacingY: 30 },
            lines: { xs: [1, 2], ys: [3] },
        });
        expect(result.grid.enabled).toBe(true);
        expect(result.grid.spacingX).toBe(12.5);
        expect(result.grid.spacingY).toBe(30);
        expect(result.lines.xs).toEqual([1, 2]);
        expect(result.lines.ys).toEqual([3]);
    });

    it("clamps out-of-range numbers instead of throwing", () => {
        const result = sanitizeGuideConfig({
            grid: { spacingX: -10, spacingY: 1e12, subdivisions: 999, opacity: 5 },
        });
        expect(result.grid.spacingX).toBe(0.01);
        expect(result.grid.spacingY).toBe(1000000);
        expect(result.grid.subdivisions).toBe(20);
        expect(result.grid.opacity).toBe(1);
    });

    it("drops malformed rects but keeps the valid ones", () => {
        const result = sanitizeGuideConfig({
            rects: [
                { id: "ok", shape: { kind: "world", x: 1, y: 2, width: 3, height: 4 } },
                { id: "bad-shape", shape: { kind: "world", x: 1 } },
                { shape: { kind: "world", x: 0, y: 0, width: 5, height: 5 } },
                "nonsense",
            ],
        });
        expect(result.rects).toHaveLength(1);
        expect(result.rects[0].id).toBe("ok");
    });

    it("clears a baseline id that does not match any rect", () => {
        const result = sanitizeGuideConfig({
            rects: [
                { id: "a", shape: { kind: "world", x: 0, y: 0, width: 1, height: 1 } },
            ],
            baselineRectId: "missing",
        });
        expect(result.baselineRectId).toBeNull();
    });

    it("rejects invalid hex colors", () => {
        const result = sanitizeGuideConfig({ grid: { color: "red" } });
        expect(result.grid.color).toBe("#64748b");
    });
});

describe("sanitizeGuideRect", () => {
    it("accepts a linked shape", () => {
        const rect = sanitizeGuideRect({
            id: "r",
            shape: {
                kind: "linked",
                imageSetId: "img-1",
                u0: 0.1,
                v0: 0.2,
                u1: 0.8,
                v1: 0.9,
            },
        });
        expect(rect?.shape).toEqual({
            kind: "linked",
            imageSetId: "img-1",
            u0: 0.1,
            v0: 0.2,
            u1: 0.8,
            v1: 0.9,
        });
    });

    it("rejects a linked shape without an image id", () => {
        expect(
            sanitizeGuideRect({
                id: "r",
                shape: { kind: "linked", u0: 0, v0: 0, u1: 1, v1: 1 },
            })
        ).toBeNull();
    });

    it("rejects degenerate rects", () => {
        expect(
            sanitizeGuideRect({
                id: "r",
                shape: { kind: "world", x: 0, y: 0, width: 0, height: 10 },
            })
        ).toBeNull();
    });
});
