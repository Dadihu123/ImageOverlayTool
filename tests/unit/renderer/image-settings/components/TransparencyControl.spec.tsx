/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { TransparencyControl } from "@/renderer/image-settings/components/TransparencyControl";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/components/ui/slider", () => ({
    Slider: ({ min, max, step, value, onValueChange }: any) => (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value?.[0] ?? 0}
            onChange={(event) => onValueChange([Number(event.target.value)])}
        />
    ),
}));

vi.mock("@/renderer/components/ui/numeric-input", () => ({
    NumericInput: ({ value, min, max, onCommit }: any) => (
        <input
            type="text"
            data-testid="numeric-input"
            data-min={min}
            data-max={max}
            value={value}
            onChange={(event) => onCommit(Number(event.target.value))}
        />
    ),
}));

describe("TransparencyControl", () => {
    it("forwards slider updates as a transparency ratio", () => {
        const onChange = vi.fn();

        render(<TransparencyControl transparency={0.37} onChange={onChange} />);

        fireEvent.change(screen.getByRole("slider"), {
            target: { value: "0.5" },
        });

        expect(onChange).toHaveBeenCalledWith(0.5);
    });

    it("shows the current value as a percentage and commits typed percent", () => {
        const onChange = vi.fn();

        render(<TransparencyControl transparency={0.37} onChange={onChange} />);

        const input = screen.getByTestId("numeric-input");
        expect((input as HTMLInputElement).value).toBe("37");
        expect(input.getAttribute("data-min")).toBe("0");
        expect(input.getAttribute("data-max")).toBe("100");

        fireEvent.change(input, { target: { value: "62" } });

        expect(onChange).toHaveBeenCalledWith(0.62);
    });
});
