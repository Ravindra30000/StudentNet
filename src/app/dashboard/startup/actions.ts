"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification, notifyAllUsers } from "@/lib/notifications";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createStartup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const stage = String(formData.get("stage") ?? "Idea").trim();
  const idea = String(formData.get("idea") ?? "").trim();

  if (!name || !industry || !idea) {
    redirect("/dashboard/startup?error=Name, industry, and description/idea are required");
  }

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.floor(1000 + Math.random() * 9000);

  const { error } = await supabase.from("startups").insert({
    founder_id: user.id,
    name,
    slug,
    industry,
    stage,
    idea,
  });

  if (error) {
    redirect(`/dashboard/startup?error=${encodeURIComponent(error.message)}`);
  }

  // Notify all users about the new startup launch (excluding founder)
  try {
    await notifyAllUsers(
      supabase,
      "startup",
      {
        title: "New Startup Launched!",
        message: `${name} has just launched in the ${industry} space! Check out their idea.`,
        link: `/startups/${slug}`,
      },
      user.id
    );
  } catch (notifErr) {
    console.error("Error creating startup launch notification:", notifErr);
  }

  revalidatePath("/dashboard/startup");
  revalidatePath("/startups");
  redirect("/dashboard/startup");
}

export async function updateStartup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const stage = String(formData.get("stage") ?? "Idea").trim();
  const idea = String(formData.get("idea") ?? "").trim();

  if (!id || !name || !industry || !idea) {
    redirect("/dashboard/startup?error=Missing required fields");
  }

  const { error } = await supabase
    .from("startups")
    .update({ name, industry, stage, idea })
    .eq("id", id)
    .eq("founder_id", user.id); // ownership enforced

  if (error) {
    redirect(`/dashboard/startup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/startup");
  revalidatePath("/startups");
  redirect("/dashboard/startup");
}

// ✅ SECURITY FIX: verify caller owns the startup before adding a role
export async function addStartupRole(formData: FormData) {
  const { supabase, user } = await requireUser();
  const startup_id = String(formData.get("startup_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const commitment = String(formData.get("commitment") ?? "Part-time").trim();
  const equity_offered = String(formData.get("equity_offered") ?? "").trim() || null;
  const skills_required_str = String(formData.get("skills_required") ?? "").trim();

  if (!startup_id || !title) {
    redirect("/dashboard/startup?error=Startup ID and Role Title are required");
  }

  const skills_required = skills_required_str
    ? skills_required_str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // ✅ Verify the authenticated user owns this startup
  const { data: startup, error: ownerError } = await supabase
    .from("startups")
    .select("founder_id")
    .eq("id", startup_id)
    .single();

  if (ownerError || !startup || startup.founder_id !== user.id) {
    redirect("/dashboard/startup?error=Unauthorized: You do not own this startup");
  }

  const { error } = await supabase.from("startup_roles").insert({
    startup_id,
    title,
    commitment,
    equity_offered,
    skills_required,
  });

  if (error) {
    redirect(`/dashboard/startup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/startup");
  revalidatePath("/startups");
  redirect("/dashboard/startup");
}

// ✅ SECURITY FIX: verify caller owns the parent startup before deleting a role
export async function deleteStartupRole(roleId: string) {
  const { supabase, user } = await requireUser();

  // Fetch the role and join to the startup to verify ownership
  const { data: role, error: fetchError } = await supabase
    .from("startup_roles")
    .select("startup_id, startups(founder_id)")
    .eq("id", roleId)
    .single();

  if (fetchError || !role) throw new Error("Role not found");

  const startup = Array.isArray(role.startups) ? role.startups[0] : role.startups;
  if (!startup || (startup as { founder_id: string }).founder_id !== user.id) {
    throw new Error("Unauthorized: You do not own this startup");
  }

  const { error } = await supabase.from("startup_roles").delete().eq("id", roleId);

  if (error) throw new Error("Failed to delete role: " + error.message);

  revalidatePath("/dashboard/startup");
  revalidatePath("/startups");
}

export async function applyToRole(formData: FormData) {
  const { supabase, user } = await requireUser();
  const role_id = String(formData.get("role_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const redirect_slug = String(formData.get("redirect_slug") ?? "");

  if (!role_id || !message) {
    redirect(`/startups/${redirect_slug}?error=Message and Role are required`);
  }

  const { error } = await supabase.from("startup_applications").insert({
    role_id,
    applicant_id: user.id,
    message,
    status: "pending",
  });

  if (error) {
    redirect(`/startups/${redirect_slug}?error=${encodeURIComponent(error.message)}`);
  }

  // Notify startup founder about new role application
  try {
    const { data: roleData } = await supabase
      .from("startup_roles")
      .select("title, startups(name, founder_id)")
      .eq("id", role_id)
      .maybeSingle();

    if (roleData) {
      const roleRaw = roleData as unknown as {
        title: string;
        startups: { name: string; founder_id: string } | { name: string; founder_id: string }[] | null;
      };
      const startupRaw = Array.isArray(roleRaw.startups) ? roleRaw.startups[0] : roleRaw.startups;
      const founderId = startupRaw?.founder_id;
      const startupName = startupRaw?.name || "their startup";
      const roleTitle = roleRaw.title;

      // Get applicant full name
      const { data: applicantProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const applicantName = applicantProfile?.full_name || "A student";

      if (founderId) {
        await createNotification(
          supabase,
          founderId,
          "application",
          {
            title: "New Role Application",
            message: `${applicantName} has applied for the '${roleTitle}' role at '${startupName}'.`,
            link: "/dashboard/startup",
          }
        );
      }
    }
  } catch (notifErr) {
    console.error("Error creating role application notification:", notifErr);
  }

  revalidatePath(`/startups/${redirect_slug}`);
  redirect(`/startups/${redirect_slug}?success=true`);
}

// ✅ SECURITY FIX: verify caller is the founder of the startup before updating application status
export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected"
) {
  const { supabase, user } = await requireUser();

  // Join through to verify the caller owns the startup this application is for
  const { data: application, error: fetchError } = await supabase
    .from("startup_applications")
    .select("id, applicant_id, startup_roles(title, startup_id, startups(name, founder_id))")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) throw new Error("Application not found");

  const roleRaw = Array.isArray(application.startup_roles)
    ? application.startup_roles[0]
    : application.startup_roles;
  const startupRaw =
    roleRaw &&
    (Array.isArray(roleRaw.startups) ? roleRaw.startups[0] : roleRaw.startups);

  if (!startupRaw || (startupRaw as { founder_id: string }).founder_id !== user.id) {
    throw new Error("Unauthorized: You do not own this startup");
  }

  const { error } = await supabase
    .from("startup_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) throw new Error("Failed to update application status: " + error.message);

  // Notify the applicant of the status change
  try {
    const roleRaw = Array.isArray(application.startup_roles)
      ? application.startup_roles[0]
      : application.startup_roles;
    const startupRaw =
      roleRaw &&
      (Array.isArray(roleRaw.startups) ? roleRaw.startups[0] : roleRaw.startups);
    
    const roleTitle = roleRaw?.title || "Role";
    const startupName = startupRaw?.name || "Startup";

    await createNotification(
      supabase,
      application.applicant_id,
      "application",
      {
        title: `Application ${status === "accepted" ? "Accepted" : "Rejected"}`,
        message: `Your application to '${roleTitle}' at '${startupName}' has been ${status}.`,
        link: "/dashboard/startup",
      }
    );
  } catch (notifErr) {
    console.error("Error creating application status update notification:", notifErr);
  }

  revalidatePath("/dashboard/startup");
}

export async function deleteStartup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const startupId = String(formData.get("startup_id") ?? "");

  if (!startupId) redirect("/dashboard/startup?error=Invalid startup ID");

  // Verify ownership and get startup name
  const { data: startup, error: fetchError } = await supabase
    .from("startups")
    .select("id, name, slug, founder_id")
    .eq("id", startupId)
    .maybeSingle();

  if (fetchError || !startup) redirect("/dashboard/startup?error=Startup not found");
  if (startup.founder_id !== user.id) redirect("/dashboard/startup?error=Unauthorized");

  // Notify all applicants (pending + accepted) before deletion
  try {
    const { data: roles } = await supabase
      .from("startup_roles")
      .select("id")
      .eq("startup_id", startupId);

    if (roles && roles.length > 0) {
      const roleIds = roles.map((r) => r.id);
      const { data: applications } = await supabase
        .from("startup_applications")
        .select("applicant_id, status, startup_roles(title)")
        .in("role_id", roleIds)
        .in("status", ["pending", "accepted"]);

      if (applications && applications.length > 0) {
        const notifications = applications.map((app) => {
          const roleRaw = Array.isArray(app.startup_roles)
            ? app.startup_roles[0]
            : app.startup_roles;
          const roleTitle = (roleRaw as { title: string } | null)?.title ?? "a role";
          const isAccepted = app.status === "accepted";
          return {
            profile_id: app.applicant_id,
            type: "application",
            payload: {
              title: "Startup Dissolved",
              message: isAccepted
                ? `"${startup.name}" — where you were accepted for "${roleTitle}" — has been dissolved by the founder.`
                : `"${startup.name}" — where you had a pending application for "${roleTitle}" — has been dissolved.`,
            },
          };
        });
        await supabase.from("notifications").insert(notifications);
      }
    }
  } catch (notifErr) {
    console.error("Error sending startup deletion notifications:", notifErr);
  }

  // Delete startup (cascade: startup_roles → startup_applications)
  const { error: deleteError } = await supabase
    .from("startups")
    .delete()
    .eq("id", startupId)
    .eq("founder_id", user.id);

  if (deleteError) {
    redirect(`/dashboard/startup?error=${encodeURIComponent(deleteError.message)}`);
  }

  revalidatePath("/dashboard/startup");
  revalidatePath("/startups");
  redirect("/dashboard/startup");
}
