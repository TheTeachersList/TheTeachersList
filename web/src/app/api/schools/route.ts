import { NextResponse } from "next/server";
import { createSchool, listSchools } from "@/lib/schools";
import type { SchoolLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const schools = await listSchools();
    return NextResponse.json({ schools });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const city = String(body.city ?? "").trim();
    const parish = String(body.parish ?? "").trim();
    const level = String(body.level ?? "Public") as SchoolLevel;
    const grades = Array.isArray(body.grades) ? body.grades.map(String) : [];

    if (!name || !city) {
      return NextResponse.json({ error: "School name and city are required." }, { status: 400 });
    }
    if (!["Public", "Charter", "Private"].includes(level)) {
      return NextResponse.json({ error: "Invalid school level." }, { status: 400 });
    }

    const school = await createSchool({ name, city, parish, level, grades });
    return NextResponse.json({ school }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
