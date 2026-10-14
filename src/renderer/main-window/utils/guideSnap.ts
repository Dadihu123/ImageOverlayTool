import type { GridConfig, GuideLinesConfig } from "../../../shared/types/Guide";
import type { Point } from "../../../shared/types/Point";
import type { WorldRect } from "./stageCoords";

/** 吸着元の種類 */
export type SnapSource =
    | { kind: "rectCorner"; rectId: string; corner: "lt" | "rt" | "rb" | "lb" }
    | {
          kind: "rectEdge";
          rectId: string;
          edge: "left" | "right" | "top" | "bottom";
      }
    | { kind: "guideLine"; axis: "x" | "y"; index: number }
    | { kind: "gridIntersection" }
    | { kind: "gridLine"; axis: "x" | "y" }
    | { kind: "dimensionEndpoint"; lineId: string; which: "start" | "end" };

export interface AxisSnap {
    snapped: boolean;
    value: number;
    source: SnapSource | null;
}

export interface SnapResult {
    point: Point;
    x: AxisSnap;
    y: AxisSnap;
    /** フィードバック表示用の代表ソース（最も優先度が高いもの） */
    primary: SnapSource | null;
}

/** 吸着を許可する軸 */
export type SnapAxis = "both" | "x" | "y";

/** 解決済みの参考枠（linked は呼び出し側でワールド矩形へ変換しておく） */
export interface ResolvedGuideRect {
    id: string;
    rect: WorldRect;
}

export interface SnapDimensionLine {
    id: string;
    start: Point;
    end: Point;
}

export interface SnapContext {
    grid: GridConfig;
    guideLines: GuideLinesConfig;
    rects: ResolvedGuideRect[];
    dimensionLines: SnapDimensionLine[];
    /** ワールド単位の吸着半径 */
    radius: number;
    /** 表示に使われている実効グリッド間隔（LOD 適用後） */
    gridStepX: number;
    gridStepY: number;
    axis: SnapAxis;
}

/** 優先度。数値が小さいほど優先される */
const PRIORITY = {
    rectCorner: 1,
    rectEdge: 2,
    guideLine: 3,
    grid: 4,
    dimensionEndpoint: 5,
} as const;

interface AxisCandidate {
    value: number;
    distance: number;
    priority: number;
    source: SnapSource;
}

interface PointCandidate {
    point: Point;
    distance: number;
    priority: number;
    source: SnapSource;
}

const RECT_CORNERS = ["lt", "rt", "rb", "lb"] as const;

const collectPointCandidates = (
    context: SnapContext
): PointCandidate[] => {
    const candidates: PointCandidate[] = [];

    if (context.grid.snap.guideRectEdges) {
        for (const { id, rect } of context.rects) {
            const corners: Record<(typeof RECT_CORNERS)[number], Point> = {
                lt: { x: rect.x, y: rect.y },
                rt: { x: rect.x + rect.width, y: rect.y },
                rb: { x: rect.x + rect.width, y: rect.y + rect.height },
                lb: { x: rect.x, y: rect.y + rect.height },
            };
            for (const corner of RECT_CORNERS) {
                candidates.push({
                    point: corners[corner],
                    distance: 0,
                    priority: PRIORITY.rectCorner,
                    source: { kind: "rectCorner", rectId: id, corner },
                });
            }
        }
    }

    if (context.grid.snap.dimensionEndpoints) {
        for (const line of context.dimensionLines) {
            candidates.push({
                point: line.start,
                distance: 0,
                priority: PRIORITY.dimensionEndpoint,
                source: {
                    kind: "dimensionEndpoint",
                    lineId: line.id,
                    which: "start",
                },
            });
            candidates.push({
                point: line.end,
                distance: 0,
                priority: PRIORITY.dimensionEndpoint,
                source: {
                    kind: "dimensionEndpoint",
                    lineId: line.id,
                    which: "end",
                },
            });
        }
    }

    return candidates;
};

