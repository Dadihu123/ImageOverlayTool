import type { ImageSet } from "../../../../shared/types/ImageSet";
import type { ProjectFile } from "../../../../shared/types/ProjectFile";

/**
 * プロジェクトとして保存するために必要な、アプリケーションの現在の状態の集合。
 */
export interface ProjectSnapshot {
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    windowColor: string;
    canvas: {
        x: number;
        y: number;
        scale: number;
    };
    imageSets: ImageSet[];
    dimensionLines: ProjectFile<ImageSet>["dimensionLines"];
    /** 参考物設定。未指定なら出力しない（後方互換のため任意） */
    guides?: ProjectFile<ImageSet>["guides"];
}

/**
 * プロジェクト復元時や保存時に使用されるウィンドウの表示領域に関する情報。
 */
export interface ProjectWindowState {
    width: number;
    height: number;
    x: number;
    y: number;
}

/**
 * 実際のブラウザのWindowオブジェクトから、現在のウィンドウ位置とサイズを取得する。
 */
export const getCurrentWindowState = (): ProjectWindowState => ({
    width: window.outerWidth,
    height: window.outerHeight,
    x: window.screenX,
    y: window.screenY,
});

/**
 * アプリケーションの状態とウィンドウ情報から、ファイルに保存するための
 * 最終的なProjectFile（JSON構造）を生成する。
 */
export const buildProjectFile = (
    snapshot: ProjectSnapshot,
    windowState: ProjectWindowState
): ProjectFile<ImageSet> => {
    const project: ProjectFile<ImageSet> = {
        version: "1.0.0",
        window: {
            width: windowState.width,
            height: windowState.height,
            x: windowState.x,
            y: windowState.y,
            color: snapshot.windowColor,
        },
        settings: {
            unitFactor: snapshot.unitFactor,
            unit: snapshot.unit,
        },
        canvas: snapshot.canvas,
        images: snapshot.imageSets,
        dimensionLines: snapshot.dimensionLines,
    };

    // 参考物は未設定なら書き出さない
    if (snapshot.guides) {
        project.guides = snapshot.guides;
    }

    return project;
};
