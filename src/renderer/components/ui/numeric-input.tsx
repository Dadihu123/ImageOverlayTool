import * as React from "react";

import { Input } from "@/renderer/components/ui/input";
import {
    clampToRange,
    normalizeNumericInput,
} from "@/shared/constants/imageTransform";
import { cn } from "@/renderer/utils/cn";

interface NumericInputProps
    extends Omit<
        React.ComponentProps<"input">,
        "value" | "onChange" | "type" | "min" | "max" | "step"
    > {
    /** 現在値（表示単位）。スライダー等の外部変更にも追従する。 */
    value: number;
    /** 許容最小値（表示単位）。範囲外は確定時に丸め込む。 */
    min: number;
    /** 許容最大値（表示単位）。範囲外は確定時に丸め込む。 */
    max: number;
    /** 上下キー1回あたりの増減量。未指定時は表示精度から算出する。 */
    step?: number;
    /** 入力確定時（Enter / フォーカスアウト）に呼ばれる。 */
    onCommit: (value: number) => void;
    /** 表示・確定に使う小数桁数。 */
    precision?: number;
}

const roundToPrecision = (value: number, precision: number): number => {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};

const toDisplayText = (value: number, precision: number): string => {
    const fixed = value.toFixed(precision);
    if (!fixed.includes(".")) {
        return fixed;
    }

    return fixed.replace(/0+$/, "").replace(/\.$/, "");
};

const parseText = (text: string): number | null => {
    const normalized = normalizeNumericInput(text);
    if (normalized === "" || normalized === "-" || normalized === ".") {
        return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * スライダーと併用する数値入力。
 *
 * 入力中は自由に編集でき、確定（Enter / フォーカスアウト）時にのみ値を反映する。
 * 「1」→「10」→「100」のような途中入力がそのままスライダーやストアへ流れないため、
 * スライダーの操作性を損なわずに厳密な数値指定ができる。
 * Escape や不正値の確定時は元の表示へ戻す。
 */
export function NumericInput({
    value,
    min,
    max,
    step,
    onCommit,
    precision = 2,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
}: NumericInputProps) {
    const [draft, setDraft] = React.useState(() =>
        toDisplayText(value, precision)
    );
    const [isFocused, setIsFocused] = React.useState(false);

    // スライダー操作など外部からの変更に追従する（編集中は上書きしない）
    React.useEffect(() => {
        if (isFocused) {
            return;
        }
        setDraft(toDisplayText(value, precision));
    }, [value, precision, isFocused]);

    /** 値が実際に変わるときだけ通知する（無変更の確定で履歴を汚さない） */
    const emit = React.useCallback(
        (next: number) => {
            if (next === value) {
                return;
            }
            onCommit(next);
        },
        [onCommit, value]
    );

    const commit = React.useCallback(
        (text: string) => {
            const currentText = toDisplayText(value, precision);

            // 表示のまま確定した場合は何もしない
            if (normalizeNumericInput(text) === currentText) {
                setDraft(currentText);
                return;
            }

            const parsed = parseText(text);
            const clamped =
                parsed === null
                    ? null
                    : clampToRange(roundToPrecision(parsed, precision), min, max);

            if (clamped === null) {
                setDraft(currentText);
                return;
            }

            emit(clamped);
            setDraft(toDisplayText(clamped, precision));
        },
        [emit, max, min, precision, value]
    );

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // 上書きしやすくするため全選択する
        event.currentTarget.select();
        onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        commit(event.currentTarget.value);
        onBlur?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            commit(event.currentTarget.value);
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            setDraft(toDisplayText(value, precision));
            return;
        }

        const delta =
            event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
        if (delta === 0) {
            return;
        }

        event.preventDefault();
        const base = parseText(event.currentTarget.value) ?? value;
        const nextStep = step ?? 1 / 10 ** precision;
        const next = clampToRange(
            roundToPrecision(base + delta * nextStep, precision),
            min,
            max
        );
        if (next === null) {
            return;
        }

        emit(next);
        setDraft(toDisplayText(next, precision));
    };

    return (
        <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
                "h-7 shrink-0 px-2 text-right text-xs tabular-nums",
                className
            )}
        />
    );
}
