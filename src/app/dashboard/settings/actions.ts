"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

export async function updateNotificationPreferences(preferences: {
  messages: boolean;
  applications: boolean;
  weekly_digest: boolean;
}) {
  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase
      .from("profiles")
      .update({
        notification_preferences: preferences,
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { success: false, error: message };
  }
}

export async function changeEmail(email: string) {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "A verification link has been sent to both your old and new email addresses to confirm the change.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { success: false, error: message };
  }
}

export async function changePassword(password: string) {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { success: false, error: message };
  }
}

export async function deleteAccountAction() {
  try {
    const { supabase, user } = await requireUser();

    // 1. Fetch user's profile and projects to identify custom avatar/cover media files
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const { data: projects } = await supabase
      .from("projects")
      .select("cover_image_url")
      .eq("owner_id", user.id);

    // 2. Delete avatar file if it exists and is hosted in Supabase Storage
    if (profile?.avatar_url) {
      const avatarUrl = profile.avatar_url;
      // Extract the filename from the public URL
      // E.g., .../storage/v1/object/public/avatars/filename.jpg
      const parts = avatarUrl.split("/public/avatars/");
      if (parts.length > 1) {
        const filename = parts[1];
        await supabase.storage.from("avatars").remove([filename]);
      }
    }

    // 3. Delete project covers if they exist
    if (projects && projects.length > 0) {
      const coverPaths: string[] = [];
      for (const project of projects) {
        if (project.cover_image_url) {
          const coverUrl = project.cover_image_url;
          // Extract the nested path within projects bucket
          // E.g., .../storage/v1/object/public/projects/projects/cover-...
          const parts = coverUrl.split("/public/projects/");
          if (parts.length > 1) {
            coverPaths.push(parts[1]);
          }
        }
      }
      if (coverPaths.length > 0) {
        await supabase.storage.from("projects").remove(coverPaths);
      }
    }

    // 4. Call the RPC to delete the auth user (cascades to all other tables)
    const { error: rpcError } = await supabase.rpc("delete_user_account");
    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    // 5. Sign out and clear session cookies
    await supabase.auth.signOut();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { success: false, error: message };
  }
}
