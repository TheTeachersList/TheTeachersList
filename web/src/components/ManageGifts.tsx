"use client";

import { useEffect, useState } from "react";
import type { CustomGift, Profile, SuggestedGift } from "@/lib/types";

type SuggestionWithDecision = SuggestedGift & { decision: "approved" | "declined" | "pending" };

export default function ManageGifts() {
  const [token, setToken] = useState("");
  const [stage, setStage] = useState<"email" | "code" | "dashboard">("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("ttl_manage_token");
    if (saved) {
      setToken(saved);
      setStage("dashboard");
    }
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "manage-gifts" }),
      });
      const data = await res.json();
      if (data.devCode) setDevCode(data.devCode);
      setStage("code");
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose: "manage-gifts" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "That code doesn't match.");
        return;
      }
      sessionStorage.setItem("ttl_manage_token", data.token);
      setToken(data.token);
      setStage("dashboard");
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "dashboard" && token) {
    return <Dashboard token={token} onSignOut={() => { sessionStorage.removeItem("ttl_manage_token"); setToken(""); setStage("email"); }} />;
  }

  return (
    <div className="max-w-md mx-auto bg-card border hairline rounded-[4px] p-6 sm:p-7">
      <p className="font-display font-semibold text-lg text-board mb-1">Manage my gifts</p>
      <p className="text-[13.5px] text-ink-soft mb-4">
        Re-verify your school email to review suggestions and add your own gift links.
      </p>
      {stage === "email" && (
        <form onSubmit={sendCode} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@schooldomain.org"
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
          {err && <p className="text-brick text-sm">{err}</p>}
          <button disabled={busy} className="bg-brick hover:bg-brick-dark text-white rounded-[4px] px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      )}
      {stage === "code" && (
        <form onSubmit={confirmCode} className="space-y-3">
          <p className="text-[13.5px] text-ink-soft">We&apos;ve sent a 6-digit code to {email}, if a profile exists for it.</p>
          {devCode && (
            <p className="text-[12.5px] text-brick-dark bg-white border border-dashed hairline rounded-[3px] px-2.5 py-2">
              Resend isn&apos;t configured yet, so here&apos;s the code directly: <strong>{devCode}</strong>
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="000000"
            className="border hairline rounded-[4px] px-3 py-2 max-w-[140px] tracking-[4px] font-bold text-center"
          />
          {err && <p className="text-brick text-sm">{err}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="bg-brick hover:bg-brick-dark text-white rounded-[4px] px-4 py-2 text-sm font-semibold disabled:opacity-60">
              {busy ? "Checking…" : "Confirm"}
            </button>
            <button type="button" onClick={() => setStage("email")} className="text-brick underline text-sm">
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Dashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionWithDecision[]>([]);
  const [loadErr, setLoadErr] = useState("");

  async function load() {
    const res = await fetch("/api/manage/profile", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) {
      setLoadErr(data.error ?? "Couldn't load your profile.");
      return;
    }
    setProfile(data.profile);
    setSuggestions(data.suggestions);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function decide(catalogRecordId: string, decision: "approved" | "declined") {
    setSuggestions((prev) => prev.map((s) => (s.recordId === catalogRecordId ? { ...s, decision } : s)));
    await fetch("/api/manage/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ catalogRecordId, decision }),
    });
  }

  async function addCustomGift(gift: { name: string; link: string; price: string; note: string }) {
    const res = await fetch("/api/manage/custom-gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(gift),
    });
    const data = await res.json();
    if (res.ok) setProfile((p) => (p ? { ...p, customGifts: data.customGifts } : p));
    return data;
  }

  async function removeCustomGift(id: string) {
    const res = await fetch(`/api/manage/custom-gifts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setProfile((p) => (p ? { ...p, customGifts: data.customGifts } : p));
  }

  if (loadErr) {
    return (
      <div className="max-w-xl mx-auto bg-card border hairline rounded-[4px] p-6 text-center">
        <p className="text-brick text-sm mb-3">{loadErr}</p>
        <button onClick={onSignOut} className="text-brick underline text-sm">
          Verify again
        </button>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-ink-soft text-sm">Loading…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-xl text-board">{profile.name}</p>
          <p className="text-ink-soft text-sm">{profile.gradeOrRole.join(", ")}</p>
        </div>
        <div className="flex items-center gap-3">
          <a href={`/profile/${profile.id}`} className="text-brick underline text-sm">
            View my public profile
          </a>
          <button onClick={onSignOut} className="text-ink-soft underline text-sm">
            Sign out
          </button>
        </div>
      </div>

      <section>
        <h2 className="font-display font-semibold text-lg text-board mb-1">Suggested gifts</h2>
        <p className="text-ink-soft text-[13.5px] mb-3">
          Matched from your favorites. Nothing shows to parents until you approve it.
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {suggestions.length === 0 && (
            <p className="text-ink-soft text-sm col-span-full">
              No matches yet — fill in more favorites on your profile to unlock suggestions.
            </p>
          )}
          {suggestions.map((s) => (
            <div key={s.recordId} className="bg-white border hairline rounded-[4px] p-4">
              <div className="font-semibold text-[15px] text-board">{s.name}</div>
              <div className="text-[13px] text-ink-soft mb-2">{s.blurb}</div>
              <div className="text-[12.5px] text-ink-soft font-semibold mb-3">{s.priceRange}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => decide(s.recordId, "approved")}
                  className={`flex-1 rounded-[4px] px-2.5 py-1.5 text-xs font-semibold ${
                    s.decision === "approved" ? "bg-board text-white" : "border hairline text-board"
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(s.recordId, "declined")}
                  className={`flex-1 rounded-[4px] px-2.5 py-1.5 text-xs font-semibold ${
                    s.decision === "declined" ? "bg-brick text-white" : "border hairline text-brick"
                  }`}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg text-board mb-1">Your own gift links</h2>
        <p className="text-ink-soft text-[13.5px] mb-3">
          Add a link from any store. These always show alongside your approved suggestions.
        </p>
        <div className="space-y-2 mb-4">
          {profile.customGifts.map((g) => (
            <CustomGiftRow key={g.id} gift={g} onRemove={() => removeCustomGift(g.id)} />
          ))}
        </div>
        <AddCustomGiftForm onAdd={addCustomGift} />
      </section>
    </div>
  );
}

function CustomGiftRow({ gift, onRemove }: { gift: CustomGift; onRemove: () => void }) {
  return (
    <div className="bg-white border hairline rounded-[4px] px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <a href={gift.link} target="_blank" rel="noreferrer noopener" className="font-semibold text-board text-sm hover:underline">
          {gift.name}
        </a>
        <div className="text-[12.5px] text-ink-soft">
          {gift.price} {gift.note && `· ${gift.note}`}
        </div>
      </div>
      <button onClick={onRemove} className="text-brick underline text-xs shrink-0">
        remove
      </button>
    </div>
  );
}

function AddCustomGiftForm({
  onAdd,
}: {
  onAdd: (gift: { name: string; link: string; price: string; note: string }) => Promise<{ error?: string }>;
}) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const data = await onAdd({ name, link, price, note });
    setBusy(false);
    if (data.error) {
      setErr(data.error);
      return;
    }
    setName("");
    setLink("");
    setPrice("");
    setNote("");
  }

  return (
    <form onSubmit={submit} className="bg-card border hairline rounded-[4px] p-4 grid sm:grid-cols-2 gap-2.5">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gift name" required className="border hairline rounded-[4px] px-2.5 py-1.5 text-sm bg-white" />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (https://…)" required className="border hairline rounded-[4px] px-2.5 py-1.5 text-sm bg-white" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (optional)" className="border hairline rounded-[4px] px-2.5 py-1.5 text-sm bg-white" />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="border hairline rounded-[4px] px-2.5 py-1.5 text-sm bg-white" />
      {err && <p className="text-brick text-xs sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2">
        <button disabled={busy} className="bg-board text-white text-xs font-semibold rounded-[4px] px-3.5 py-2 disabled:opacity-60">
          {busy ? "Adding…" : "Add gift link"}
        </button>
      </div>
    </form>
  );
}
