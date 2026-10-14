import { describe, expect, it } from "vitest";
import { parseAndMigrateProjectFile } from "@/main/repositories/projectSchema";

describe("parseAndMigrateProjectFile", () => {
    it("throws when root is not an object", () => {
        expect(() => parseAndMigrateProjectFile(null)).toThrow(
            "root must be an object"
        );
    });

    it("throws when version is not a non-empty string", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                version: 123,
                images: [],
            })
        ).toThrow("version must be a string");
    });

    it("throws when images is not an array", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                version: "1.0.0",
                images: {},
            })
        ).toThrow("images must be an array");
    });

    it("throws when image item is not an object", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                images: [123],
            })
        ).toThrow("images[0] must be an object");
    });

    it("throws when image path is missing or empty", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                images: [{}],
            })
        ).toThrow("images[0].path is required");
    });

    it("throws when anchor object shape is invalid", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                images: [{ path: "a.png", initAnchorPos: "invalid" }],
            })
        ).toThrow("images[0].initAnchorPos must be an object");
    });

    it("throws when anchor point x/y are not finite numbers", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                images: [
                    {
                        path: "a.png",
                        initAnchorPos: {
                            lt: { x: "x", y: 0 },
                            lb: { x: 0, y: 0 },
                            rt: { x: 0, y: 0 },
                            rb: { x: 0, y: 0 },
                        },
                    },
                ],
            })
        ).toThrow("images[0].initAnchorPos.lt.x must be a number");

        expect(() =>
            parseAndMigrateProjectFile({
                images: [
                    {
                        path: "a.png",
                        currentAnchorPos: {
                            lt: { x: 0, y: 0 },
                            lb: { x: 0, y: 0 },
                            rt: { x: 0, y: Infinity },
                            rb: { x: 0, y: 0 },
                        },
                    },
                ],
            })
        ).toThrow("images[0].currentAnchorPos.rt.y must be a number");
    });

    it("throws when anchor point itself is not an object", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                images: [
                    {
                        path: "a.png",
                        initAnchorPos: {
                            lt: null,
                            lb: { x: 0, y: 0 },
                            rt: { x: 0, y: 0 },
                            rb: { x: 0, y: 0 },
                        },
                    },
                ],
            })
        ).toThrow("images[0].initAnchorPos.lt must be an object");
    });

    it("applies defaults for legacy/invalid window and settings blocks", () => {
        const result = parseAndMigrateProjectFile({
            images: [{ path: "a.png" }],
            window: null,
            settings: null,
        });

        expect(result.window).toEqual({
            width: 800,
            height: 600,
            x: 0,
            y: 0,
            color: "#00000000",
        });
        expect(result.settings).toEqual({ unitFactor: 1, unit: "um" });
        expect(result.images[0]).toEqual(
            expect.objectContaining({
                id: "migrated-image-0",
                sourceType: "file",
                transparency: 0,
                rotation: 0,
                initAnchorPos: null,
                currentAnchorPos: null,
                filters: undefined,
            })
        );
    });

    it("throws for invalid canvas or dimensionLines shapes", () => {
        expect(() =>
            parseAndMigrateProjectFile({
                images: [{ path: "a.png" }],
                canvas: 42,
            })
        ).toThrow("canvas must be an object");

        expect(() =>
            parseAndMigrateProjectFile({
                images: [{ path: "a.png" }],
                dimensionLines: {},
            })
        ).toThrow("dimensionLines must be an array");

        expect(() =>
            parseAndMigrateProjectFile({
                images: [{ path: "a.png" }],
                dimensionLines: [null],
            })
        ).toThrow("dimensionLines[0] must be an object");
    });

    it("normalizes filters/canvas/dimensionLines and keeps optional field semantics", () => {
        const result = parseAndMigrateProjectFile({
            images: [
                {
                    id: "",
                    path: "cache.png",
                    sourceType: "cache",
                    transparency: 1000,
                    rotation: "bad",
                    locked: "bad",
                    visible: false,
                    filters: {
                        binarization: {
                            enabled: 1,
                            threshold: "bad",
                        },
                        hsv: {
                            enabled: true,
                            h: Number.NaN,
                            s: Infinity,
                            v: -10,
                        },
                    },
                },
                {
                    path: "plain.png",
                    transparency: -100,
                    filters: {},
                },
            ],
            canvas: {
                x: "bad",
                y: 20,
                scale: Number.POSITIVE_INFINITY,
            },
            settings: {
                unitFactor: 3.2,
                unit: "invalid",
            },
            dimensionLines: [
                {
                    id: "",
                    start: { x: 1, y: 2 },
                    end: { x: 3, y: 4 },
                    showUnitLabel: true,
                },
                {
                    id: "line-2",
                    start: { x: 5, y: 6 },
                    end: { x: 7, y: 8 },
                    color: "#AABBCCDD",
                    showUnitLabel: "bad",
                },
            ],
        });

        expect(result.canvas).toEqual({ x: 0, y: 20, scale: 1 });
        expect(result.settings).toEqual({ unitFactor: 3.2, unit: "um" });

        expect(result.images[0]).toEqual(
            expect.objectContaining({
                id: "migrated-image-0",
                sourceType: "cache",
                transparency: 100,
                rotation: 0,
                locked: undefined,
                visible: false,
                filters: {
                    binarization: {
                        enabled: true,
                        threshold: 0,
                    },
                    hsv: {
                        enabled: true,
                        h: 0,
                        s: 0,
                        v: -10,
                    },
                },
            })
        );
        expect(result.images[1]).toEqual(
            expect.objectContaining({
                transparency: 0,
                filters: undefined,
            })
        );

        expect(result.dimensionLines?.[0]).toEqual({
            id: "migrated-line-0",
            start: { x: 1, y: 2 },
            end: { x: 3, y: 4 },
            showUnitLabel: true,
        });
        expect(result.dimensionLines?.[1]).toEqual({
            id: "line-2",
            start: { x: 5, y: 6 },
            end: { x: 7, y: 8 },
            color: "#aabbcc",
        });
    });

    it("normalizes provided window values with numeric/string fallbacks", () => {
        const result = parseAndMigrateProjectFile({
            images: [{ path: "a.png" }],
            window: {
                width: "bad",
                height: 700,
                x: Number.NaN,
                y: 20,
                color: "",
            },
        });

        expect(result.window).toEqual({
            width: 800,
            height: 700,
            x: 0,
            y: 20,
            color: "#00000000",
        });
    });

    it("omits guides when the file does not define them", () => {
        const result = parseAndMigrateProjectFile({
            images: [{ path: "a.png" }],
        });
        expect(result.guides).toBeUndefined();
    });

    it("keeps valid guide settings", () => {
        const result = parseAndMigrateProjectFile({
            images: [{ path: "a.png" }],
            guides: {
                grid: { enabled: true, spacingX: 12.5, spacingY: 30 },
                lines: { xs: [1, 2], ys: [3] },
                rects: [
                    {
                        id: "r1",
                        shape: {
                            kind: "world",
                            x: 1,
                            y: 2,
                            width: 3,
                            height: 4,
                        },
                    },
                ],
            },
        });

        expect(result.guides?.grid.enabled).toBe(true);
        expect(result.guides?.grid.spacingX).toBe(12.5);
        expect(result.guides?.lines.xs).toEqual([1, 2]);
        expect(result.guides?.rects).toHaveLength(1);
        // 未指定の項目は既定値で補われる
        expect(result.guides?.grid.subdivisions).toBe(1);
        expect(result.guides?.dimension.defaultConstraint).toBe("free");
    });

    it("degrades malformed guides instead of failing the whole load", () => {
        const result = parseAndMigrateProjectFile({
            images: [{ path: "a.png" }],
            guides: {
                grid: { spacingX: "huge", opacity: 99 },
                rects: "not-an-array",
            },
        });

        expect(result.guides?.grid.spacingX).toBe(50);
        expect(result.guides?.grid.opacity).toBe(1);
        expect(result.guides?.rects).toEqual([]);
    });

    it("persists the dimension line constraint", () => {
        const result = parseAndMigrateProjectFile({
            images: [{ path: "a.png" }],
            dimensionLines: [
                {
                    id: "l1",
                    start: { x: 0, y: 0 },
                    end: { x: 10, y: 0 },
                    constraint: "horizontal",
                },
                {
                    id: "l2",
                    start: { x: 0, y: 0 },
                    end: { x: 10, y: 10 },
                    constraint: "nonsense",
                },
            ],
        });

        expect(result.dimensionLines?.[0].constraint).toBe("horizontal");
        // 不正値は落とされ、フィールド自体が付かない
        expect(result.dimensionLines?.[1].constraint).toBeUndefined();
    });
});
