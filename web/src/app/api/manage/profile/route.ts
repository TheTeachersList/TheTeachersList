import { NextResponse } from "next/server";
import { listGiftCatalog, suggestGifts } from "@/lib/gifts";
import { getManageProfileRecordId } from "@/lib/manageAuth";
import { getProfileByRecordId } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const recordId = getManageProfileRecordId(request);
  if (!recordId) {
    return NextResponse.json({ error: "Not authorized. Please verify your school email again." }, { status: 401 });
  }
  try {
    const profile = await getProfileByRecordId(recordId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const catalog = await listGiftCatalog();
    const suggestions = suggestGifts(catalog, profile.favorites, 20).map((s) => ({
      ...s,
      decision: profile.giftDecisions[s.recordId] ?? "pending",
    }));
    return NextResponse.json({ profile, suggestions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
