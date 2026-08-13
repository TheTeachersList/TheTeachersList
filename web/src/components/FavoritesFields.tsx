"use client";

import { useState } from "react";
import { HOBBIES } from "@/lib/types";

export function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-[12.5px] font-semibold text-ink-soft uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export function ErrText({ text }: { text: string }) {
  return <p className="text-brick text-xs min-h-[14px]">{text}</p>;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const isKnown = value === "" || options.includes(value);
  const [customMode, setCustomMode] = useState(!isKnown);

  if (customMode) {
    return (
      <Field label={label}>
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your own"
            className="flex-1 min-w-0 border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
          <button
            type="button"
            onClick={() => {
              setCustomMode(false);
              onChange("");
            }}
            className="text-xs text-brick underline shrink-0"
          >
            use list
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === "__other__") {
            setCustomMode(true);
            onChange("");
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value="__other__">Other — add my own</option>
      </select>
    </Field>
  );
}

export function HobbyPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [customHobby, setCustomHobby] = useState("");

  function toggleHobby(h: string) {
    onChange(value.includes(h) ? value.filter((x) => x !== h) : [...value, h]);
  }

  function addCustomHobby() {
    const h = customHobby.trim();
    if (!h || value.includes(h)) return;
    onChange([...value, h]);
    setCustomHobby("");
  }

  return (
    <Field label="Hobbies" full>
      <div className="flex flex-wrap gap-2">
        {HOBBIES.map((h) => (
          <button
            type="button"
            key={h}
            onClick={() => toggleHobby(h)}
            className={`border hairline rounded-full px-3.5 py-1.5 text-[13px] ${
              value.includes(h) ? "bg-board text-white border-board" : "bg-white text-ink"
            }`}
          >
            {h}
          </button>
        ))}
        {value
          .filter((h) => !HOBBIES.includes(h))
          .map((h) => (
            <button
              type="button"
              key={h}
              onClick={() => toggleHobby(h)}
              className="border hairline rounded-full px-3.5 py-1.5 text-[13px] bg-board text-white border-board"
            >
              {h} ×
            </button>
          ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        <input
          value={customHobby}
          onChange={(e) => setCustomHobby(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomHobby();
            }
          }}
          placeholder="Not listed? Add your own"
          className="flex-1 border hairline rounded-[4px] px-2.5 py-1.5 text-[13px] bg-white"
        />
        <button
          type="button"
          onClick={addCustomHobby}
          className="border border-board text-board text-xs font-semibold rounded-[4px] px-3 py-1.5 shrink-0"
        >
          Add
        </button>
      </div>
    </Field>
  );
}
