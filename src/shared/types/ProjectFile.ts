import type { DimensionConstraint, GuideConfig } from "./Guide";

export interface ProjectFile<TImage = unknown> {
    version: string;
    window: {
        width: number;
        height: number;
        x: number;
        y: number;
        color: string; // Includes alpha for background transparency
    };
    settings: {
        unitFactor: number;
        unit: "nm" | "um" | "mm";
    };
    canvas?: {
        x: number;
        y: number;
        scale: number;
    };
    images: TImage[];
    dimensionLines?: {
        id: string;
        start: { x: number; y: number };
        end: { x: number; y: number };
        color?: string;
        showUnitLabel?: boolean;
        /** 直交拘束（未指定は自由） */
        constraint?: DimensionConstraint;
        /** グリッド有効時に格子数を併記するか */
        showCellCount?: boolean;
    }[];
    /** 参考物（グリッド / 参考線 / 参考枠）設定 */
    guides?: GuideConfig;
}
