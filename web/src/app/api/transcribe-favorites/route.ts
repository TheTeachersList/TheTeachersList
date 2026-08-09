import { NextResponse } from "next/server";
import { COLORS, DRINKS, HOBBIES, SCENTS, STORES, TREATS } from "@/lib/types";

export const dynamic = "force-dynamic";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      message: "Photo-to-form transcription isn't set up yet. Add ANTHROPIC_API_KEY to enable it — for now, fill the form in by hand.",
    });
  }

  try {
    const body = await request.json();
    const imageBase64 = String(body.imageBase64 ?? "");
    const mediaType = String(body.mediaType ?? "image/jpeg");
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const prompt = `You are reading a photo of a handwritten "favorites sheet" filled out by a teacher or school staff member. Extract their favorites and map each answer to the closest matching option from the fixed lists below. If an answer clearly does not match any option, or the field is blank/illegible, leave it as an empty string (or empty array for hobbies).

Color options: ${COLORS.join(", ")}
Treat options: ${TREATS.join(", ")}
Drink options: ${DRINKS.join(", ")}
Scent options: ${SCENTS.join(", ")}
Hobby options (pick up to 2 that best match): ${HOBBIES.join(", ")}
Store options: ${STORES.join(", ")}

Also extract, as free text:
- "avoid": any allergies or things to avoid mentioned
- "wishlist": any specific wishlist note or extra detail mentioned

Respond with ONLY a JSON object in exactly this shape, no other text:
{"color":"","treat":"","drink":"","scent":"","hobbies":[],"store":"","avoid":"","wishlist":""}`;

    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Transcription failed: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      configured: true,
      draft: {
        color: parsed.color ?? "",
        treat: parsed.treat ?? "",
        drink: parsed.drink ?? "",
        scent: parsed.scent ?? "",
        hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies.slice(0, 2) : [],
        store: parsed.store ?? "",
        avoid: parsed.avoid ?? "",
        wishlist: parsed.wishlist ?? "",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
