import { createRecord, getRecord, listRecords, updateRecord } from "./airtable";
import type {
  CustomGift,
  Favorites,
  GiftDecision,
  Profile,
  ProfileCategory,
} from "./types";

const TABLE = "Profiles";

type ProfileFields = {
  name: string;
  id: string;
  school: string;
  category: ProfileCategory;
  gradeOrRole: string;
  schoolEmail: string;
  emailVerified?: boolean;
  birthday?: string;
  favoritesJson?: string;
  giftDecisionsJson?: string;
  customGiftsJson?: string;
};

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

function toProfile(record: { id: string; fields: Partial<ProfileFields> }): Profile {
  const f = record.fields;
  let favorites: Favorites = emptyFavorites;
  let giftDecisions: Record<string, GiftDecision> = {};
  let customGifts: CustomGift[] = [];
  try {
    favorites = f.favoritesJson ? { ...emptyFavorites, ...JSON.parse(f.favoritesJson) } : emptyFavorites;
  } catch {
    favorites = emptyFavorites;
  }
  try {
    giftDecisions = f.giftDecisionsJson ? JSON.parse(f.giftDecisionsJson) : {};
  } catch {
    giftDecisions = {};
  }
  try {
    customGifts = f.customGiftsJson ? JSON.parse(f.customGiftsJson) : [];
  } catch {
    customGifts = [];
  }
  let gradeOrRole: string[] = [];
  try {
    const parsed = f.gradeOrRole ? JSON.parse(f.gradeOrRole) : [];
    gradeOrRole = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    // Older records stored a plain string instead of a JSON array.
    gradeOrRole = f.gradeOrRole ? [f.gradeOrRole] : [];
  }
  return {
    recordId: record.id,
    id: f.id ?? record.id,
    school: f.school ?? "",
    category: f.category ?? "teacher",
    gradeOrRole,
    name: f.name ?? "",
    schoolEmail: f.schoolEmail ?? "",
    emailVerified: Boolean(f.emailVerified),
    birthday: f.birthday ?? "",
    favorites,
    giftDecisions,
    customGifts,
    hasPhoto: false,
  };
}

export async function listProfilesForSchool(schoolSlug: string): Promise<Profile[]> {
  const records = await listRecords<ProfileFields>(TABLE, {
    filterByFormula: `{school}='${schoolSlug.replace(/'/g, "\\'")}'`,
  });
  return records.map(toProfile).filter((p) => p.emailVerified);
}

export async function getProfileBySlugId(id: string): Promise<Profile | null> {
  const records = await listRecords<ProfileFields>(TABLE, {
    filterByFormula: `{id}='${id.replace(/'/g, "\\'")}'`,
  });
  const record = records[0];
  return record ? toProfile(record) : null;
}

export async function getProfileByRecordId(recordId: string): Promise<Profile | null> {
  const record = await getRecord<ProfileFields>(TABLE, recordId);
  return record ? toProfile(record) : null;
}

export async function getProfileBySchoolEmail(email: string): Promise<Profile | null> {
  const records = await listRecords<ProfileFields>(TABLE, {
    filterByFormula: `LOWER({schoolEmail})='${email.toLowerCase().replace(/'/g, "\\'")}'`,
  });
  const record = records[0];
  return record ? toProfile(record) : null;
}

function uid(): string {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

export async function createDraftProfile(input: {
  school: string;
  category: ProfileCategory;
  gradeOrRole: string[];
  name: string;
  schoolEmail: string;
  birthday: string;
  favorites: Favorites;
}): Promise<Profile> {
  const record = await createRecord<ProfileFields>(TABLE, {
    id: uid(),
    school: input.school,
    category: input.category,
    gradeOrRole: JSON.stringify(input.gradeOrRole),
    name: input.name,
    schoolEmail: input.schoolEmail,
    birthday: input.birthday,
    emailVerified: false,
    favoritesJson: JSON.stringify(input.favorites),
    giftDecisionsJson: "{}",
    customGiftsJson: "[]",
  });
  return toProfile(record);
}

export async function updateDraftFields(
  recordId: string,
  input: {
    school: string;
    category: ProfileCategory;
    gradeOrRole: string[];
    name: string;
    birthday: string;
    favorites: Favorites;
  }
): Promise<Profile> {
  const record = await updateRecord<ProfileFields>(TABLE, recordId, {
    school: input.school,
    category: input.category,
    gradeOrRole: JSON.stringify(input.gradeOrRole),
    name: input.name,
    birthday: input.birthday,
    favoritesJson: JSON.stringify(input.favorites),
  });
  return toProfile(record);
}

export async function markProfileVerified(recordId: string): Promise<void> {
  await updateRecord<ProfileFields>(TABLE, recordId, { emailVerified: true });
}

export async function updateGiftDecisions(
  recordId: string,
  decisions: Record<string, GiftDecision>
): Promise<void> {
  await updateRecord<ProfileFields>(TABLE, recordId, {
    giftDecisionsJson: JSON.stringify(decisions),
  });
}

export async function updateCustomGifts(recordId: string, gifts: CustomGift[]): Promise<void> {
  await updateRecord<ProfileFields>(TABLE, recordId, {
    customGiftsJson: JSON.stringify(gifts),
  });
}

export async function updateFavorites(recordId: string, favorites: Favorites): Promise<void> {
  await updateRecord<ProfileFields>(TABLE, recordId, {
    favoritesJson: JSON.stringify(favorites),
  });
}
