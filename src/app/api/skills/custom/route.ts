import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }

    // Case-insensitive search for existing skill
    const { data: existingSkill } = await supabase
      .from("skills")
      .select("id, name")
      .ilike("name", name)
      .maybeSingle();

    if (existingSkill) {
      return NextResponse.json({ id: existingSkill.id, name: existingSkill.name });
    }

    // Create the custom skill row
    const { data: newSkill, error } = await supabase
      .from("skills")
      .insert({
        name,
        category: "Custom",
      })
      .select("id, name")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: newSkill.id, name: newSkill.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
