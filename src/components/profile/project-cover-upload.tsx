"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageCropperModal from "./image-cropper-modal";

interface ProjectCoverUploadProps {
  defaultValue?: string | null;
}

export default function ProjectCoverUpload({ defaultValue }: ProjectCoverUploadProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(defaultValue ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Temporary states for cropper modal
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [tempFileName, setTempFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Cover image must be less than 2MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG/JPG)");
      return;
    }

    setTempImageSrc(URL.createObjectURL(file));
    setTempFileName(file.name);
  };

  const uploadCover = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);

      const supabase = createClient();
      
      // Unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `cover-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("projects")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("projects")
        .getPublicUrl(filePath);

      setCoverUrl(publicUrl);
    } catch (err: unknown) {
      console.error("Error uploading cover image:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="cover_image_url" value={coverUrl || ""} />
      <span className="text-sm font-medium">Cover Image (16:9 Aspect Ratio)</span>
      
      <div className="relative group w-full aspect-video rounded-2xl border-2 border-dashed border-border/85 bg-surface-sunken overflow-hidden cursor-pointer hover:border-accent-green hover:bg-surface/50 transition-all flex flex-col items-center justify-center min-h-[160px]">
        <label
          htmlFor="cover-upload"
          className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center"
        >
          {coverUrl ? (
            <div className="relative w-full h-full overflow-hidden">
              {/* Soft blurred background layer to prevent raw side-bars */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-lg opacity-25 scale-[1.08] pointer-events-none"
              />
              {/* Centered contained front layer showing full screenshot */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt="Project cover preview"
                className="relative z-10 w-full h-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted gap-2">
              <Camera className="w-10 h-10 opacity-70 group-hover:scale-110 transition-transform group-hover:text-accent-green" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Upload Cover Image
              </span>
            </div>
          )}

          {/* Hover overlay */}
          {coverUrl && (
            <div className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Camera className="w-10 h-10 text-white" />
            </div>
          )}

          {/* Uploading loading spinner */}
          {uploading && (
            <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-30">
              <Loader2 className="w-10 h-10 animate-spin text-accent-green" />
            </div>
          )}
        </label>
        <input
          id="cover-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-muted">
          JPG or PNG. Max size 2MB.
        </span>
        {coverUrl && (
          <button
            type="button"
            onClick={() => setCoverUrl(null)}
            className="text-[11px] font-semibold text-danger hover:underline"
          >
            Remove Cover
          </button>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-danger font-semibold mt-1">
          {uploadError}
        </p>
      )}

      {tempImageSrc && (
        <ImageCropperModal
          imageSrc={tempImageSrc}
          aspectRatio="16:9"
          onCancel={() => {
            setTempImageSrc(null);
            setTempFileName("");
          }}
          onConfirm={async (croppedBlob) => {
            const fileToUpload = new File([croppedBlob], tempFileName, { type: "image/jpeg" });
            setTempImageSrc(null);
            setTempFileName("");
            await uploadCover(fileToUpload);
          }}
        />
      )}
    </div>
  );
}
