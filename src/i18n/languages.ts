import translationEn from "./en.json";
import translationJa from "./ja.json";
import translationZh from "./zh.json";

export type AppTranslation = typeof translationEn;

export const SUPPORTED_LANGUAGES = ["en", "ja", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/**
 * Language names shown in the language picker.
 * Each entry is written in its own language (autonym) so it stays readable
 * regardless of the currently active UI language.
 */
export const LANGUAGE_LABELS = {
    en: "English",
    ja: "日本語",
    zh: "简体中文",
} satisfies Record<SupportedLanguage, string>;

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

export const normalizeLanguage = (
    language?: string | null
): SupportedLanguage => {
    const normalized = (language ?? "").trim().toLowerCase();
    if (SUPPORTED_LANGUAGE_SET.has(normalized)) {
        return normalized as SupportedLanguage;
    }

    const baseLanguage = normalized.split("-")[0];
    if (SUPPORTED_LANGUAGE_SET.has(baseLanguage)) {
        return baseLanguage as SupportedLanguage;
    }

    return DEFAULT_LANGUAGE;
};

export const I18N_RESOURCES = {
    en: {
        translation: translationEn,
    },
    ja: {
        translation: translationJa,
    },
    zh: {
        translation: translationZh,
    },
} satisfies Record<SupportedLanguage, { translation: AppTranslation }>;
