/**
 * @vitest-environment happy-dom
 */
import * as React from "react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { NumericInput } from "@/renderer/components/ui/numeric-input";

type NumericInputProps = ComponentProps<typeof NumericInput>;

const renderInput = (
    props: Partial<Omit<NumericInputProps, "onCommit">> = {}
) => {
    const onCommit = vi.fn();
    const view = render(
        <NumericInput
            value={50}
            min={0}
            max={100}
            onCommit={onCommit}
            data-testid="numeric-input"
            {...props}
        />
    );

    const input = () => screen.getByTestId("numeric-input") as HTMLInputElement;

    return { onCommit, input, view };
};

/** 親が値を保持する実際の使われ方に近いハーネス */
const renderControlled = (initialValue: number) => {
    const onCommit = vi.fn();

    function Harness() {
        const [value, setValue] = React.useState(initialValue);
        return (
            <NumericInput
                value={value}
                min={0}
                max={100}
                step={1}
                precision={0}
                onCommit={(next) => {
                    onCommit(next);
                    setValue(next);
                }}
                data-testid="numeric-input"
            />
        );
    }

    render(<Harness />);

    return {
        onCommit,
        input: () => screen.getByTestId("numeric-input") as HTMLInputElement,
    };
};

describe("NumericInput", () => {
    it("shows the current value and does not commit while typing", () => {
        const { onCommit, input } = renderInput();

        expect(input().value).toBe("50");

        fireEvent.change(input(), { target: { value: "7" } });

        expect(input().value).toBe("7");
        expect(onCommit).not.toHaveBeenCalled();
    });

    it("commits the typed value on Enter", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "12.5" } });
        fireEvent.keyDown(input(), { key: "Enter" });

        expect(onCommit).toHaveBeenCalledWith(12.5);
    });

    it("commits the typed value on blur", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "80" } });
        fireEvent.blur(input());

        expect(onCommit).toHaveBeenCalledWith(80);
    });

    it("clamps out-of-range input on commit", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "999" } });
        fireEvent.keyDown(input(), { key: "Enter" });

        expect(onCommit).toHaveBeenCalledWith(100);
    });

    it("accepts values below the minimum after clamping", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "-40" } });
        fireEvent.keyDown(input(), { key: "Enter" });

        expect(onCommit).toHaveBeenCalledWith(0);
    });

    it("restores the current value when the draft is not a number", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "abc" } });
        fireEvent.keyDown(input(), { key: "Enter" });

        expect(onCommit).not.toHaveBeenCalled();
        expect(input().value).toBe("50");
    });

    it("restores the current value on Escape", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "33" } });
        fireEvent.keyDown(input(), { key: "Escape" });

        expect(onCommit).not.toHaveBeenCalled();
        expect(input().value).toBe("50");
    });

    it("steps by the given amount with arrow keys", () => {
        const { onCommit, input } = renderControlled(50);

        fireEvent.keyDown(input(), { key: "ArrowUp" });
        expect(onCommit).toHaveBeenLastCalledWith(51);
        expect(input().value).toBe("51");

        fireEvent.keyDown(input(), { key: "ArrowDown" });
        expect(onCommit).toHaveBeenLastCalledWith(50);
        expect(input().value).toBe("50");
    });

    it("does not commit when the confirmed value is unchanged", () => {
        const { onCommit, input } = renderInput();

        fireEvent.change(input(), { target: { value: "50" } });
        fireEvent.keyDown(input(), { key: "Enter" });

        expect(onCommit).not.toHaveBeenCalled();
    });

    it("follows external value changes while not focused", () => {
        const onCommit = vi.fn();
        const { rerender } = render(
            <NumericInput
                value={50}
                min={0}
                max={100}
                precision={0}
                onCommit={onCommit}
                data-testid="numeric-input"
            />
        );

        rerender(
            <NumericInput
                value={75}
                min={0}
                max={100}
                precision={0}
                onCommit={onCommit}
                data-testid="numeric-input"
            />
        );

        expect(
            (screen.getByTestId("numeric-input") as HTMLInputElement).value
        ).toBe("75");
    });

    it("keeps the draft while focused even if the value prop changes", () => {
        const onCommit = vi.fn();
        const renderProps = {
            min: 0,
            max: 100,
            precision: 0,
            onCommit,
            "data-testid": "numeric-input",
        };
        const { rerender } = render(
            <NumericInput value={50} {...renderProps} />
        );

        const input = screen.getByTestId("numeric-input");
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: "123" } });

        rerender(<NumericInput value={60} {...renderProps} />);

        expect(
            (screen.getByTestId("numeric-input") as HTMLInputElement).value
        ).toBe("123");
    });
});
