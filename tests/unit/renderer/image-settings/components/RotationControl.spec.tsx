/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RotationControl } from "@/renderer/image-settings/components/RotationControl";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/components/ui/slider", () => ({
    Slider: ({ min, max, value, onValueChange }: any) => (
        <input
            type="range"
            min={min}
            max={max}
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

describe("RotationControl", () => {
    it("forwards slider and numeric input updates as degrees", () => {
        const onRotationChange = vi.fn();

        render(
            <RotationControl
                rotation={12.7}
                onRotationChange={onRotationChange}
            />
        );

        fireEvent.change(screen.getByRole("slider"), { target: { value: "45" } });
        expect(onRotationChange).toHaveBeenCalledWith(45);

        const input = screen.getByTestId("numeric-input");
        expect(input.getAttribute("data-min")).toBe("-180");
        expect(input.getAttribute("data-max")).toBe("180");

        fireEvent.change(input, { target: { value: "-33.5" } });
        expect(onRotationChange).toHaveBeenLastCalledWith(-33.5);
    });
});
