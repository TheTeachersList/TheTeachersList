import { NextResponse } from "next/server";
import { getProfileByRecordId, getProfileBySchoolEmail, markProfileVerified } from "@/lib/profiles";
import { createManageToken } from "@/lib/session";
import { checkCode } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();
    const purpose = String(body.purpose ?? "add-profile");

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const valid = await checkCode(email, code);
    if (!valid) {
      return NextResponse.json({ error: "That code doesn't match or has expired." }, { status: 400 });
    }

    if (purpose === "add-profile") {
      const profileRecordId = String(body.profileRecordId ?? "");
      const profile = await getProfileByRecordId(profileRecordId);
      if (!profile || profile.schoolEmail.toLowerCase() !== email) {
        return NextResponse.json({ error: "Profile not found for this email." }, { status: 404 });
      }
      await markProfileVerified(profileRecordId);
      return NextResponse.json({ ok: true, profileId: profile.id });
    }

    if (purpose === "manage-gifts") {
      const profile = await getProfileBySchoolEmail(email);
      if (!profile || !profile.emailVerified) {
        return NextResponse.json({ error: "No verified profile found for this email." }, { status: 404 });
      }
      const token = createManageToken(profile.recordId);
      return NextResponse.json({ ok: true, token, profileId: profile.id });
    }

    return NextResponse.json({ error: "Unknown verification purpose." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
