import { NextResponse } from "next/server";
import { createDraftProfile, getProfileBySchoolEmail, listProfilesForSchool, updateDraftFields } from "@/lib/profiles";
import { isSchoolEmail } from "@/lib/schoolEmail";
import type { Favorites, ProfileCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const school = searchParams.get("school");
    if (!school) {
      return NextResponse.json({ error: "school query param is required" }, { status: 400 });
    }
    const profiles = await listProfilesForSchool(school);
    return NextResponse.json({ profiles });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const school = String(body.school ?? "").trim();
    const category = String(body.category ?? "teacher") as ProfileCategory;
    const gradeOrRole = Array.isArray(body.gradeOrRole)
      ? body.gradeOrRole.map(String).filter((g: string) => g.trim())
      : [String(body.gradeOrRole ?? "")].filter((g: string) => g.trim());
    const schoolEmail = String(body.schoolEmail ?? "").trim().toLowerCase();
    const birthday = String(body.birthday ?? "");
    const favorites: Favorites = {
      color: String(body.favorites?.color ?? ""),
      treat: String(body.favorites?.treat ?? ""),
      drink: String(body.favorites?.drink ?? ""),
      scent: String(body.favorites?.scent ?? ""),
      hobbies: Array.isArray(body.favorites?.hobbies) ? body.favorites.hobbies.map(String) : [],
      store: String(body.favorites?.store ?? ""),
      restaurant: String(body.favorites?.restaurant ?? ""),
      flower: String(body.favorites?.flower ?? ""),
      sportsTeam: String(body.favorites?.sportsTeam ?? ""),
      shirtSize: String(body.favorites?.shirtSize ?? ""),
      avoid: String(body.favorites?.avoid ?? ""),
      wishlist: String(body.favorites?.wishlist ?? ""),
    };

    if (!name || !school || gradeOrRole.length === 0 || !schoolEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) {
      return NextResponse.json({ error: "That doesn't look like a valid email." }, { status: 400 });
    }
    if (!isSchoolEmail(schoolEmail)) {
      return NextResponse.json(
        { error: "Please use a .edu or .org school email address for verification." },
        { status: 400 }
      );
    }

    const existing = await getProfileBySchoolEmail(schoolEmail);

    if (existing && existing.emailVerified) {
      return NextResponse.json(
        {
          error:
            "There's already a profile for this email. Head to \"Staff: manage my gifts\" to update it instead.",
        },
        { status: 409 }
      );
    }

    // An unverified draft from an earlier, never-completed signup — reuse it
    // instead of creating another orphaned record for the same email.
    const profile = existing
      ? await updateDraftFields(existing.recordId, { school, category, gradeOrRole, name, birthday, favorites })
      : await createDraftProfile({ school, category, gradeOrRole, name, schoolEmail, birthday, favorites });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
