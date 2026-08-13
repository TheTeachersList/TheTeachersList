import { NextResponse } from "next/server";
import { getManageProfileRecordId } from "@/lib/manageAuth";
import { updateFavorites } from "@/lib/profiles";
import type { Favorites } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const recordId = getManageProfileRecordId(request);
  if (!recordId) {
    return NextResponse.json({ error: "Not authorized. Please verify your school email again." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const f = body.favorites ?? {};
    const favorites: Favorites = {
      color: String(f.color ?? ""),
      treat: String(f.treat ?? ""),
      drink: String(f.drink ?? ""),
      scent: String(f.scent ?? ""),
      hobbies: Array.isArray(f.hobbies) ? f.hobbies.map(String) : [],
      store: String(f.store ?? ""),
      restaurant: String(f.restaurant ?? ""),
      flower: String(f.flower ?? ""),
      sportsTeam: String(f.sportsTeam ?? ""),
      shirtSize: String(f.shirtSize ?? ""),
      avoid: String(f.avoid ?? ""),
      wishlist: String(f.wishlist ?? ""),
    };
    await updateFavorites(recordId, favorites);
    return NextResponse.json({ ok: true, favorites });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
