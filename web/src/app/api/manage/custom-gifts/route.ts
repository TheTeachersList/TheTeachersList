import { NextResponse } from "next/server";
import { withAffiliateTag } from "@/lib/affiliate";
import { getManageProfileRecordId } from "@/lib/manageAuth";
import { getProfileByRecordId, updateCustomGifts } from "@/lib/profiles";

export const dynamic = "force-dynamic";

function uid(): string {
  return "g_" + Math.random().toString(36).slice(2, 10);
}

export async function POST(request: Request) {
  const recordId = getManageProfileRecordId(request);
  if (!recordId) {
    return NextResponse.json({ error: "Not authorized. Please verify your school email again." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const link = withAffiliateTag(String(body.link ?? "").trim());
    const price = String(body.price ?? "").trim();
    const note = String(body.note ?? "").trim();
    if (!name || !link) {
      return NextResponse.json({ error: "Name and link are required." }, { status: 400 });
    }
    const profile = await getProfileByRecordId(recordId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const gifts = [...profile.customGifts, { id: uid(), name, link, price, note }];
    await updateCustomGifts(recordId, gifts);
    return NextResponse.json({ ok: true, customGifts: gifts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const recordId = getManageProfileRecordId(request);
  if (!recordId) {
    return NextResponse.json({ error: "Not authorized. Please verify your school email again." }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const giftId = searchParams.get("id");
    const profile = await getProfileByRecordId(recordId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const gifts = profile.customGifts.filter((g) => g.id !== giftId);
    await updateCustomGifts(recordId, gifts);
    return NextResponse.json({ ok: true, customGifts: gifts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
