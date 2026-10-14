import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

import { Card, CardContent } from "@/renderer/components/ui/card";
import { ImageSet } from "../../../shared/types/ImageSet";
import type { ImageFileStatus } from "../../hooks/useImageFileStatus";
import { ImageItemHeader } from "./ImageItemHeader";
import { ImageListItemControls } from "./ImageListItemControls";
import { useImageListItemActions } from "../hooks/useImageListItemActions";

interface ImageListItemProps {
    imageSet: ImageSet;
    index: number;
    fileStatus?: ImageFileStatus;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * 画像リストの各アイテム
 * パス表示、透過度スライダー、削除ボタンを含む
 */
export function ImageListItem(props: ImageListItemProps) {
    const { imageSet, index, fileStatus, dragHandleProps } = props;
    const isMissing = Boolean(
        imageSet.path && fileStatus?.checked && !fileStatus.exists
    );
    const {
        isSelected,
        isCacheImage,
        imageScale,
        filters,
        fileName,
        openFile,
        deleteImageSet,
        toggleLock,
        toggleVisible,
        changeTransparency,
        changeRotation,
        changeScale,
        resetTransformation,
        changeFilters,
        saveCacheImageAs,
        relinkMissingImage,
        selectImage,
    } = useImageListItemActions({
        imageSet,
        index,
        isMissing,
    });

    return (
        <Card
            className={`mb-2 transition-colors cursor-pointer ${
                isSelected
                    ? "border-primary border-2"
                    : isMissing
                    ? "border-destructive/70 border-dashed"
                    : isCacheImage
                    ? "border-muted-foreground/30 border-dashed"
                    : "hover:border-muted-foreground/30"
            }`}
            onClick={selectImage}
            data-testid="settings.image-item.card"
        >
            <CardContent className="p-3 space-y-3">
                <ImageItemHeader
                    path={imageSet.path}
                    fileName={fileName}
                    sourceType={imageSet.sourceType}
                    isMissing={isMissing}
                    isLocked={imageSet.locked}
                    isVisible={imageSet.visible}
                    onFileOpen={openFile}
                    onToggleLock={toggleLock}
                    onToggleVisible={toggleVisible}
                    onDelete={deleteImageSet}
                    dragHandleProps={dragHandleProps}
                />

                <ImageListItemControls
                    imageSet={imageSet}
                    isMissing={isMissing}
                    isCacheImage={isCacheImage}
                    imageScale={imageScale}
                    filters={filters}
                    onRelinkMissingImage={() => void relinkMissingImage()}
                    onChangeTransparency={changeTransparency}
                    onChangeScale={changeScale}
                    onChangeRotation={changeRotation}
                    onResetTransformation={resetTransformation}
                    onChangeFilters={changeFilters}
                    onSaveCacheImageAs={() => void saveCacheImageAs()}
                />
            </CardContent>
        </Card>
    );
}
