import { IIPCService } from "@/renderer/services/ipcService";
import { ImageSet } from "@/shared/types/ImageSet";
import { DimensionLine } from "@/shared/types/DimensionLine";
import type { GuideConfig } from "@/shared/types/Guide";
import type { ImageInfoResult } from "@/shared/types/ImageInfo";
import { ProjectFile } from "@/shared/types/ProjectFile";
import { CaptureResult } from "@/shared/types/CaptureResult";
import {
    SettingType,
    DEFAULT_WINDOW_COLOR_PRESETS,
} from "@/shared/types/AppConfig";
import { LicenseInfo } from "@/shared/types/LicenseInfo";
import type { LaunchIntent } from "@/shared/types/LaunchIntent";
import type { AppControlCommand } from "@/shared/types/AppControlCommand";
import type { InteractionMode } from "@/shared/types/InteractionMode";

/**
 * テスト用モックサービス
 */
export class MockIPCService implements IIPCService {
    log = {
        debug: async () => { },
        info: async () => { },
        warn: async () => { },
        error: async () => { },
        export: async () => null,
    };

    async minimizeWindow(): Promise<void> { }

    async switchWindowSize(): Promise<boolean> {
        return true;
    }

    async setWindowRect(_rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): Promise<void> { }

    async showConfirmDialog(_options: {
        title?: string;
        message: string;
        detail?: string;
        confirmLabel?: string;
        cancelLabel?: string;
    }): Promise<boolean> {
        return true;
    }

    async setIgnoreMouseEvents(_ignore: boolean): Promise<void> { }

    async setAlwaysOnTop(_enabled: boolean): Promise<void> { }

    async closeWindow(): Promise<void> { }

    async loadSetting(): Promise<SettingType> {
        return { language: "en", logLevel: "info" };
    }

    async saveSetting(_setting: SettingType): Promise<void> { }

    async exportSettings(): Promise<string | null> {
        return "path/to/settings.json";
    }

    async importSettings(): Promise<SettingType | null> {
        return { language: "en", logLevel: "info" };
    }

    onLanguageUpdated(_callback: (language: string) => void): () => void {
        return () => { };
    }

    async loadWindowColor(): Promise<string> {
        return "#ffffff";
    }

    async saveWindowColor(_color: string): Promise<void> { }

    async loadWindowColorPresets(): Promise<string[]> {
        return [...DEFAULT_WINDOW_COLOR_PRESETS];
    }

    async saveWindowColorPresets(_presets: string[]): Promise<void> { }

    async saveProjectAs(_project: ProjectFile<ImageSet>): Promise<string | null> {
        return "path/to/project.iot";
    }

    async pickProjectSavePath(): Promise<string | null> {
        return "path/to/project.iot";
    }

    async materializeCacheImages(
        _projectFilePath: string,
        _cacheImagePaths: string[]
    ): Promise<Record<string, string>> {
        return {};
    }

    async saveProject(
        _filePath: string,
        _project: ProjectFile,
        _cacheImagePathsToDelete?: string[]
    ): Promise<boolean> {
        return true;
    }

    async loadProject(): Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null> {
        return null;
    }

    async loadProjectFromPath(): Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null> {
        return null;
    }

    async loadSceneFromPath(_filePath: string): Promise<LaunchIntent> {
        return {
            images: [],
        };
    }

    async loadImage(): Promise<string | null> {
        return "path/to/image.png";
    }

    async getImageInfo(
        _imagePath: string
    ): Promise<ImageInfoResult> {
        return { exists: true, width: 1, height: 1 };
    }

    async pasteImage(): Promise<string | null> {
        return null;
    }

    async saveCacheImageAs(_cacheFilePath: string): Promise<string | null> {
        return null;
    }

    getPathForFile(_file: File): string {
        return "";
    }

    async toggleImageSettingsWindow(): Promise<boolean> {
        return true;
    }

    async toggleDimensionSettingsWindow(): Promise<boolean> {
        return true;
    }

    public updateImageSetsCalls: ImageSet[][] = [];
    public updateDimensionLinesCalls: DimensionLine[][] = [];
    public updateGuidesCalls: GuideConfig[] = [];
    public updateUnitFactorCalls: number[] = [];
    public updateUnitCalls: ("nm" | "um" | "mm")[] = [];

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        this.updateImageSetsCalls.push(imageSets);
    }

    onImageSetsUpdated(_callback: (imageSets: ImageSet[]) => void): () => void {
        return () => { };
    }

    async updateDimensionLines(dimensionLines: DimensionLine[]): Promise<void> {
        this.updateDimensionLinesCalls.push(dimensionLines);
    }

    onDimensionLinesUpdated(
        _callback: (dimensionLines: DimensionLine[]) => void
    ): () => void {
        return () => { };
    }

    async updateGuides(guides: GuideConfig): Promise<void> {
        this.updateGuidesCalls.push(guides);
    }

    onGuidesUpdated(_callback: (guides: GuideConfig) => void): () => void {
        return () => { };
    }

    async updateUnitFactor(factor: number): Promise<void> {
        this.updateUnitFactorCalls.push(factor);
    }

    onUnitFactorUpdated(_callback: (factor: number) => void): () => void {
        return () => { };
    }

    async updateUnit(unit: "nm" | "um" | "mm"): Promise<void> {
        this.updateUnitCalls.push(unit);
    }

    onUnitUpdated(_callback: (unit: "nm" | "um" | "mm") => void): () => void {
        return () => { };
    }

    async updateInteractionMode(_mode: InteractionMode): Promise<void> { }

    onInteractionModeUpdated(
        _callback: (mode: InteractionMode) => void
    ): () => void {
        return () => { };
    }

    async requestInitialState(): Promise<void> { }

    onRequestStateSync(_callback: () => void): () => void {
        return () => { };
    }

    onAlwaysOnTopShortcutTriggered(_callback: () => void): () => void {
        return () => { };
    }

    onClickThroughShortcutTriggered(_callback: () => void): () => void {
        return () => { };
    }

    onFileOpen(
        _callback: (payload: { filePath: string; ext: string }) => void
    ): () => void {
        return () => { };
    }

    onLaunchIntentApply(_callback: (launchIntent: LaunchIntent) => void): () => void {
        return () => { };
    }

    onAppControlCommandApply(
        _callback: (command: AppControlCommand) => void
    ): () => void {
        return () => { };
    }

    async getLicenseInfo(): Promise<LicenseInfo[]> {
        return [];
    }

    async getAppVersion(): Promise<string> {
        return "1.0.0";
    }

    async captureScreen(): Promise<CaptureResult> {
        return {
            filePath: "path/to/capture.png",
            width: 800,
            height: 600,
        };
    }

    async captureWindow(): Promise<CaptureResult> {
        return {
            filePath: "path/to/capture_window.png",
            width: 800,
            height: 600,
        };
    }

    async saveImage(_dataUrl: string): Promise<string | null> {
        return "path/to/image.png";
    }

    async updateSelectedImageId(_id: string | null): Promise<void> { }

    onSelectedImageIdUpdated(
        _callback: (id: string | null) => void
    ): () => void {
        return () => { };
    }

    async updateSelectedDimensionLineId(_id: string | null): Promise<void> { }

    onSelectedDimensionLineIdUpdated(
        _callback: (id: string | null) => void
    ): () => void {
        return () => { };
    }

    async updateProjectDirty(_isDirty: boolean): Promise<void> { }

    reset(): void {
        this.updateImageSetsCalls = [];
        this.updateDimensionLinesCalls = [];
        this.updateGuidesCalls = [];
        this.updateUnitFactorCalls = [];
    }
}
