import { NextResponse } from "next/server";
import { createClaim, deleteClaim, listClaimsForPerson } from "@/lib/claims";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileId = String(body.profileId ?? "").trim();
    const giftKey = String(body.giftKey ?? "").trim();
    const claimedBy = String(body.claimedBy ?? "").trim();

    if (!profileId || !giftKey || !claimedBy) {
      return NextResponse.json({ error: "Missing profileId, giftKey, or your name." }, { status: 400 });
    }

    const existing = await listClaimsForPerson(profileId);
    if (existing.some((c) => c.giftKey === giftKey)) {
      return NextResponse.json({ error: "That gift was just claimed by someone else." }, { status: 409 });
    }

    const claim = await createClaim(profileId, giftKey, claimedBy);
    return NextResponse.json({ claim }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");
    if (!recordId) {
      return NextResponse.json({ error: "recordId is required." }, { status: 400 });
    }
    await deleteClaim(recordId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
