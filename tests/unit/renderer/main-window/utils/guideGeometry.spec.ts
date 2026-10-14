import { describe, expect, it } from "vitest";

import {
    bilinearPoint,
    countGridCells,
    enumerateGridLines,
    expandWorldRect,
    invertBilinearPoint,
    resolveGridStep,
    snapValueToGrid,
} from "@/renderer/main-window/utils/guideGeometry";
import type { AnchorPos } from "@/shared/types/AnchorPos";

describe("resolveGridStep", () => {
    it("keeps the configured spacing when it is already visible", () => {
        expect(resolveGridStep(50, 1, 6)).toBe(50);
        expect(resolveGridStep(50, 2, 6)).toBe(50);
    });

    it("thins out the grid using the 1-2-5 series when zoomed far out", () => {
        // 50 * 0.001 = 0.05px なので大幅に間引かれる必要がある
        const step = resolveGridStep(50, 0.001, 6);
        expect(step * 0.001).toBeGreaterThanOrEqual(6);
        // 1-2-5 系列の値になっている
        const mantissa = step / 10 ** Math.floor(Math.log10(step));
        expect([1, 2, 5]).toContain(Math.round(mantissa));
    });

    it("picks the smallest 1-2-5 step that satisfies the screen spacing", () => {
        // 必要なワールド間隔は 6 / 0.1 = 60。50 の次は 100
        expect(resolveGridStep(50, 0.1, 6)).toBe(100);
        // 必要なワールド間隔は 6 / 0.02 = 300。50 -> 100 -> 200 -> 500
        expect(resolveGridStep(50, 0.02, 6)).toBe(500);
    });

    it("returns the input for degenerate values", () => {
        expect(resolveGridStep(0, 1, 6)).toBe(0);
        expect(resolveGridStep(-5, 1, 6)).toBe(-5);
        expect(resolveGridStep(50, 0, 6)).toBe(50);
        expect(resolveGridStep(Number.NaN, 1, 6)).toBeNaN();
    });
});

describe("enumerateGridLines", () => {
    it("lists multiples of step inside the range", () => {
        expect(enumerateGridLines(0, 100, 0, 50)).toEqual([0, 50, 100]);
        expect(enumerateGridLines(10, 90, 0, 50)).toEqual([50]);
    });

    it("respects a non-zero origin", () => {
        expect(enumerateGridLines(0, 100, 25, 50)).toEqual([25, 75]);
    });

    it("returns an empty list for invalid input", () => {
        expect(enumerateGridLines(0, 100, 0, 0)).toEqual([]);
        expect(enumerateGridLines(0, 100, 0, -1)).toEqual([]);
        expect(enumerateGridLines(100, 0, 0, 10)).toEqual([]);
        expect(enumerateGridLines(Number.NaN, 100, 0, 10)).toEqual([]);
    });

    it("refuses to generate more lines than the limit", () => {
        expect(enumerateGridLines(0, 1000, 0, 1, 100)).toEqual([]);
        expect(enumerateGridLines(0, 1000, 0, 1, 1001)).toHaveLength(1001);
    });
});

describe("snapValueToGrid", () => {
    it("snaps to the nearest grid line", () => {
        expect(snapValueToGrid(24, 0, 50)).toBe(0);
        expect(snapValueToGrid(26, 0, 50)).toBe(50);
        expect(snapValueToGrid(74, 25, 50)).toBe(75);
    });

    it("returns the value unchanged when step is invalid", () => {
        expect(snapValueToGrid(24, 0, 0)).toBe(24);
    });
});

describe("countGridCells", () => {
    it("counts how many cells a length spans", () => {
        expect(countGridCells(320, 50)).toBeCloseTo(6.4);
    });

    it("returns null for invalid steps", () => {
        expect(countGridCells(320, 0)).toBeNull();
        expect(countGridCells(Number.NaN, 50)).toBeNull();
    });
});

describe("expandWorldRect", () => {
    it("expands on all sides", () => {
        expect(expandWorldRect({ x: 0, y: 0, width: 10, height: 20 }, 5)).toEqual(
            { x: -5, y: -5, width: 20, height: 30 }
        );
    });
});

describe("bilinear mapping", () => {
    const axisAligned: AnchorPos = {
        lt: { x: 0, y: 0 },
        rt: { x: 100, y: 0 },
        lb: { x: 0, y: 50 },
        rb: { x: 100, y: 50 },
    };

    it("maps normalized coordinates onto the quad", () => {
        expect(bilinearPoint(axisAligned, 0, 0)).toEqual({ x: 0, y: 0 });
        expect(bilinearPoint(axisAligned, 1, 0)).toEqual({ x: 100, y: 0 });
        expect(bilinearPoint(axisAligned, 0, 1)).toEqual({ x: 0, y: 50 });
        expect(bilinearPoint(axisAligned, 0.5, 0.5)).toEqual({ x: 50, y: 25 });
    });

    it("round-trips with invertBilinearPoint on an axis-aligned quad", () => {
        const result = invertBilinearPoint(axisAligned, { x: 25, y: 10 });
        expect(result).not.toBeNull();
        expect(result?.u).toBeCloseTo(0.25);
        expect(result?.v).toBeCloseTo(0.2);
    });

    it("round-trips on a rotated quad", () => {
        // 30 度回転した正方形
        const angle = Math.PI / 6;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotate = (x: number, y: number) => ({
            x: x * cos - y * sin,
            y: x * sin + y * cos,
        });
        const rotated: AnchorPos = {
            lt: rotate(0, 0),
            rt: rotate(100, 0),
            lb: rotate(0, 100),
            rb: rotate(100, 100),
        };

        const target = bilinearPoint(rotated, 0.3, 0.7);
        const result = invertBilinearPoint(rotated, target);

        expect(result).not.toBeNull();
        expect(result?.u).toBeCloseTo(0.3, 3);
        expect(result?.v).toBeCloseTo(0.7, 3);
    });

    it("round-trips on a trapezoid", () => {
        const trapezoid: AnchorPos = {
            lt: { x: 0, y: 0 },
            rt: { x: 100, y: 0 },
            lb: { x: 20, y: 80 },
            rb: { x: 130, y: 80 },
        };

        const target = bilinearPoint(trapezoid, 0.4, 0.6);
        const result = invertBilinearPoint(trapezoid, target);

        expect(result).not.toBeNull();
        expect(result?.u).toBeCloseTo(0.4, 3);
        expect(result?.v).toBeCloseTo(0.6, 3);
    });

    it("returns null for a degenerate quad", () => {
        const degenerate: AnchorPos = {
            lt: { x: 0, y: 0 },
            rt: { x: 0, y: 0 },
            lb: { x: 0, y: 0 },
            rb: { x: 0, y: 0 },
        };
        expect(invertBilinearPoint(degenerate, { x: 5, y: 5 })).toBeNull();
    });
});
