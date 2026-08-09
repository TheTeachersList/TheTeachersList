import { NextResponse } from "next/server";
import { sendVerificationEmail, isResendConfigured } from "@/lib/email";
import { getProfileBySchoolEmail } from "@/lib/profiles";
import { issueCode } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const purpose = String(body.purpose ?? "add-profile");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "That doesn't look like a valid email." }, { status: 400 });
    }

    if (purpose === "manage-gifts") {
      const profile = await getProfileBySchoolEmail(email);
      if (!profile || !profile.emailVerified) {
        // Don't reveal whether an account exists — respond ok either way.
        return NextResponse.json({ ok: true });
      }
    }

    const code = await issueCode(email);

    if (isResendConfigured()) {
      await sendVerificationEmail(email, code);
      return NextResponse.json({ ok: true });
    }

    // No Resend key configured yet — fall back to returning the code for local dev only.
    return NextResponse.json({
      ok: true,
      devCode: code,
      devNote: "RESEND_API_KEY isn't set, so this code is being returned directly instead of emailed.",
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
