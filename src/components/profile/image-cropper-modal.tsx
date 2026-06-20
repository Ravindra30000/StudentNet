"use client";

import React, { useState, useRef } from "react";

interface ImageCropperModalProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: "1:1" | "16:9";
}

export default function ImageCropperModal({
  imageSrc,
  onConfirm,
  onCancel,
  aspectRatio = "1:1",
}: ImageCropperModalProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const [prevImageSrc, setPrevImageSrc] = useState(imageSrc);
  if (imageSrc !== prevImageSrc) {
    setPrevImageSrc(imageSrc);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDimensions(null);
  }

  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  
  const isSquare = aspectRatio === "1:1";
  const cropWidth = isSquare ? 256 : 320;
  const cropHeight = isSquare ? 256 : 180;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setDimensions({ width: naturalWidth, height: naturalHeight });
  };

  const getDisplayDimensions = (naturalWidth: number, naturalHeight: number) => {
    const imageAspect = naturalWidth / naturalHeight;
    const cropAspect = cropWidth / cropHeight;

    let displayWidth = cropWidth;
    let displayHeight = cropHeight;

    if (imageAspect > cropAspect) {
      displayWidth = cropHeight * imageAspect;
      displayHeight = cropHeight;
    } else {
      displayWidth = cropWidth;
      displayHeight = cropWidth / imageAspect;
    }

    return { displayWidth, displayHeight };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dimensions) return;
    
    const { width: naturalWidth, height: naturalHeight } = dimensions;
    const { displayWidth, displayHeight } = getDisplayDimensions(naturalWidth, naturalHeight);

    const renderedWidth = displayWidth * scale;
    const renderedHeight = displayHeight * scale;

    const maxOffsetX = Math.max(0, (renderedWidth - cropWidth) / 2);
    const maxOffsetY = Math.max(0, (renderedHeight - cropHeight) / 2);

    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;

    newX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    newY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dimensions) return;
    
    const touch = e.touches[0];
    const { width: naturalWidth, height: naturalHeight } = dimensions;
    const { displayWidth, displayHeight } = getDisplayDimensions(naturalWidth, naturalHeight);

    const renderedWidth = displayWidth * scale;
    const renderedHeight = displayHeight * scale;

    const maxOffsetX = Math.max(0, (renderedWidth - cropWidth) / 2);
    const maxOffsetY = Math.max(0, (renderedHeight - cropHeight) / 2);

    let newX = touch.clientX - dragStart.current.x;
    let newY = touch.clientY - dragStart.current.y;

    newX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    newY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

    setOffset({ x: newX, y: newY });
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img || !dimensions) return;

    const { width: naturalWidth, height: naturalHeight } = dimensions;
    const { displayWidth, displayHeight } = getDisplayDimensions(naturalWidth, naturalHeight);

    const renderedWidth = displayWidth * scale;
    const renderedHeight = displayHeight * scale;

    const left = (cropWidth - renderedWidth) / 2 + offset.x;
    const top = (cropHeight - renderedHeight) / 2 + offset.y;

    const sX = -left * (naturalWidth / renderedWidth);
    const sY = -top * (naturalHeight / renderedHeight);
    const sWidth = cropWidth * (naturalWidth / renderedWidth);
    const sHeight = cropHeight * (naturalHeight / renderedHeight);

    const canvas = document.createElement("canvas");
    canvas.width = isSquare ? 400 : 800;
    canvas.height = isSquare ? 400 : 450;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        sX,
        sY,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onConfirm(blob);
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleUseOriginal = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      onConfirm(blob);
    } catch (err) {
      console.error("Failed to load original image blob:", err);
      onCancel();
    }
  };

  const getImgStyle = () => {
    if (!dimensions) {
      return {
        width: "auto",
        height: "auto",
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        left: "0px",
        top: "0px",
        cursor: isDragging ? "grabbing" : "grab",
      };
    }

    const { displayWidth, displayHeight } = getDisplayDimensions(dimensions.width, dimensions.height);

    return {
      width: dimensions.width > dimensions.height ? "auto" : `${cropWidth}px`,
      height: dimensions.width > dimensions.height ? `${cropHeight}px` : "auto",
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
      left: `${(cropWidth - displayWidth) / 2}px`,
      top: `${(cropHeight - displayHeight) / 2}px`,
      cursor: isDragging ? "grabbing" : "grab",
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border/80 w-full max-w-md rounded-[28px] p-6 shadow-2xl flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-lg font-bold text-ink">
            {isSquare ? "Crop Profile Picture" : "Crop Cover Image"}
          </h3>
          <p className="text-xs text-muted mt-1">Drag to position, use slider to zoom</p>
        </div>

        {/* Crop area */}
        <div className="flex justify-center">
          <div 
            className={`relative overflow-hidden bg-surface-sunken shadow-inner`}
            style={{
              width: `${cropWidth}px`,
              height: `${cropHeight}px`,
              borderRadius: isSquare ? "9999px" : "16px",
              borderWidth: "4px",
              borderStyle: "solid",
              borderColor: "var(--accent-green)",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop area"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute max-w-none select-none origin-center"
              style={getImgStyle()}
            />
          </div>
        </div>

        {/* Zoom Control */}
        <div className="flex flex-col gap-2 px-4">
          <div className="flex justify-between text-xs font-semibold text-ink">
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => {
              const newScale = parseFloat(e.target.value);
              setScale(newScale);
              
              if (dimensions) {
                const { displayWidth, displayHeight } = getDisplayDimensions(dimensions.width, dimensions.height);
                const renderedWidth = displayWidth * newScale;
                const renderedHeight = displayHeight * newScale;
                const maxOffsetX = Math.max(0, (renderedWidth - cropWidth) / 2);
                const maxOffsetY = Math.max(0, (renderedHeight - cropHeight) / 2);
                
                setOffset(prev => ({
                  x: Math.max(-maxOffsetX, Math.min(maxOffsetX, prev.x)),
                  y: Math.max(-maxOffsetY, Math.min(maxOffsetY, prev.y))
                }));
              }
            }}
            className="w-full accent-accent-green cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button
            type="button"
            onClick={handleCrop}
            className="w-full py-3 px-4 rounded-[16px] bg-accent-green hover:bg-accent-green/90 text-sm font-semibold text-white transition-all shadow-md cursor-pointer"
          >
            Apply Crop
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-[16px] border border-border text-xs font-semibold text-ink hover:bg-surface-sunken transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUseOriginal}
              className="flex-1 py-2.5 px-4 rounded-[16px] border border-border text-xs font-semibold text-ink hover:bg-surface-sunken transition-all cursor-pointer text-center"
            >
              Use Original (No Crop)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
