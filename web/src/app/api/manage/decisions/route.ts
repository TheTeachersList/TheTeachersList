import { NextResponse } from "next/server";
import { getManageProfileRecordId } from "@/lib/manageAuth";
import { getProfileByRecordId, updateGiftDecisions } from "@/lib/profiles";
import type { GiftDecision } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const recordId = getManageProfileRecordId(request);
  if (!recordId) {
    return NextResponse.json({ error: "Not authorized. Please verify your school email again." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const catalogRecordId = String(body.catalogRecordId ?? "");
    const decision = String(body.decision ?? "") as GiftDecision;
    if (!catalogRecordId || !["approved", "declined", "pending"].includes(decision)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const profile = await getProfileByRecordId(recordId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const decisions = { ...profile.giftDecisions, [catalogRecordId]: decision };
    await updateGiftDecisions(recordId, decisions);
    return NextResponse.json({ ok: true, decisions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
