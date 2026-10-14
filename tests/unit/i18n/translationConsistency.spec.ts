/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import en from "@/i18n/en.json";
import ja from "@/i18n/ja.json";
import zh from "@/i18n/zh.json";
import { SUPPORTED_LANGUAGES } from "@/i18n/languages";

const SOURCE_ROOT = path.resolve("src");
const TRANSLATION_CALL_PATTERN = /\bt\(\s*["']([^"'`]+)["']/g;
const DEFAULT_VALUE_PATTERN = /\bt\(\s*["'][^"'`]+["']\s*,\s*["'`]/;

const DICTIONARIES = {
    en,
    ja,
    zh,
} satisfies Record<(typeof SUPPORTED_LANGUAGES)[number], unknown>;

/** Flattens a nested dictionary into [dotted key path, leaf value] pairs. */
const flattenEntries = (
    dictionary: unknown,
    prefix = ""
): [string, unknown][] => {
    if (!dictionary || typeof dictionary !== "object") {
        return [];
    }

    return Object.entries(dictionary as Record<string, unknown>).flatMap(
        ([key, value]) => {
            const keyPath = prefix ? `${prefix}.${key}` : key;
            return value && typeof value === "object"
                ? flattenEntries(value, keyPath)
                : [[keyPath, value] as [string, unknown]];
        }
    );
};

/** Flattens a nested dictionary into a sorted list of dotted key paths. */
const flattenKeys = (dictionary: unknown): string[] =>
    flattenEntries(dictionary).map(([key]) => key);

const collectSourceFiles = (directory: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectSourceFiles(fullPath));
            continue;
        }
        if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
};

const hasTranslationKey = (dictionary: unknown, keyPath: string): boolean => {
    const keys = keyPath.split(".");
    let current: unknown = dictionary;

    for (const key of keys) {
        if (
            !current ||
            typeof current !== "object" ||
            !(key in (current as Record<string, unknown>))
        ) {
            return false;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return true;
};

describe("translation consistency", () => {
    it("does not use t(key, fallback) style defaults in source code", () => {
        const files = collectSourceFiles(SOURCE_ROOT);
        const violations: string[] = [];

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, "utf8");
            if (DEFAULT_VALUE_PATTERN.test(source)) {
                violations.push(path.relative(process.cwd(), filePath));
            }
        }

        expect(violations).toEqual([]);
    });

    it("all translation keys used in source exist in every locale", () => {
        const files = collectSourceFiles(SOURCE_ROOT);
        const keys = new Set<string>();

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, "utf8");
            let match: RegExpExecArray | null = null;
            while ((match = TRANSLATION_CALL_PATTERN.exec(source)) !== null) {
                keys.add(match[1]);
            }
        }

        for (const [language, dictionary] of Object.entries(DICTIONARIES)) {
            const missing = [...keys].filter(
                (key) => !hasTranslationKey(dictionary, key)
            );
            expect(missing, `missing keys in ${language}`).toEqual([]);
        }
    });

    it("every locale defines exactly the same set of keys as en", () => {
        const referenceKeys = flattenKeys(en).sort();

        for (const [language, dictionary] of Object.entries(DICTIONARIES)) {
            const keys = flattenKeys(dictionary).sort();

            expect(
                referenceKeys.filter((key) => !keys.includes(key)),
                `keys missing in ${language}`
            ).toEqual([]);
            expect(
                keys.filter((key) => !referenceKeys.includes(key)),
                `extra keys in ${language}`
            ).toEqual([]);
        }
    });

    it("no locale leaves a translation empty", () => {
        for (const [language, dictionary] of Object.entries(DICTIONARIES)) {
            const blank = flattenEntries(dictionary)
                .filter(([, value]) => !String(value).trim())
                .map(([key]) => key);

            expect(blank, `empty values in ${language}`).toEqual([]);
        }
    });
});
