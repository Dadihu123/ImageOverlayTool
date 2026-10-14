import { GUIDE_GRID_MAX_LINES } from "../../../shared/constants/guide";
import type { GuideRect, GuideRectShape } from "../../../shared/types/Guide";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import type { Point } from "../../../shared/types/Point";
import type { WorldRect } from "./stageCoords";

/** 1-2-5 系列の仮数。グリッドの間引きに使う */
const GRID_MANTISSAS = [1, 2, 5] as const;

/**
 * 画面間隔が minScreenSpacing 以上になるよう、グリッド間隔を 1-2-5 系列で間引く。
 *
 * 間隔を制限するのではなく表示側で間引くため、ユーザーは極端に小さい値も入力できる
 * （見えなくなるだけで破綻はしない）。
 */
export const resolveGridStep = (
    spacing: number,
    scale: number,
    minScreenSpacing: number
): number => {
    if (!Number.isFinite(spacing) || spacing <= 0) {
        return spacing;
    }
    if (!Number.isFinite(scale) || scale <= 0) {
        return spacing;
    }

    const requiredWorldStep = minScreenSpacing / scale;
    if (spacing >= requiredWorldStep) {
        return spacing;
    }

    const ratio = requiredWorldStep / spacing;
    const exponent = Math.floor(Math.log10(ratio));

    let best = spacing * 10 ** (exponent + 1);
    for (let e = exponent; e <= exponent + 1; e += 1) {
        for (const mantissa of GRID_MANTISSAS) {
            const candidate = spacing * mantissa * 10 ** e;
            if (candidate >= requiredWorldStep && candidate < best) {
                best = candidate;
            }
        }
    }

    return best;
};

/**
 * [min, max] に含まれる、origin + n * step の値を列挙する。
 * 本数が上限を超える場合は空配列を返す（防御的措置）。
 */
export const enumerateGridLines = (
    min: number,
    max: number,
    origin: number,
    step: number,
    limit: number = GUIDE_GRID_MAX_LINES
): number[] => {
    if (!Number.isFinite(step) || step <= 0) {
        return [];
    }
    if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        !Number.isFinite(origin)
    ) {
        return [];
    }
    if (max < min) {
        return [];
    }

    const startIndex = Math.ceil((min - origin) / step);
    const endIndex = Math.floor((max - origin) / step);
    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
        return [];
    }

    const count = endIndex - startIndex + 1;
    if (count <= 0 || count > limit) {
        return [];
    }

    const values: number[] = [];
    for (let index = startIndex; index <= endIndex; index += 1) {
        values.push(origin + index * step);
    }
    return values;
};

/** 矩形をワールド座標で外側へ広げる */
export const expandWorldRect = (
    rect: WorldRect,
    margin: number
): WorldRect => ({
    x: rect.x - margin,
    y: rect.y - margin,
    width: rect.width + margin * 2,
    height: rect.height + margin * 2,
});

/** 値をグリッド線へ吸着させる（origin 基準の最近傍） */
export const snapValueToGrid = (
    value: number,
    origin: number,
    step: number
): number => {
    if (!Number.isFinite(step) || step <= 0) {
        return value;
    }
    return origin + Math.round((value - origin) / step) * step;
};

/** 長さが何格子分かを返す。step が不正な場合は null */
export const countGridCells = (
    length: number,
    step: number
): number | null => {
    if (!Number.isFinite(step) || step <= 0 || !Number.isFinite(length)) {
        return null;
    }
    return length / step;
};

/** 2 点の距離 */
export const distanceBetween = (a: Point, b: Point): number =>
    Math.hypot(a.x - b.x, a.y - b.y);

/** 参考枠の操作ハンドル */
export type RectHandle =
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "lt"
    | "rt"
    | "rb"
    | "lb";

/** ハンドルが辺か角か */
export const isEdgeHandle = (handle: RectHandle): boolean =>
    handle === "left" ||
    handle === "right" ||
    handle === "top" ||
    handle === "bottom";

export interface ResizeGuideRectOptions {
    /** 移動を許可する辺（辺ハンドル時に使う） */
    rect: WorldRect;
    handle: RectHandle;
    /** ポインタのワールド座標（ハンドル移動後の位置） */
    pointer: Point;
    /** 最小サイズ */
    minSize: number;
    /** 縦横比を固定するか（角ハンドル時のみ意味を持つ） */
    keepAspectRatio?: boolean;
}

/**
 * 参考枠をリサイズする。
 *
 * - 辺ハンドル: その辺だけが動き、対辺は固定される
 * - 角ハンドル: 隣接する 2 辺が動き、対角は固定される
 *
 * 「対辺・対角が固定される」ことが、2 端点を個別に動かすより
 * 直感的にサイズを合わせられる理由。
 */
