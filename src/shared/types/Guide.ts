import type { Point } from "./Point";

/**
 * 参考物（网格 / 参考線 / 参考枠）の描画階層。
 * - belowImages: 画像より背面
 * - aboveImages: 画像より前面
 * - screenLocked: キャンバスの拡大縮小に追従しない（画面固定）
 */
export type GuideLayerPlacement =
    | "belowImages"
    | "aboveImages"
    | "screenLocked";

/** グリッドのスナップ対象 */
export interface GridSnapConfig {
    /** 格子点（交点）に吸着する */
    gridIntersection: boolean;
    /** 参考線に吸着する */
    guideLines: boolean;
    /** 参考枠の辺・角に吸着する */
    guideRectEdges: boolean;
    /** 既存の寸法線の端点に吸着する */
    dimensionEndpoints: boolean;
}

/** 参考グリッド設定 */
export interface GridConfig {
    enabled: boolean;
    /** 主格子の間隔（ワールド座標 px）。0 より大きい値 */
    spacingX: number;
    spacingY: number;
    /** 主格子あたりの細分数。1 のとき細線なし */
    subdivisions: number;
    /** グリッド原点（ワールド座標） */
    origin: Point;
    /** X/Y 間隔を連動させるか */
    linkSpacing: boolean;
    color: string;
    minorColor: string;
    /** 0..1 */
    opacity: number;
    /** 線幅（px）。画面基準で一定 */
    lineWidth: number;
    layer: GuideLayerPlacement;
    snap: GridSnapConfig;
}

/** 単独の参考線設定 */
export interface GuideLinesConfig {
    enabled: boolean;
    /** 縦線のワールド x 座標 */
    xs: number[];
    /** 横線のワールド y 座標 */
    ys: number[];
    color: string;
    opacity: number;
    lineWidth: number;
    layer: Exclude<GuideLayerPlacement, "screenLocked">;
}

/**
 * 参考枠の形状。
 * - world: 軸平行の矩形。ワールド座標を直接保持する
 * - linked: 画像のアンカー四隅に対する正規化座標 (u, v) ∈ [0,1] で保持する
 */
export type GuideRectShape =
    | {
          kind: "world";
          x: number;
          y: number;
          width: number;
          height: number;
      }
    | {
          kind: "linked";
          imageSetId: string;
          u0: number;
          v0: number;
          u1: number;
          v1: number;
      };

/** 参考枠（矩形） */
export interface GuideRect {
    id: string;
    /** ユーザー指定の名称（例:「頭」「基準」） */
    label?: string;
    color?: string;
    showSizeLabel?: boolean;
    /** 固定するとドラッグ不可になる */
    locked?: boolean;
    shape: GuideRectShape;
}

/** 参考物の全体設定 */
export interface GuideConfig {
    grid: GridConfig;
    lines: GuideLinesConfig;
    rects: GuideRect[];
    dimension: DimensionGuideConfig;
    /** 比率比較の基準となる参考枠の id */
    baselineRectId?: string | null;
}

/** 寸法線の直交拘束 */
export type DimensionConstraint = "free" | "horizontal" | "vertical";

/** 寸法線まわりの参考設定 */
export interface DimensionGuideConfig {
    /** 新規作成時の既定拘束 */
    defaultConstraint: DimensionConstraint;
    /** グリッド有効時に格子数を併記するか */
    showCellCount: boolean;
}
