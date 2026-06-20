"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageCropperModal from "./image-cropper-modal";

interface ProjectImagesUploadProps {
  defaultValues?: string[] | null;
}

interface QueueItem {
  file: File;
  src: string;
}

export default function ProjectImagesUpload({ defaultValues }: ProjectImagesUploadProps) {
  const [images, setImages] = useState<string[]>(defaultValues ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Crop queue for multiple files selection
  const [cropQueue, setCropQueue] = useState<QueueItem[]>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadError(null);
    
    const currentCount = images.length;
    const remainingSlots = 2 - currentCount;
    if (remainingSlots <= 0) {
      setUploadError("You can upload at most 2 gallery images.");
      e.target.value = "";
      return;
    }

    let filesToProcess = files;
    if (files.length > remainingSlots) {
      setUploadError(`Only the first ${remainingSlots} image(s) will be processed (maximum of 2 gallery images total).`);
      filesToProcess = files.slice(0, remainingSlots);
    }

    const newItems: QueueItem[] = [];

    for (const file of filesToProcess) {
      // Size validation (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setUploadError(`Skipped "${file.name}": exceeds 2MB size limit.`);
        continue;
      }

      // Type validation
      if (!file.type.startsWith("image/")) {
        setUploadError(`Skipped "${file.name}": not an image file.`);
        continue;
      }

      newItems.push({
        file,
        src: URL.createObjectURL(file),
      });
    }

    if (newItems.length > 0) {
      setCropQueue((prev) => [...prev, ...newItems]);
    }

    // Reset input
    e.target.value = "";
  };

  const handleCropCancel = () => {
    const currentItem = cropQueue[0];
    if (currentItem) {
      URL.revokeObjectURL(currentItem.src);
    }
    setCropQueue((prev) => prev.slice(1));
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const currentItem = cropQueue[0];
    if (!currentItem) return;

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();

    try {
      const fileName = `gallery-${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
      const filePath = `projects/${fileName}`;

      // Convert cropped blob to a File object
      const croppedFile = new File(
        [croppedBlob],
        `cropped-${currentItem.file.name.split(".")[0]}.jpg`,
        { type: "image/jpeg" }
      );

      // Upload cropped file
      const { error: uploadError } = await supabase.storage
        .from("projects")
        .upload(filePath, croppedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("projects")
        .getPublicUrl(filePath);

      setImages((prev) => [...prev, publicUrl]);
    } catch (err: unknown) {
      console.error("Error uploading cropped gallery image:", err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload cropped image"
      );
    } finally {
      setUploading(false);
      URL.revokeObjectURL(currentItem.src);
      // Proceed to the next image in queue
      setCropQueue((prev) => prev.slice(1));
    }
  };

  const removeImage = (urlToRemove: string) => {
    setImages(images.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Project Gallery (Multiple Pictures)</span>
      
      {/* Hidden inputs to send array to server action */}
      {images.map((url) => (
        <input key={url} type="hidden" name="project_images" value={url} />
      ))}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {/* Upload Button Box (hidden when limit of 2 is met) */}
        {images.length < 2 && (
          <label
            htmlFor="gallery-upload"
            className="relative flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/80 bg-surface-sunken hover:border-accent-green hover:bg-surface/50 cursor-pointer transition-all gap-1.5 min-h-[90px]"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-muted" />
                <span className="text-[10px] font-semibold uppercase text-muted tracking-wider">
                  Add Pictures
                </span>
              </>
            )}
            <input
              id="gallery-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}

        {/* Uploaded image thumbnails */}
        {images.map((url, index) => (
          <div
            key={url}
            className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-surface-sunken shadow-sm"
          >
            {/* Soft blurred background layer to prevent raw side-bars */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-lg opacity-25 scale-[1.08] pointer-events-none"
            />
            {/* Centered contained front layer showing full screenshot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Project screenshot ${index + 1}`}
              className="relative z-10 w-full h-full object-contain p-1.5"
            />
            
            {/* Delete button */}
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-ink/70 text-white hover:bg-danger transition-colors opacity-0 group-hover:opacity-100 duration-150 shadow-sm z-20"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-muted">
          Upload up to 2 screenshots. Max 2MB each. Cropping modal will open for each image.
        </span>
      </div>

      {uploadError && (
        <p className="text-xs text-danger font-semibold mt-1">
          {uploadError}
        </p>
      )}

      {/* Sequential Cropping Modal for Gallery Images */}
      {cropQueue.length > 0 && (
        <ImageCropperModal
          key={cropQueue[0].src}
          imageSrc={cropQueue[0].src}
          aspectRatio="16:9"
          onCancel={handleCropCancel}
          onConfirm={handleCropComplete}
        />
      )}
    </div>
  );
}
