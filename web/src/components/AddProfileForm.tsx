"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  COLORS,
  DRINKS,
  FLOWERS,
  HOBBIES,
  RESTAURANTS,
  SCENTS,
  SHIRT_SIZES,
  SPORTS_TEAMS,
  STAFF_ROLES,
  STORES,
  TREATS,
  type Favorites,
  type ProfileCategory,
  type School,
} from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const emptyFavorites: Favorites = {
  color: "",
  treat: "",
  drink: "",
  scent: "",
  hobbies: [],
  store: "",
  restaurant: "",
  flower: "",
  sportsTeam: "",
  shirtSize: "",
  avoid: "",
  wishlist: "",
};

export default function AddProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [schools, setSchools] = useState<School[]>([]);
  const [showNewSchool, setShowNewSchool] = useState(false);

  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState(searchParams.get("school") ?? "");
  const [category, setCategory] = useState<ProfileCategory>("teacher");
  const [gradeOrRole, setGradeOrRole] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favorites, setFavorites] = useState<Favorites>(emptyFavorites);

  const [photoNote, setPhotoNote] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoDraft, setPhotoDraft] = useState<Favorites | null>(null);

  const [nameErr, setNameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [formErr, setFormErr] = useState("");

  const [stage, setStage] = useState<"form" | "verify" | "done">("form");
  const [pendingProfileRecordId, setPendingProfileRecordId] = useState("");
  const [pendingProfileSlug, setPendingProfileSlug] = useState("");
  const [code, setCode] = useState("");
  const [verifyErr, setVerifyErr] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => setSchools(d.schools ?? []));
  }, []);

  const selectedSchool = useMemo(() => schools.find((s) => s.id === schoolId), [schools, schoolId]);
  const gradeOptions = category === "teacher" ? selectedSchool?.grades ?? [] : STAFF_ROLES;

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setPhotoNote("");
    setPhotoDraft(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/transcribe-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type || "image/jpeg" }),
      });
      const data = await res.json();
      if (!data.configured) {
        setPhotoNote(data.message ?? "Photo transcription isn't set up yet — fill the form in by hand.");
      } else if (data.draft) {
        setPhotoDraft(data.draft);
        setPhotoNote("Here's what we read from the photo — review it, then apply it to the form.");
      } else {
        setPhotoNote(data.error ?? "Couldn't read that photo. Try again or fill the form in by hand.");
      }
    } catch {
      setPhotoNote("Couldn't read that photo. Try again or fill the form in by hand.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function applyPhotoDraft() {
    if (photoDraft) setFavorites(photoDraft);
    setPhotoDraft(null);
  }

  function toggleHobby(h: string) {
    setFavorites((prev) => {
      const has = prev.hobbies.includes(h);
      return has
        ? { ...prev, hobbies: prev.hobbies.filter((x) => x !== h) }
        : { ...prev, hobbies: [...prev.hobbies, h] };
    });
  }

  const [customHobby, setCustomHobby] = useState("");
  function addCustomHobby() {
    const h = customHobby.trim();
    if (!h || favorites.hobbies.includes(h)) return;
    setFavorites((prev) => ({ ...prev, hobbies: [...prev.hobbies, h] }));
    setCustomHobby("");
  }

  async function addNewSchool(input: { name: string; city: string; parish: string; level: string; grades: string[] }) {
    const res = await fetch("/api/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (res.ok) {
      setSchools((prev) => [...prev, data.school]);
      setSchoolId(data.school.id);
      setShowNewSchool(false);
    }
    return data;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameErr("");
    setEmailErr("");
    setFormErr("");

    if (!name.trim()) {
      setNameErr("Please add a name.");
      return;
    }
    if (!schoolId) {
      setFormErr("Please choose a school.");
      return;
    }
    if (!gradeOrRole) {
      setFormErr(category === "teacher" ? "Please choose a grade." : "Please choose a role.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Please enter a valid school email.");
      return;
    }

    setBusy(true);
    try {
      const createRes = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          school: schoolId,
          category,
          gradeOrRole,
          schoolEmail: email,
          birthday,
          favorites,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setFormErr(createData.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      setPendingProfileRecordId(createData.profile.recordId);
      setPendingProfileSlug(createData.profile.id);

      const sendRes = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "add-profile" }),
      });
      const sendData = await sendRes.json();
      if (sendData.devCode) setDevCode(sendData.devCode);
      setStage("verify");
    } catch {
      setFormErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setVerifyErr("");
    const res = await fetch("/api/verify/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "add-profile" }),
    });
    const data = await res.json();
    setDevCode(data.devCode ?? "");
  }

  async function confirmCode() {
    setVerifyErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose: "add-profile", profileRecordId: pendingProfileRecordId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyErr(data.error ?? "That code doesn't match. Try again.");
        return;
      }
      setStage("done");
      router.push(`/profile/${pendingProfileSlug}`);
    } catch {
      setVerifyErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "verify") {
    return (
      <div className="bg-card border hairline rounded-[4px] p-6 sm:p-7 max-w-xl mx-auto">
        <p className="font-display font-semibold text-lg text-board mb-1">Verify your school email</p>
        <p className="text-[13.5px] text-ink-soft mb-3">We&apos;ve sent a 6-digit code to {email}.</p>
        {devCode && (
          <p className="text-[12.5px] text-brick-dark bg-white border border-dashed hairline rounded-[3px] px-2.5 py-2 mb-3">
            Resend isn&apos;t configured yet, so here&apos;s the code directly: <strong>{devCode}</strong>
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="000000"
            className="border hairline rounded-[4px] px-3 py-2 max-w-[140px] tracking-[4px] font-bold text-center"
          />
          <button
            onClick={confirmCode}
            disabled={busy}
            className="bg-brick hover:bg-brick-dark text-white rounded-[4px] px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Confirm
          </button>
        </div>
        <p className="text-brick text-xs mt-1.5 min-h-[16px]">{verifyErr}</p>
        <div className="flex gap-4 mt-2">
          <button onClick={resendCode} className="text-brick underline text-sm">
            Resend code
          </button>
          <button onClick={() => setStage("form")} className="text-brick underline text-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border hairline rounded-[4px] p-6 sm:p-7 max-w-xl mx-auto space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name (as you'd like it shown)" full>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mrs. Alvarez"
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
          <ErrText text={nameErr} />
        </Field>

        <Field label="School" full>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          >
            <option value="">— choose a school —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.city}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewSchool((v) => !v)}
            className="text-brick underline text-xs mt-1"
          >
            Don&apos;t see your school? Add it
          </button>
          {showNewSchool && <NewSchoolForm onAdd={addNewSchool} />}
        </Field>

        <Field label="I am a…">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ProfileCategory);
              setGradeOrRole("");
            }}
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          >
            <option value="teacher">Classroom Teacher</option>
            <option value="staff">Ancillary Staff</option>
          </select>
        </Field>

        <Field label={category === "teacher" ? "Grade" : "Role"}>
          <select
            value={gradeOrRole}
            onChange={(e) => setGradeOrRole(e.target.value)}
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          >
            <option value="">—</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field label="School Email" full>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@schooldomain.org"
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          />
          {selectedSchool?.domain && (
            <span className="text-[11.5px] text-ink-soft">Usually ends in @{selectedSchool.domain}</span>
          )}
          <ErrText text={emailErr} />
        </Field>

        <Field label="Birthday (optional, no year needed)">
          <div className="flex gap-2">
            <select
              value={birthday.split("/")[0] ?? ""}
              onChange={(e) => {
                const day = birthday.split("/")[1] ?? "";
                setBirthday(e.target.value && day ? `${e.target.value}/${day}` : e.target.value ? `${e.target.value}/` : "");
              }}
              className="flex-1 border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
            >
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={birthday.split("/")[1] ?? ""}
              onChange={(e) => {
                const month = birthday.split("/")[0] ?? "";
                setBirthday(month && e.target.value ? `${month}/${e.target.value}` : month ? `${month}/` : "");
              }}
              className="flex-1 border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
            >
              <option value="">Day</option>
              {DAYS.map((d) => (
                <option key={d} value={String(d).padStart(2, "0")}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </Field>
      </div>

      <div className="border-t hairline pt-4">
        <label className="text-[12.5px] font-semibold text-ink-soft uppercase tracking-wide">
          Have a handwritten favorites sheet? Upload a photo and we&apos;ll try to fill this in for you.
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          className="block mt-2 text-sm text-ink-soft cursor-pointer file:cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-[4px] file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
        />
        {photoBusy && <p className="text-ink-soft text-xs mt-1.5">Reading the photo…</p>}
        {photoNote && <p className="text-ink-soft text-xs mt-1.5">{photoNote}</p>}
        {photoDraft && (
          <button
            type="button"
            onClick={applyPhotoDraft}
            className="mt-2 bg-gold text-board font-semibold text-xs rounded-[4px] px-3 py-1.5"
          >
            Apply this to the form below (you can still edit it)
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField label="Favorite Color" value={favorites.color} options={COLORS} onChange={(v) => setFavorites((p) => ({ ...p, color: v }))} />
        <SelectField label="Favorite Treat" value={favorites.treat} options={TREATS} onChange={(v) => setFavorites((p) => ({ ...p, treat: v }))} />
        <SelectField label="Go-to Drink" value={favorites.drink} options={DRINKS} onChange={(v) => setFavorites((p) => ({ ...p, drink: v }))} />
        <SelectField label="Favorite Scent / Candle" value={favorites.scent} options={SCENTS} onChange={(v) => setFavorites((p) => ({ ...p, scent: v }))} />
        <SelectField label="Favorite Store" value={favorites.store} options={STORES} onChange={(v) => setFavorites((p) => ({ ...p, store: v }))} />
        <SelectField label="Favorite Restaurant" value={favorites.restaurant} options={RESTAURANTS} onChange={(v) => setFavorites((p) => ({ ...p, restaurant: v }))} />
        <SelectField label="Favorite Flower" value={favorites.flower} options={FLOWERS} onChange={(v) => setFavorites((p) => ({ ...p, flower: v }))} />
        <SelectField label="Favorite Sports Team" value={favorites.sportsTeam} options={SPORTS_TEAMS} onChange={(v) => setFavorites((p) => ({ ...p, sportsTeam: v }))} />
        <SelectField label="Shirt Size" value={favorites.shirtSize} options={SHIRT_SIZES} onChange={(v) => setFavorites((p) => ({ ...p, shirtSize: v }))} />
      </div>

      <Field label="Hobbies" full>
        <div className="flex flex-wrap gap-2">
          {HOBBIES.map((h) => (
            <button
              type="button"
              key={h}
              onClick={() => toggleHobby(h)}
              className={`border hairline rounded-full px-3.5 py-1.5 text-[13px] ${
                favorites.hobbies.includes(h) ? "bg-board text-white border-board" : "bg-white text-ink"
              }`}
            >
              {h}
            </button>
          ))}
          {favorites.hobbies
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

      <Field label="Please avoid (allergies, dislikes)" full>
        <input
          value={favorites.avoid}
          onChange={(e) => setFavorites((p) => ({ ...p, avoid: e.target.value }))}
          placeholder="e.g. nut allergy, fragrance sensitive"
          className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
        />
      </Field>

      <Field label="Anything specific on your wishlist? (optional)" full>
        <textarea
          rows={2}
          value={favorites.wishlist}
          onChange={(e) => setFavorites((p) => ({ ...p, wishlist: e.target.value }))}
          placeholder="e.g. classroom supplies, a specific book, etc."
          className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
        />
      </Field>

      {formErr && <p className="text-brick text-sm">{formErr}</p>}

      <div className="flex justify-end gap-2.5 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="bg-brick hover:bg-brick-dark text-white rounded-[4px] px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function NewSchoolForm({
  onAdd,
}: {
  onAdd: (input: { name: string; city: string; parish: string; level: string; grades: string[] }) => Promise<{ error?: string }>;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [parish, setParish] = useState("");
  const [level, setLevel] = useState("Public");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !city.trim()) {
      setErr("School name and city are required.");
      return;
    }
    setBusy(true);
    const grades = [
      "Pre-K",
      "Kindergarten",
      "1st Grade",
      "2nd Grade",
      "3rd Grade",
      "4th Grade",
      "5th Grade",
      "6th Grade",
      "7th Grade",
      "8th Grade",
      "9th Grade",
      "10th Grade",
      "11th Grade",
      "12th Grade",
    ];
    const data = await onAdd({ name, city, parish, level, grades });
    setBusy(false);
    if (data.error) setErr(data.error);
  }

  return (
    <div className="mt-2 bg-white border hairline rounded-[4px] p-3 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" className="w-full border hairline rounded-[4px] px-2.5 py-1.5 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="border hairline rounded-[4px] px-2.5 py-1.5 text-sm" />
        <input value={parish} onChange={(e) => setParish(e.target.value)} placeholder="Parish" className="border hairline rounded-[4px] px-2.5 py-1.5 text-sm" />
      </div>
      <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full border hairline rounded-[4px] px-2.5 py-1.5 text-sm">
        <option value="Public">Public</option>
        <option value="Charter">Charter</option>
        <option value="Private">Private</option>
      </select>
      {err && <p className="text-brick text-xs">{err}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="bg-board text-white text-xs font-semibold rounded-[4px] px-3 py-1.5 disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add school"}
      </button>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-[12.5px] font-semibold text-ink-soft uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function SelectField({
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

function ErrText({ text }: { text: string }) {
  return <p className="text-brick text-xs min-h-[14px]">{text}</p>;
}
