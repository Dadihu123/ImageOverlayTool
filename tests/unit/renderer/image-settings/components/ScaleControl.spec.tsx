/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ScaleControl } from "@/renderer/image-settings/components/ScaleControl";

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
            value={value?.[0] ?? 1}
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

describe("ScaleControl", () => {
    it("forwards slider updates as a scale ratio", () => {
        const onChange = vi.fn();
        render(<ScaleControl scale={1.25} onChange={onChange} />);

        fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });

        expect(onChange).toHaveBeenCalledWith(2);
    });

    it("shows the current value as a percentage and commits typed percent", () => {
        const onChange = vi.fn();
        render(<ScaleControl scale={1.25} onChange={onChange} />);

        const input = screen.getByTestId("numeric-input");
        expect((input as HTMLInputElement).value).toBe("125");
        expect(input.getAttribute("data-min")).toBe("10");
        expect(input.getAttribute("data-max")).toBe("500");

        fireEvent.change(input, { target: { value: "250" } });

        expect(onChange).toHaveBeenCalledWith(2.5);
    });
});
