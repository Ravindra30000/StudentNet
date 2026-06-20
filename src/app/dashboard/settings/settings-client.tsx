"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Bell,
  Shield,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  changeEmail,
  changePassword,
  updateNotificationPreferences,
  deleteAccountAction,
} from "./actions";

interface SettingsClientProps {
  initialEmail: string;
  initialPreferences: {
    messages: boolean;
    applications: boolean;
    weekly_digest: boolean;
  };
}

export default function SettingsClient({
  initialEmail,
  initialPreferences,
}: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "account" | "notifications" | "privacy" | "danger"
  >("account");

  // Email form states
  const [email, setEmail] = useState(initialEmail);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Password form states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Notification states
  const [preferences, setPreferences] = useState(initialPreferences);
  const [prefLoading, startPrefTransition] = useTransition();
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Danger zone / deletion states
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Tab configurations
  const tabs = [
    { id: "account", label: "Account", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "danger", label: "Danger zone", icon: Trash2 },
  ] as const;

  // Handle email change submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || email === initialEmail) return;

    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    const res = await changeEmail(email.trim());
    setEmailLoading(false);

    if (res.success) {
      setEmailSuccess(res.message || "Email change requested.");
      setShowEmailForm(false);
    } else {
      setEmailError(res.error || "Failed to update email.");
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const res = await changePassword(password);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess("Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } else {
      setPasswordError(res.error || "Failed to update password.");
    }
  };

  // Handle notification toggle changes
  const handleToggle = (key: keyof typeof preferences) => {
    const updatedPrefs = {
      ...preferences,
      [key]: !preferences[key],
    };

    // Optimistically update local state
    setPreferences(updatedPrefs);
    setPrefError(null);
    setPrefSuccess(false);

    startPrefTransition(async () => {
      const res = await updateNotificationPreferences(updatedPrefs);
      if (!res.success) {
        // Rollback on error
        setPreferences(preferences);
        setPrefError(res.error || "Failed to save preferences.");
      } else {
        setPrefSuccess(true);
        setTimeout(() => setPrefSuccess(false), 2000);
      }
    });
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const res = await deleteAccountAction();
    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setDeleting(false);
      setDeleteError(res.error || "Failed to delete account.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
      {/* Left Navigation Tabs */}
      <aside className="w-full md:w-[220px] flex-shrink-0">
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 border-b md:border-b-0 border-border/40 pb-4 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === "danger";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none cursor-pointer ${
                  isActive
                    ? isDanger
                      ? "bg-danger/10 text-danger"
                      : "bg-ink text-white"
                    : isDanger
                    ? "text-muted hover:text-danger hover:bg-danger/5"
                    : "text-muted hover:text-[#163832] hover:bg-[#163832]/10"
                }`}
              >
                {/* Active Indicator Line for desktop */}
                {isActive && !isDanger && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-green rounded-r-full hidden md:block" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? "" : "opacity-75"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right Content Area inside Card */}
      <div className="flex-1 w-full bg-surface rounded-[28px] p-6 md:p-10 shadow-card border border-border/40 min-h-[460px]">
        {/* Tab content renderer */}
        {activeTab === "account" && (
          <div className="flex flex-col gap-8">
            <h2 className="text-xl font-bold font-heading text-ink">
              Account Settings
            </h2>

            {/* Email Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Email</h3>
                  <p className="text-sm text-muted mt-1">{initialEmail}</p>
                </div>
                {!showEmailForm && (
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(true)}
                    className="px-5 py-2.5 rounded-full border border-border text-xs font-semibold text-ink hover:bg-surface-sunken transition-all cursor-pointer"
                  >
                    Change email
                  </button>
                )}
              </div>

              {showEmailForm && (
                <form
                  onSubmit={handleEmailSubmit}
                  className="bg-surface-sunken rounded-2xl p-5 border border-border/60 max-w-md flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="new-email"
                      className="text-xs font-semibold text-ink"
                    >
                      New Email Address
                    </label>
                    <input
                      id="new-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter new email"
                      className="bg-surface border border-border rounded-[16px] px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent-green"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="bg-ink hover:opacity-90 text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {emailLoading && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailForm(false);
                        setEmail(initialEmail);
                        setEmailError(null);
                      }}
                      className="px-5 py-2.5 rounded-full border border-border text-xs font-semibold text-ink hover:bg-surface/50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {emailError && (
                <div className="flex items-center gap-2 bg-danger/10 text-danger border border-danger/25 text-xs rounded-xl p-3.5 max-w-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              {emailSuccess && (
                <div className="flex items-center gap-2 bg-success/15 text-success border border-success/25 text-xs rounded-xl p-3.5 max-w-md">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{emailSuccess}</span>
                </div>
              )}
            </div>

            <hr className="border-border/60" />

            {/* Password Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Password</h3>
                  <p className="text-sm text-muted mt-1">
                    Update your password to keep your account secure.
                  </p>
                </div>
                {!showPasswordForm && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="px-5 py-2.5 rounded-full border border-border text-xs font-semibold text-ink hover:bg-surface-sunken transition-all cursor-pointer"
                  >
                    Change password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="bg-surface-sunken rounded-2xl p-5 border border-border/60 max-w-md flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2 relative">
                    <label
                      htmlFor="new-password"
                      className="text-xs font-semibold text-ink"
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="bg-surface border border-border rounded-[16px] px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent-green pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-[34px] text-muted hover:text-ink cursor-pointer"
                    >
                      {showPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="confirm-password"
                      className="text-xs font-semibold text-ink"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type={showPass ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="bg-surface border border-border rounded-[16px] px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent-green"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-ink hover:opacity-90 text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPassword("");
                        setConfirmPassword("");
                        setPasswordError(null);
                      }}
                      className="px-5 py-2.5 rounded-full border border-border text-xs font-semibold text-ink hover:bg-surface/50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {passwordError && (
                <div className="flex items-center gap-2 bg-danger/10 text-danger border border-danger/25 text-xs rounded-xl p-3.5 max-w-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 bg-success/15 text-success border border-success/25 text-xs rounded-xl p-3.5 max-w-md">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl font-bold font-heading text-ink">
                Notification Preferences
              </h2>
              {prefSuccess && (
                <span className="text-xs text-success font-semibold flex items-center gap-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            {prefError && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger border border-danger/25 text-xs rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4" />
                <span>{prefError}</span>
              </div>
            )}

            <div className="flex flex-col gap-6">
              {/* Message notification toggle */}
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    Email me about new messages
                  </span>
                  <span className="text-xs text-muted">
                    Get instantly notified when you receive a message from a student or client.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={prefLoading}
                  onClick={() => handleToggle("messages")}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
                    preferences.messages ? "bg-ink" : "bg-[#F5F5F3] border border-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
                      preferences.messages
                        ? "right-1 bg-white"
                        : "left-1 bg-muted/60"
                    }`}
                  />
                </button>
              </div>

              {/* Application notification toggle */}
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    Email me about new applications
                  </span>
                  <span className="text-xs text-muted">
                    Receive updates on freelance proposals and startup co-founder requests.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={prefLoading}
                  onClick={() => handleToggle("applications")}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
                    preferences.applications ? "bg-ink" : "bg-[#F5F5F3] border border-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
                      preferences.applications
                        ? "right-1 bg-white"
                        : "left-1 bg-muted/60"
                    }`}
                  />
                </button>
              </div>

              {/* Digest notification toggle */}
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    Weekly digest email
                  </span>
                  <span className="text-xs text-muted">
                    A summary of network updates, popular communities, and trending events.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={prefLoading}
                  onClick={() => handleToggle("weekly_digest")}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
                    preferences.weekly_digest ? "bg-ink" : "bg-[#F5F5F3] border border-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${
                      preferences.weekly_digest
                        ? "right-1 bg-white"
                        : "left-1 bg-muted/60"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="flex flex-col gap-8">
            <h2 className="text-xl font-bold font-heading text-ink">
              Privacy & Visibility
            </h2>

            <div className="bg-surface-sunken border border-border/60 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-accent-green flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-ink">
                    StudentNet Directory Search
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    By default, your completed profile is visible inside the
                    discover talent directory. Authenticated students, startup
                    founders, and clients can find you based on college, branch,
                    and listed skills.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-border/40 pt-4">
                <AlertCircle className="w-6 h-6 text-accent-green flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-ink">
                    Row-Level Security Enforcement
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    We secure your messages, private portfolio descriptions, and application materials using cryptographic Postgres policy controls. Your conversations can only be read by you and the recipients.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "danger" && (
          <div className="flex flex-col gap-8">
            <h2 className="text-xl font-bold font-heading text-ink">
              Danger Zone
            </h2>

            {/* Red border warning card */}
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-5 md:p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-danger">Delete Account</h3>
              <p className="text-sm text-danger/80 leading-relaxed">
                Once you delete your account, there is no turning back. All your
                profile information, verified achievements, messaging history, and project uploads will be permanently wiped out.
              </p>

              {deleteError && (
                <div className="flex items-center gap-2 bg-danger/10 text-danger text-xs rounded-xl p-3 border border-danger/25">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 max-w-sm mt-2">
                <label
                  htmlFor="confirm-delete-input"
                  className="text-xs font-semibold text-danger/90"
                >
                  Type <span className="font-bold underline">DELETE</span> to confirm
                </label>
                <input
                  id="confirm-delete-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="bg-white border border-danger/20 rounded-[16px] px-4 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-danger"
                />

                <button
                  type="button"
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  onClick={handleDeleteAccount}
                  className="mt-2 bg-danger hover:bg-danger/90 text-white px-5 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete my account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
