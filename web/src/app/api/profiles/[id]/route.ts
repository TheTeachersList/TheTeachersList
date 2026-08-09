import { NextResponse } from "next/server";
import { getProfileBySlugId } from "@/lib/profiles";
import { getPublicGiftsForProfile } from "@/lib/publicGifts";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const profile = await getProfileBySlugId(id);
    if (!profile || !profile.emailVerified) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const gifts = await getPublicGiftsForProfile(profile);
    const { giftDecisions, customGifts, ...publicProfile } = profile;
    void giftDecisions;
    void customGifts;
    return NextResponse.json({ profile: publicProfile, gifts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
