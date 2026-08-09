"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
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
        <p className="font-hand text-2xl text-board">Thanks — got your note!</p>
        <p className="text-ink-soft text-sm mt-2">We&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display font-bold text-3xl text-board mb-1.5">Contact us</h1>
      <p className="text-ink-soft text-sm mb-6">Questions, ideas, or something not working right? Let us know.</p>
      <form onSubmit={handleSubmit} className="bg-card border hairline rounded-[4px] p-6 space-y-4">
        <Field label="Name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
        </Field>
        <Field label="Message">
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
            {status === "sending" ? "Sending…" : "Send message"}
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
