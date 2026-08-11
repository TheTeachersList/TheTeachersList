"use client";

import Link from "next/link";
import { useState } from "react";
import { STAFF_ROLES } from "@/lib/types";
import type { Profile, School } from "@/lib/types";

export default function SchoolRoster({ school, profiles }: { school: School; profiles: Profile[] }) {
  const tabs = [...school.grades, "Staff"];
  const [tab, setTab] = useState(tabs[0] ?? "Staff");

  const inTab =
    tab === "Staff"
      ? null
      : profiles.filter((p) => p.category === "teacher" && p.gradeOrRole.includes(tab));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-semibold text-sm px-4 py-2.5 rounded-t-[8px] border hairline border-b-0 relative top-px ${
              tab === t
                ? "bg-card text-board shadow-[0_-2px_0_var(--color-gold)_inset]"
                : "bg-paper-dark text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="bg-card border hairline rounded-[0_4px_4px_4px] p-6">
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {tab === "Staff"
            ? STAFF_ROLES.map((role) => {
                const people = profiles.filter((p) => p.category === "staff" && p.gradeOrRole.includes(role));
                if (people.length === 0) {
                  return (
                    <Link
                      key={role}
                      href={`/add-profile?school=${school.id}`}
                      className="bg-white border hairline rounded-[4px] p-4 hover:-translate-y-0.5 transition-transform"
                    >
                      <div className="font-display font-semibold text-board">{role}</div>
                      <div className="text-xs text-ink-soft/70 italic mt-2">No profile yet — be the first to add one</div>
                    </Link>
                  );
                }
                return people.map((p) => <PersonCard key={p.recordId} profile={p} roleLabel={role} />);
              })
            : (inTab ?? []).length === 0
              ? (
                  <div className="col-span-full text-center py-6 text-ink-soft text-sm">
                    No teacher profiles yet for {tab}.{" "}
                    <Link href={`/add-profile?school=${school.id}`} className="text-brick underline font-semibold">
                      Add the first one
                    </Link>
                  </div>
                )
              : inTab!.map((p) => <PersonCard key={p.recordId} profile={p} roleLabel={tab} />)}
        </div>
      </div>
    </div>
  );
}

function PersonCard({ profile, roleLabel }: { profile: Profile; roleLabel: string }) {
  return (
    <Link
      href={`/profile/${profile.id}`}
      className="bg-white border hairline rounded-[4px] p-4 relative hover:-translate-y-0.5 hover:shadow-md transition-transform"
    >
      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-gold" />
      <div className="font-display font-semibold text-board text-[17px]">{profile.name}</div>
      <div className="text-xs text-ink-soft mt-0.5">{roleLabel}</div>
    </Link>
  );
}
