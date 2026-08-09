"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { School } from "@/lib/types";

export default function SchoolSearch() {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSchools(data.schools);
      })
      .catch(() => setError("Couldn't load schools right now."));
  }, []);

  const filtered = useMemo(() => {
    if (!schools) return [];
    const q = query.trim().toLowerCase();
    if (!q) return schools.slice(0, 12);
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.parish.toLowerCase().includes(q)
    );
  }, [schools, query]);

  return (
    <div className="max-w-xl mx-auto bg-card border hairline rounded-[4px] shadow-[0_2px_0_rgba(34,37,43,0.14)] p-6 relative mt-2">
      <span className="absolute -top-3.5 left-5 bg-gold text-board font-hand font-bold text-lg px-3.5 py-0.5 rounded-[3px] -rotate-2">
        Find a school
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by school name, city, or parish…"
        className="w-full border hairline rounded-[4px] px-3 py-2.5 text-[15px] bg-white text-ink"
      />
      {error && <p className="text-brick text-sm mt-3">{error}</p>}
      {!schools && !error && <p className="text-ink-soft text-sm mt-3">Loading schools…</p>}
      <div className="flex flex-wrap gap-2 mt-4">
        {filtered.map((s) => (
          <Link
            key={s.recordId}
            href={`/schools/${s.id}`}
            className="bg-paper-dark hover:bg-gold hover:text-board border hairline rounded-full px-3.5 py-1.5 text-[13.5px] text-ink"
          >
            {s.name} — {s.city}
          </Link>
        ))}
        {schools && filtered.length === 0 && (
          <p className="text-ink-soft text-sm">No schools match yet. Try another search, or add it below.</p>
        )}
      </div>
    </div>
  );
}
