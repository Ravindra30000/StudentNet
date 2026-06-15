"use client";

import { useState } from "react";
import type { Skill } from "@/lib/types";
import { ChevronDown, Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageCropperModal from "@/components/profile/image-cropper-modal";

interface OnboardingFormProps {
  skillsByCategory: Record<string, Skill[]>;
  action: (formData: FormData) => Promise<void>;
  error?: string;
  years: number[];
}

export default function OnboardingForm({
  skillsByCategory,
  action,
  error,
  years,
}: OnboardingFormProps) {
  const [role, setRole] = useState("student");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [isProfessional, setIsProfessional] = useState(false);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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

  const toggleSkill = (skillId: number) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const addCustomSkill = () => {
    const trimmed = newSkillText.trim();
    if (trimmed && !customSkills.includes(trimmed)) {
      setCustomSkills((prev) => [...prev, trimmed]);
      setNewSkillText("");
    }
  };

  return (
    <form action={action} className="mt-12 flex flex-col gap-10">
      {/* Hidden Fields for state */}
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="avatar_url" value={avatarUrl || ""} />
      {selectedSkills.map((id) => (
        <input key={id} type="hidden" name="skills" value={id} />
      ))}
      {customSkills.map((name) => (
        <input key={name} type="hidden" name="custom_skills" value={name} />
      ))}

      {/* Main Form Card */}
      <div className="bg-surface rounded-[28px] p-6 md:p-10 shadow-card border border-border/40 flex flex-col gap-8">
        
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center gap-4 pb-6 border-b border-border/40">
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
        </div>
        
        {/* Section 1: Identity */}
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="full_name"
                className="text-sm font-semibold text-ink ml-1"
              >
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                required
                placeholder="Jane Doe"
                type="text"
                className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="text-sm font-semibold text-ink ml-1"
              >
                Username
              </label>
              <label
                htmlFor="username"
                className="relative flex items-center bg-surface-sunken border border-border/80 rounded-[16px] focus-within:ring-1 focus-within:ring-accent-green focus-within:border-accent-green transition-all overflow-hidden cursor-text"
              >
                <span className="pl-4 text-muted text-sm select-none pr-1">
                  studentnet.com/u/
                </span>
                <input
                  id="username"
                  name="username"
                  required
                  placeholder="janedoe"
                  type="text"
                  className="bg-transparent border-none py-3 px-1 text-sm text-ink focus:ring-0 w-full outline-none"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-ink ml-1">
              I am a...
            </span>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "student", label: "Student / Freelancer" },
                { value: "founder", label: "Startup Founder" },
                { value: "community_leader", label: "Community Leader" },
                { value: "client", label: "Client" },
              ].map((opt) => {
                const isSelected = role === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97] border ${
                      isSelected
                        ? "bg-ink border-ink text-white"
                        : "bg-surface border-border text-ink hover:bg-surface-sunken"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* Section 2: Affiliation / Status Switcher */}
        <section className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-ink ml-1">
            Status
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsProfessional(false)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                !isProfessional
                  ? "bg-ink border-ink text-white"
                  : "bg-surface border-border text-ink hover:bg-surface-sunken"
              }`}
            >
              I am a Student
            </button>
            <button
              type="button"
              onClick={() => setIsProfessional(true)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                isProfessional
                  ? "bg-ink border-ink text-white"
                  : "bg-surface border-border text-ink hover:bg-surface-sunken"
              }`}
            >
              I am a Working Professional
            </button>
          </div>
        </section>

        {!isProfessional ? (
          /* Student inputs */
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="college"
                className="text-sm font-semibold text-ink ml-1"
              >
                College
              </label>
              <input
                id="college"
                name="college"
                placeholder="IIT Bombay"
                type="text"
                className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="branch"
                className="text-sm font-semibold text-ink ml-1"
              >
                Branch
              </label>
              <input
                id="branch"
                name="branch"
                placeholder="Computer Science"
                type="text"
                className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="graduation_year"
                className="text-sm font-semibold text-ink ml-1"
              >
                Graduation year
              </label>
              <div className="relative">
                <select
                  id="graduation_year"
                  name="graduation_year"
                  defaultValue=""
                  className="appearance-none w-full bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all cursor-pointer pr-10"
                >
                  <option value="">Select year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted" />
              </div>
            </div>
          </section>
        ) : (
          /* Working Professional inputs */
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="company"
                className="text-sm font-semibold text-ink ml-1"
              >
                Company name
              </label>
              <input
                id="company"
                name="company"
                placeholder="e.g. Google, Razorpay, or Freelance"
                type="text"
                className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="profession"
                className="text-sm font-semibold text-ink ml-1"
              >
                Profession / Job Title
              </label>
              <input
                id="profession"
                name="profession"
                placeholder="e.g. Senior Software Engineer, UI Designer"
                type="text"
                className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
              />
            </div>
          </section>
        )}

        <hr className="border-border/60" />

        {/* Section 3: About */}
        <section className="flex flex-col gap-2">
          <label
            htmlFor="bio"
            className="text-sm font-semibold text-ink ml-1"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            placeholder="A short intro — what you build, what you're into."
            className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all resize-y"
          />
        </section>

        <hr className="border-border/60" />

        {/* Section 4: Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="github_url"
              className="text-sm font-semibold text-ink ml-1"
            >
              GitHub
            </label>
            <input
              id="github_url"
              name="github_url"
              placeholder="https://github.com/..."
              type="url"
              className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="linkedin_url"
              className="text-sm font-semibold text-ink ml-1"
            >
              LinkedIn
            </label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              placeholder="https://linkedin.com/in/..."
              type="url"
              className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="portfolio_url"
              className="text-sm font-semibold text-ink ml-1"
            >
              Portfolio
            </label>
            <input
              id="portfolio_url"
              name="portfolio_url"
              placeholder="https://..."
              type="url"
              className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
            />
          </div>
        </section>

        <hr className="border-border/60" />

        {/* Section 5: Skills */}
        <section className="flex flex-col gap-6">
          {Object.entries(skillsByCategory).map(([category, items]) => (
            <div key={category} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-muted tracking-wider uppercase ml-1">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors select-none border border-transparent ${
                        isSelected
                          ? "bg-ink text-white"
                          : "bg-surface-sunken hover:bg-border/60 text-ink"
                      }`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Skills Tag Input */}
          <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border/40">
            <label
              htmlFor="custom_skill_input"
              className="text-sm font-semibold text-ink ml-1"
            >
              Can&apos;t find your skills? Add custom skills
            </label>
            <div className="flex gap-2 max-w-md">
              <input
                id="custom_skill_input"
                type="text"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                placeholder="e.g. Next.js, Web3, Copywriting"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                className="bg-surface-sunken border border-border/80 rounded-[16px] px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all flex-1"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="bg-ink hover:bg-accent-green text-white px-5 py-2.5 rounded-[16px] text-xs font-semibold transition-colors active:scale-[0.97] cursor-pointer"
              >
                Add
              </button>
            </div>

            {customSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customSkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent-green/10 border border-accent-green/20 text-accent-green"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setCustomSkills((prev) => prev.filter((s) => s !== skill))}
                      className="text-accent-green hover:text-danger hover:scale-110 font-bold transition-all text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-danger/10 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-[12px] p-3 max-w-[680px] w-full mx-auto">
          <p className="text-xs text-danger font-medium text-center">{error}</p>
        </div>
      )}

      {/* Bottom Action */}
      <div className="flex justify-start">
        <button
          type="submit"
          className="bg-ink text-white px-8 py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.97] shadow-card cursor-pointer"
        >
          Create profile
        </button>
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
    </form>
  );
}
