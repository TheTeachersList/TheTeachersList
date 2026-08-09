const RESEND_API = "https://api.resend.com/emails";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  if (!isResendConfigured()) return;
  const from = process.env.RESEND_FROM_EMAIL || "The Teacher's List <verify@theteacherslist.com>";
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Your verification code: ${code}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 420px; margin: 0 auto; padding: 24px; background: #F2ECDA; color: #22252B;">
          <h1 style="font-size: 20px; color: #1F3D2B;">The Teacher's List</h1>
          <p>Here's your verification code:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #B23A2E;">${code}</p>
          <p style="font-size: 13px; color: #55584F;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  }
}