const collectAxisCandidates = (
    context: SnapContext,
    axis: "x" | "y"
): AxisCandidate[] => {
    const candidates: AxisCandidate[] = [];

    if (context.grid.snap.guideRectEdges) {
        for (const { id, rect } of context.rects) {
            if (axis === "x") {
                candidates.push({
                    value: rect.x,
                    distance: 0,
                    priority: PRIORITY.rectEdge,
                    source: { kind: "rectEdge", rectId: id, edge: "left" },
                });
                candidates.push({
                    value: rect.x + rect.width,
                    distance: 0,
                    priority: PRIORITY.rectEdge,
                    source: { kind: "rectEdge", rectId: id, edge: "right" },
                });
            } else {
                candidates.push({
                    value: rect.y,
                    distance: 0,
                    priority: PRIORITY.rectEdge,
                    source: { kind: "rectEdge", rectId: id, edge: "top" },
                });
                candidates.push({
                    value: rect.y + rect.height,
                    distance: 0,
                    priority: PRIORITY.rectEdge,
                    source: { kind: "rectEdge", rectId: id, edge: "bottom" },
                });
            }
        }
    }

    if (context.grid.snap.guideLines && context.guideLines.enabled) {
        const values =
            axis === "x" ? context.guideLines.xs : context.guideLines.ys;
        values.forEach((value, index) => {
            candidates.push({
                value,
                distance: 0,
                priority: PRIORITY.guideLine,
                source: { kind: "guideLine", axis, index },
            });
        });
    }

    if (context.grid.enabled && context.grid.snap.gridIntersection) {
        const step = axis === "x" ? context.gridStepX : context.gridStepY;
        const origin = axis === "x" ? context.grid.origin.x : context.grid.origin.y;
        if (Number.isFinite(step) && step > 0) {
            const snapped = origin + Math.round((0 - origin) / step) * step;
            candidates.push({
                value: snapped,
                distance: 0,
                priority: PRIORITY.grid,
                source: { kind: "gridLine", axis },
            });
        }
    }

    return candidates;
};

/**
 * 指定軸について、優先度→距離の順で最良の候補を選ぶ。
 * グリッドは候補値が原点基準で固定のため、ここでポインタ位置に応じた値を再計算する。
 */
const pickAxisCandidate = (
    candidates: AxisCandidate[],
    pointerValue: number,
    radius: number,
    axis: "x" | "y",
    context: SnapContext
): AxisCandidate | null => {
    let best: AxisCandidate | null = null;

    for (const candidate of candidates) {
        let value = candidate.value;

        if (candidate.source.kind === "gridLine") {
            const step =
                axis === "x" ? context.gridStepX : context.gridStepY;
            const origin =
                axis === "x" ? context.grid.origin.x : context.grid.origin.y;
            if (!Number.isFinite(step) || step <= 0) {
                continue;
            }
            value = origin + Math.round((pointerValue - origin) / step) * step;
        }

        const distance = Math.abs(pointerValue - value);
        if (distance > radius) {
            continue;
        }

        if (
            !best ||
            candidate.priority < best.priority ||
            (candidate.priority === best.priority && distance < best.distance)
        ) {
            best = { ...candidate, value, distance };
        }
    }

    return best;
};

const pickPointCandidate = (
    candidates: PointCandidate[],
    pointer: Point,
    radius: number,
    maxPriority: number
): PointCandidate | null => {
    let best: PointCandidate | null = null;

    for (const candidate of candidates) {
        if (candidate.priority > maxPriority) {
            continue;
        }
        const distance = Math.hypot(
            pointer.x - candidate.point.x,
            pointer.y - candidate.point.y
        );
        if (distance > radius) {
            continue;
        }
        if (
            !best ||
            candidate.priority < best.priority ||
            (candidate.priority === best.priority && distance < best.distance)
        ) {
            best = { ...candidate, distance };
        }
    }

    return best;
};

