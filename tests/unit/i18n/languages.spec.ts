import { describe, expect, it } from "vitest";
import {
    DEFAULT_LANGUAGE,
    I18N_RESOURCES,
    LANGUAGE_LABELS,
    SUPPORTED_LANGUAGES,
    normalizeLanguage,
} from "@/i18n/languages";

describe("i18n/languages", () => {
    it("normalizes exact supported languages", () => {
        expect(normalizeLanguage("en")).toBe("en");
        expect(normalizeLanguage("ja")).toBe("ja");
        expect(normalizeLanguage("zh")).toBe("zh");
    });

    it("normalizes case and trims whitespace", () => {
        expect(normalizeLanguage(" JA ")).toBe("ja");
        expect(normalizeLanguage(" En ")).toBe("en");
        expect(normalizeLanguage(" ZH ")).toBe("zh");
    });

    it("normalizes locale variants to base language", () => {
        expect(normalizeLanguage("en-US")).toBe("en");
        expect(normalizeLanguage("ja-JP")).toBe("ja");
        expect(normalizeLanguage("zh-CN")).toBe("zh");
        expect(normalizeLanguage("zh-Hans")).toBe("zh");
        expect(normalizeLanguage("zh-TW")).toBe("zh");
    });

    it("falls back to default for unknown/empty values", () => {
        expect(normalizeLanguage("fr")).toBe(DEFAULT_LANGUAGE);
        expect(normalizeLanguage("")).toBe(DEFAULT_LANGUAGE);
        expect(normalizeLanguage(null)).toBe(DEFAULT_LANGUAGE);
        expect(normalizeLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    });

    it("exports supported language/resources shape", () => {
        expect(SUPPORTED_LANGUAGES).toEqual(["en", "ja", "zh"]);
        expect(I18N_RESOURCES.en.translation).toBeTypeOf("object");
        expect(I18N_RESOURCES.ja.translation).toBeTypeOf("object");
        expect(I18N_RESOURCES.zh.translation).toBeTypeOf("object");
    });

    it("provides a display label for every supported language", () => {
        for (const language of SUPPORTED_LANGUAGES) {
            expect(LANGUAGE_LABELS[language]).toBeTruthy();
        }
    });
});
