"use client";

import { useEffect, useState } from "react";

export default function HelpPage() {
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (document.referrer && document.referrer.includes(window.location.host)) {
      setPageUrl(document.referrer);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, description, pageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-hand text-2xl text-board">Thanks — we&apos;ve got it!</p>
        <p className="text-ink-soft text-sm mt-2">We&apos;ll look into it as soon as we can.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display font-bold text-3xl text-board mb-1.5">Report a problem</h1>
      <p className="text-ink-soft text-sm mb-6">
        Something not working right? Tell us what happened and we&apos;ll take a look.
      </p>
      <form onSubmit={handleSubmit} className="bg-card border hairline rounded-[4px] p-6 space-y-4">
        <Field label="Your email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
        </Field>
        <Field label="What happened?">
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What were you trying to do, and what went wrong?"
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
        </Field>
        <Field label="Which page? (optional)">
          <input
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="Paste the page URL if you have it"
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
        </Field>
        {error && <p className="text-brick text-sm">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-brick hover:bg-brick-dark text-white rounded-[4px] px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send report"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-ink-soft uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
