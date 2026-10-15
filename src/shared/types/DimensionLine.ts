import type { DimensionConstraint } from "./Guide";

export interface DimensionLine {
    id: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    color?: string;
    showUnitLabel?: boolean;
    /** 直交拘束。未指定は自由 */
    constraint?: DimensionConstraint;
    /** グリッド有効時に格子数を併記するか */
    showCellCount?: boolean;
}
