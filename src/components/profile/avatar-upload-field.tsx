"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageCropperModal from "./image-cropper-modal";

interface AvatarUploadFieldProps {
  defaultValue?: string | null;
}

export default function AvatarUploadField({ defaultValue }: AvatarUploadFieldProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaultValue ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Temporary states for cropper modal
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [tempFileName, setTempFileName] = useState<string>("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG/JPG)");
      return;
    }

    setTempImageSrc(URL.createObjectURL(file));
    setTempFileName(file.name);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);

      const supabase = createClient();
      
      // Unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      console.error("Error uploading avatar:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 pb-6 border-b border-border/40 mb-6">
      <input type="hidden" name="avatar_url" value={avatarUrl || ""} />
      <span className="text-sm font-semibold text-ink">Profile Picture</span>
      <div className="relative group w-32 h-32">
        <label
          htmlFor="avatar-upload"
          className={`flex flex-col items-center justify-center w-full h-full rounded-full border-2 border-dashed border-border/80 bg-surface-sunken overflow-hidden cursor-pointer hover:border-accent-green hover:bg-surface/50 transition-all ${
            avatarUrl ? "border-solid border-border" : ""
          }`}
        >
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted gap-1">
              <Camera className="w-8 h-8 opacity-70 group-hover:scale-110 transition-transform group-hover:text-accent-green" />
              <span className="text-[10px] font-medium tracking-wide uppercase">
                Upload
              </span>
            </div>
          )}

          {/* Hover overlay */}
          {avatarUrl && (
            <div className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          )}

          {/* Uploading loading spinner */}
          {uploading && (
            <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
            </div>
          )}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <div className="text-center">
        <p className="text-[11px] text-muted">
          JPG or PNG. Max size 5MB.
        </p>
        {uploadError && (
          <p className="text-xs text-danger font-semibold mt-1">
            {uploadError}
          </p>
        )}
      </div>

      {tempImageSrc && (
        <ImageCropperModal
          imageSrc={tempImageSrc}
          onCancel={() => {
            setTempImageSrc(null);
            setTempFileName("");
          }}
          onConfirm={async (croppedBlob) => {
            const fileToUpload = new File([croppedBlob], tempFileName, { type: "image/jpeg" });
            setTempImageSrc(null);
            setTempFileName("");
            await uploadAvatar(fileToUpload);
          }}
        />
      )}
    </div>
  );
}