export const resizeGuideRect = ({
    rect,
    handle,
    pointer,
    minSize,
    keepAspectRatio = false,
}: ResizeGuideRectOptions): WorldRect => {
    const left = rect.x;
    const top = rect.y;
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;

    let nextLeft = left;
    let nextTop = top;
    let nextRight = right;
    let nextBottom = bottom;

    const moveLeft = handle === "left" || handle === "lt" || handle === "lb";
    const moveRight = handle === "right" || handle === "rt" || handle === "rb";
    const moveTop = handle === "top" || handle === "lt" || handle === "rt";
    const moveBottom =
        handle === "bottom" || handle === "lb" || handle === "rb";

    if (moveLeft) {
        nextLeft = Math.min(pointer.x, right - minSize);
    }
    if (moveRight) {
        nextRight = Math.max(pointer.x, left + minSize);
    }
    if (moveTop) {
        nextTop = Math.min(pointer.y, bottom - minSize);
    }
    if (moveBottom) {
        nextBottom = Math.max(pointer.y, top + minSize);
    }

    if (keepAspectRatio && !isEdgeHandle(handle)) {
        // 角ドラッグ時は元の縦横比を維持する
        const ratio = rect.width / rect.height;
        if (Number.isFinite(ratio) && ratio > 0) {
            const width = nextRight - nextLeft;
            const height = nextBottom - nextTop;

            // 変化量が大きい方の軸に合わせる
            if (Math.abs(width - rect.width) >= Math.abs(height - rect.height)) {
                const targetHeight = width / ratio;
                if (moveTop) {
                    nextTop = nextBottom - targetHeight;
                } else {
                    nextBottom = nextTop + targetHeight;
                }
            } else {
                const targetWidth = height * ratio;
                if (moveLeft) {
                    nextLeft = nextRight - targetWidth;
                } else {
                    nextRight = nextLeft + targetWidth;
                }
            }
        }
    }

    return {
        x: nextLeft,
        y: nextTop,
        width: Math.max(minSize, nextRight - nextLeft),
        height: Math.max(minSize, nextBottom - nextTop),
    };
};

/** 参考枠の 8 ハンドルのワールド座標を返す */
export const getRectHandlePoints = (
    rect: WorldRect
): Record<RectHandle, Point> => {
    const midX = rect.x + rect.width / 2;
    const midY = rect.y + rect.height / 2;
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;

    return {
        left: { x: rect.x, y: midY },
        right: { x: right, y: midY },
        top: { x: midX, y: rect.y },
        bottom: { x: midX, y: bottom },
        lt: { x: rect.x, y: rect.y },
        rt: { x: right, y: rect.y },
        rb: { x: right, y: bottom },
        lb: { x: rect.x, y: bottom },
    };
};

/** 2 つの参考枠のサイズ比を求める */
export const computeSizeRatio = (
    current: WorldRect,
    baseline: WorldRect
): { width: number; height: number; average: number } | null => {
    if (
        baseline.width <= 0 ||
        baseline.height <= 0 ||
        !Number.isFinite(baseline.width) ||
        !Number.isFinite(baseline.height)
    ) {
        return null;
    }

    const width = current.width / baseline.width;
    const height = current.height / baseline.height;
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return null;
    }

    return { width, height, average: (width + height) / 2 };
};

/** アンカー四隅を中心まわりに等比拡大縮小する */
export const scaleAnchors = (
    anchors: AnchorPos,
    factor: number,
    origin?: Point
): AnchorPos => {
    const center =
        origin ??
        ({
            x: (anchors.lt.x + anchors.rt.x + anchors.lb.x + anchors.rb.x) / 4,
            y: (anchors.lt.y + anchors.rt.y + anchors.lb.y + anchors.rb.y) / 4,
        } satisfies Point);

    const scalePoint = (point: Point): Point => ({
        x: center.x + (point.x - center.x) * factor,
        y: center.y + (point.y - center.y) * factor,
    });

    return {
        lt: scalePoint(anchors.lt),
        rt: scalePoint(anchors.rt),
        lb: scalePoint(anchors.lb),
        rb: scalePoint(anchors.rb),
    };
};

/** 参考枠の形状からワールド矩形を得る（linked は画像アンカーが必要） */
export const resolveGuideRectWorldRect = (
    shape: GuideRectShape,
    anchorsByImageId: Map<string, AnchorPos>
): WorldRect | null => {
    if (shape.kind === "world") {
        return {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
        };
    }

    const anchors = anchorsByImageId.get(shape.imageSetId);
    if (!anchors) {
        return null;
    }

    const corners = mapRectToQuad(shape, anchors);
    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
    };
};

