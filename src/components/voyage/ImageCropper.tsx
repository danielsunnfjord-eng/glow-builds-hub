import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useTranslation } from "react-i18next";

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedUrl: string) => void;
  onCancel: () => void;
}

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop
): string {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

const ImageCropper = ({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  }, []);

  const handleApply = () => {
    if (!imgRef.current || !completedCrop) return;
    const dataUrl = getCroppedCanvas(imgRef.current, completedCrop);
    onCropComplete(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-ink/70 flex items-center justify-center p-4">
      <div className="bg-voyage-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-parchment-3 flex items-center justify-between">
          <h3 className="text-sm font-serif font-semibold text-ink">
            ✂️ {t("aa.cropImage", "Crop Image")}
          </h3>
          <button
            onClick={onCancel}
            className="text-voyage-muted hover:text-ink text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-parchment/40">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              src={imageUrl}
              onLoad={onImageLoad}
              alt="Crop"
              className="max-h-[65vh] max-w-full"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="px-4 py-3 border-t border-parchment-3 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded-sm border border-parchment-3 text-voyage-muted hover:text-ink transition-colors"
          >
            {t("aa.cancel", "Cancel")}
          </button>
          <button
            onClick={handleApply}
            disabled={!completedCrop}
            className="px-4 py-1.5 text-sm rounded-sm bg-gold text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {t("aa.applyCrop", "Apply Crop")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
