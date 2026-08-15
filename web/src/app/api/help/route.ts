import { NextResponse } from "next/server";
import { sendHelpReportEmail } from "@/lib/email";
import { markHelpReportEmailSent, submitHelpReport } from "@/lib/helpReports";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const description = String(body.description ?? "").trim();
    const pageUrl = String(body.pageUrl ?? "").trim();

    if (!email || !description) {
      return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "That doesn't look like a valid email." }, { status: 400 });
    }

    const recordId = await submitHelpReport({ email, description, pageUrl });

    try {
      await sendHelpReportEmail({ email, description, pageUrl });
      await markHelpReportEmailSent(recordId);
    } catch (err) {
      // The report is already saved in Airtable — don't fail the request over a
      // notification-email hiccup, just log it so a missed email is traceable.
      console.error("Help report saved but notification email failed:", (err as Error).message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
