/**
 * 画像変形パラメータの許容範囲。
 * スライダー・数値入力・ストア更新のすべてがこの定義を共有し、
 * UI ごとに範囲がずれるのを防ぐ。
 */

/** 透過度（0 = 不透明, 1 = 完全透明） */
export const TRANSPARENCY_MIN = 0;
export const TRANSPARENCY_MAX = 1;
export const TRANSPARENCY_SLIDER_STEP = 0.01;

/** 拡大/縮小倍率（1 = 等倍） */
export const SCALE_MIN = 0.1;
export const SCALE_MAX = 5;
export const SCALE_SLIDER_STEP = 0.01;

/** 回転角度（度） */
export const ROTATION_MIN = -180;
export const ROTATION_MAX = 180;
export const ROTATION_SLIDER_STEP = 1;

/**
 * 比率を表示用パーセントへ変換する。
 * 0.1 * 100 が 10.000000000000002 になるような誤差を落とし、
 * 「10%」と入力して 0.10000000000000002 が保存されるのを防ぐ。
 */
export const toPercent = (ratio: number): number =>
    Number((ratio * 100).toFixed(6));

/** 表示用パーセントを比率へ戻す */
export const fromPercent = (percent: number): number => percent / 100;

export const TRANSPARENCY_PERCENT_MIN = toPercent(TRANSPARENCY_MIN);
export const TRANSPARENCY_PERCENT_MAX = toPercent(TRANSPARENCY_MAX);
export const SCALE_PERCENT_MIN = toPercent(SCALE_MIN);
export const SCALE_PERCENT_MAX = toPercent(SCALE_MAX);

/**
 * 数値を [min, max] に収める。
 * 有限値でない場合は null を返し、呼び出し側で「更新しない」判断ができるようにする。
 */
export const clampToRange = (
    value: number,
    min: number,
    max: number
): number | null => {
    if (!Number.isFinite(value)) {
        return null;
    }

    return Math.min(max, Math.max(min, value));
};

const FULL_WIDTH_DIGIT_OFFSET = 0xfee0;

/**
 * 数値入力を正規化する。全角数字や全角の小数点・マイナスも受け付ける。
 */
export const normalizeNumericInput = (raw: string): string => {
    return raw
        .replace(/[０-９]/g, (char) =>
            String.fromCharCode(char.charCodeAt(0) - FULL_WIDTH_DIGIT_OFFSET)
        )
        .replace(/[．。]/g, ".")
        .replace(/[－−ー]/g, "-")
        .trim();
};
