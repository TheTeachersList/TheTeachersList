import { createRecord, listRecords } from "./airtable";
import type { School, SchoolLevel } from "./types";

const TABLE = "Schools";

type SchoolFields = {
  Name: string;
  name: string;
  city: string;
  domain?: string;
  gradesJson: string;
  id: string;
  Level?: SchoolLevel;
  Parish?: string;
};

function toSchool(record: { id: string; fields: Partial<SchoolFields> }): School {
  const f = record.fields;
  let grades: string[] = [];
  try {
    grades = f.gradesJson ? JSON.parse(f.gradesJson) : [];
  } catch {
    grades = [];
  }
  return {
    recordId: record.id,
    id: f.id ?? record.id,
    name: f.name ?? f.Name ?? "Untitled School",
    city: f.city ?? "",
    parish: f.Parish ?? "",
    level: f.Level ?? "",
    domain: f.domain ?? "",
    grades,
  };
}

export async function listSchools(): Promise<School[]> {
  const records = await listRecords<SchoolFields>(TABLE, {
    sort: [{ field: "name", direction: "asc" }],
  });
  return records.map(toSchool);
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const records = await listRecords<SchoolFields>(TABLE, {
    filterByFormula: `{id}='${slug.replace(/'/g, "\\'")}'`,
  });
  const record = records[0];
  return record ? toSchool(record) : null;
}

function slugify(name: string, city: string): string {
  const base = `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function createSchool(input: {
  name: string;
  city: string;
  parish: string;
  level: SchoolLevel;
  grades: string[];
}): Promise<School> {
  const id = slugify(input.name, input.city);
  const record = await createRecord<SchoolFields>(TABLE, {
    Name: input.name,
    name: input.name,
    city: input.city,
    Parish: input.parish,
    Level: input.level,
    id,
    gradesJson: JSON.stringify(input.grades),
  });
  return toSchool(record);
}
