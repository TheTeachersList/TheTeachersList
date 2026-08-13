"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrText, Field, HobbyPicker, SelectField } from "./FavoritesFields";
import {
  COLORS,
  DRINKS,
  FLOWERS,
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
  const [gradeOrRole, setGradeOrRole] = useState<string[]>([]);
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

  function toggleGrade(g: string) {
    setGradeOrRole((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
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
    if (gradeOrRole.length === 0) {
      setFormErr(category === "teacher" ? "Please choose at least one grade." : "Please choose a role.");
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
      if (data.token) {
        sessionStorage.setItem("ttl_manage_token", data.token);
        router.push("/manage-gifts");
      } else {
        router.push(`/profile/${pendingProfileSlug}`);
      }
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
              setGradeOrRole([]);
            }}
            className="w-full border hairline rounded-[4px] px-3 py-2 bg-white text-[15px]"
          >
            <option value="teacher">Classroom Teacher</option>
            <option value="staff">Ancillary Staff</option>
          </select>
        </Field>

        {category === "teacher" ? (
          <Field label="Grades taught (select all that apply)" full>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleGrade(g)}
                  className={`border hairline rounded-full px-3.5 py-1.5 text-[13px] ${
                    gradeOrRole.includes(g) ? "bg-board text-white border-board" : "bg-white text-ink"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
        ) : (
          <Field label="Role">
            <select
              value={gradeOrRole[0] ?? ""}
              onChange={(e) => setGradeOrRole(e.target.value ? [e.target.value] : [])}
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
        )}

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

      <HobbyPicker value={favorites.hobbies} onChange={(hobbies) => setFavorites((p) => ({ ...p, hobbies }))} />

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