/**
 * 双線形補間。
 * P(u,v) = (1-u)(1-v)*lt + u(1-v)*rt + (1-u)v*lb + uv*rb
 */
export const bilinearPoint = (
    anchors: AnchorPos,
    u: number,
    v: number
): Point => {
    const { lt, rt, lb, rb } = anchors;
    const w00 = (1 - u) * (1 - v);
    const w10 = u * (1 - v);
    const w01 = (1 - u) * v;
    const w11 = u * v;

    return {
        x: w00 * lt.x + w10 * rt.x + w01 * lb.x + w11 * rb.x,
        y: w00 * lt.y + w10 * rt.y + w01 * lb.y + w11 * rb.y,
    };
};

/** linked な参考枠の四隅をワールド座標で返す（lt, rt, rb, lb の順） */
export const mapRectToQuad = (
    shape: Extract<GuideRectShape, { kind: "linked" }>,
    anchors: AnchorPos
): [Point, Point, Point, Point] => [
    bilinearPoint(anchors, shape.u0, shape.v0),
    bilinearPoint(anchors, shape.u1, shape.v0),
    bilinearPoint(anchors, shape.u1, shape.v1),
    bilinearPoint(anchors, shape.u0, shape.v1),
];

const BILINEAR_MAX_ITERATIONS = 6;
const BILINEAR_EPSILON = 1e-9;

/**
 * 双線形写像を逆解きして (u, v) を得る。
 * 2 次元 Newton 法を用い、収束しない場合は null を返す。
 */
export const invertBilinearPoint = (
    anchors: AnchorPos,
    point: Point
): { u: number; v: number } | null => {
    const { lt, rt, lb, rb } = anchors;

    // 初期値: 左上を基準とした線形近似
    const spanX = rt.x - lt.x || 1;
    const spanY = lb.y - lt.y || 1;
    let u = (point.x - lt.x) / spanX;
    let v = (point.y - lt.y) / spanY;

    if (!Number.isFinite(u) || !Number.isFinite(v)) {
        return null;
    }

    for (let i = 0; i < BILINEAR_MAX_ITERATIONS; i += 1) {
        const current = bilinearPoint(anchors, u, v);
        const fx = current.x - point.x;
        const fy = current.y - point.y;

        if (Math.abs(fx) < BILINEAR_EPSILON && Math.abs(fy) < BILINEAR_EPSILON) {
            return { u, v };
        }

        // 偏導関数
        const dudx = (1 - v) * (rt.x - lt.x) + v * (rb.x - lb.x);
        const dudy = (1 - v) * (lb.x - lt.x) + v * (rb.x - rt.x);
        const dvdx = (1 - v) * (rt.y - lt.y) + v * (rb.y - lb.y);
        const dvdy = (1 - v) * (lb.y - lt.y) + v * (rb.y - rt.y);

        const det = dudx * dvdy - dudy * dvdx;
        if (!Number.isFinite(det) || Math.abs(det) < BILINEAR_EPSILON) {
            return null;
        }

        u -= (fx * dvdy - fy * dudy) / det;
        v -= (dudx * fy - dvdx * fx) / det;

        if (!Number.isFinite(u) || !Number.isFinite(v)) {
            return null;
        }
    }

    const final = bilinearPoint(anchors, u, v);
    if (distanceBetween(final, point) > 1) {
        return null;
    }

    return { u, v };
};

/** 参考枠を画像アンカーへ束縛するための正規化座標を計算する */
export const toLinkedShape = (
    rect: GuideRect,
    imageSetId: string,
    anchors: AnchorPos
): GuideRectShape | null => {
    if (rect.shape.kind !== "world") {
        return null;
    }

    const corners: Point[] = [
        { x: rect.shape.x, y: rect.shape.y },
        { x: rect.shape.x + rect.shape.width, y: rect.shape.y },
        {
            x: rect.shape.x + rect.shape.width,
            y: rect.shape.y + rect.shape.height,
        },
        { x: rect.shape.x, y: rect.shape.y + rect.shape.height },
    ];

    const normalized = corners.map((corner) =>
        invertBilinearPoint(anchors, corner)
    );
    if (normalized.some((entry) => entry === null)) {
        return null;
    }

    const [lt, rt, rb, lb] = normalized as { u: number; v: number }[];

    return {
        kind: "linked",
        imageSetId,
        u0: Math.min(lt.u, lb.u),
        v0: Math.min(lt.v, rt.v),
        u1: Math.max(rt.u, rb.u),
        v1: Math.max(lb.v, rb.v),
    };
};
