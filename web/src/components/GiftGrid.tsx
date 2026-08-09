"use client";

import { useState } from "react";
import type { DisplayGift } from "@/lib/publicGifts";

export default function GiftGrid({ profileId, gifts }: { profileId: string; gifts: DisplayGift[] }) {
  const [items, setItems] = useState(gifts);

  async function claim(key: string, name: string) {
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, giftKey: key, claimedBy: name }),
    });
    const data = await res.json();
    if (!res.ok) return data.error as string;
    setItems((prev) =>
      prev.map((g) => (g.key === key ? { ...g, claimedBy: name, claimRecordId: data.claim.recordId } : g))
    );
    return null;
  }

  async function release(key: string, claimRecordId: string) {
    await fetch(`/api/claims?recordId=${encodeURIComponent(claimRecordId)}`, { method: "DELETE" });
    setItems((prev) => (prev.map((g) => (g.key === key ? { ...g, claimedBy: null, claimRecordId: null } : g))));
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-ink-soft text-sm bg-card border hairline rounded-[4px]">
        No gift ideas listed yet — check back soon.
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
      {items.map((g) => (
        <GiftCard key={g.key} gift={g} onClaim={(name) => claim(g.key, name)} onRelease={() => g.claimRecordId && release(g.key, g.claimRecordId)} />
      ))}
    </div>
  );
}

function GiftCard({
  gift,
  onClaim,
  onRelease,
}: {
  gift: DisplayGift;
  onClaim: (name: string) => Promise<string | null>;
  onRelease: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleClaim() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name to claim this gift.");
      return;
    }
    setSubmitting(true);
    setError("");
    const err = await onClaim(trimmed);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <div className="bg-white border hairline rounded-[4px] p-4 relative">
      {gift.topPick && (
        <span className="absolute -top-2.5 right-3 bg-gold text-board font-hand font-bold text-sm px-2.5 py-0.5 rounded-[3px] rotate-3">
          ★ top pick
        </span>
      )}
      <div className="font-semibold text-[15px] text-board mb-1">
        {gift.link ? (
          <a href={gift.link} target="_blank" rel="noreferrer noopener" className="hover:underline">
            {gift.name}
          </a>
        ) : (
          gift.name
        )}
      </div>
      {gift.blurb && <div className="text-[13px] text-ink-soft mb-2">{gift.blurb}</div>}
      {gift.price && <div className="text-[12.5px] text-ink-soft font-semibold">{gift.price}</div>}

      {gift.claimedBy ? (
        <div className="mt-2.5 text-[13px] text-board bg-paper-dark rounded-[4px] px-2.5 py-1.5 flex items-center justify-between gap-2">
          <span>🎁 Claimed by {gift.claimedBy}</span>
          <button onClick={onRelease} className="text-brick underline text-xs font-semibold shrink-0">
            release
          </button>
        </div>
      ) : (
        <div className="mt-2.5">
          <div className="flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 min-w-0 border hairline rounded-[4px] px-2.5 py-1.5 text-[13px]"
            />
            <button
              onClick={handleClaim}
              disabled={submitting}
              className="bg-gold text-board font-semibold text-[13px] rounded-[4px] px-3 py-1.5 whitespace-nowrap disabled:opacity-60"
            >
              Claim
            </button>
          </div>
          {error && <div className="text-brick text-[11.5px] mt-1">{error}</div>}
        </div>
      )}
    </div>
  );
}