const NO_SNAP = (value: number): AxisSnap => ({
    snapped: false,
    value,
    source: null,
});

/**
 * ワールド座標のポインタ位置を、優先度に従って吸着させる。
 *
 * 優先度（高い順）:
 *   1. 参考枠の角
 *   2. 参考枠の辺
 *   3. 参考線
 *   4. グリッド
 *   5. 寸法線の端点
 */
export const resolveSnap = (
    pointer: Point,
    context: SnapContext
): SnapResult => {
    const allowX = context.axis === "both" || context.axis === "x";
    const allowY = context.axis === "both" || context.axis === "y";
    const radius = Number.isFinite(context.radius) ? context.radius : 0;

    if (radius <= 0) {
        return {
            point: pointer,
            x: NO_SNAP(pointer.x),
            y: NO_SNAP(pointer.y),
            primary: null,
        };
    }

    const pointCandidates = collectPointCandidates(context);

    // 1. 参考枠の角（最優先）。両軸まとめて吸着させる
    const cornerHit = pickPointCandidate(
        pointCandidates,
        pointer,
        radius,
        PRIORITY.rectCorner
    );
    if (cornerHit) {
        return {
            point: cornerHit.point,
            x: { snapped: true, value: cornerHit.point.x, source: cornerHit.source },
            y: { snapped: true, value: cornerHit.point.y, source: cornerHit.source },
            primary: cornerHit.source,
        };
    }

    // 2-4. 軸ごとに 参考枠の辺 → 参考線 → グリッド
    const xCandidate = allowX
        ? pickAxisCandidate(
              collectAxisCandidates(context, "x"),
              pointer.x,
              radius,
              "x",
              context
          )
        : null;
    const yCandidate = allowY
        ? pickAxisCandidate(
              collectAxisCandidates(context, "y"),
              pointer.y,
              radius,
              "y",
              context
          )
        : null;

    const xSnap: AxisSnap = xCandidate
        ? { snapped: true, value: xCandidate.value, source: xCandidate.source }
        : NO_SNAP(pointer.x);
    const ySnap: AxisSnap = yCandidate
        ? { snapped: true, value: yCandidate.value, source: yCandidate.source }
        : NO_SNAP(pointer.y);

    // 3. 寸法線の端点（最低優先）。未吸着の軸のみ補完する
    const endpointHit = pickPointCandidate(
        pointCandidates,
        pointer,
        radius,
        PRIORITY.dimensionEndpoint
    );
    if (endpointHit) {
        const xPriority = xCandidate ? xCandidate.priority : Number.MAX_VALUE;
        const yPriority = yCandidate ? yCandidate.priority : Number.MAX_VALUE;
        if (allowX && xPriority > PRIORITY.dimensionEndpoint) {
            xSnap.snapped = true;
            xSnap.value = endpointHit.point.x;
            xSnap.source = endpointHit.source;
        }
        if (allowY && yPriority > PRIORITY.dimensionEndpoint) {
            ySnap.snapped = true;
            ySnap.value = endpointHit.point.y;
            ySnap.source = endpointHit.source;
        }
    }

    const point: Point = { x: xSnap.value, y: ySnap.value };

    let primary: SnapSource | null = null;
    if (
        xSnap.source &&
        ySnap.source &&
        xSnap.source.kind === "gridLine" &&
        ySnap.source.kind === "gridLine"
    ) {
        primary = { kind: "gridIntersection" };
    } else if (xSnap.source && ySnap.source) {
        const xPriority = xCandidate ? xCandidate.priority : Number.MAX_VALUE;
        const yPriority = yCandidate ? yCandidate.priority : Number.MAX_VALUE;
        primary = xPriority <= yPriority ? xSnap.source : ySnap.source;
    } else {
        primary = xSnap.source ?? ySnap.source;
    }

    return { point, x: xSnap, y: ySnap, primary };
};
