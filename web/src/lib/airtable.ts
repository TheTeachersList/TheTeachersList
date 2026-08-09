const API_BASE = "https://api.airtable.com/v0";

export type AirtableRecord<F = Record<string, unknown>> = {
  id: string;
  createdTime: string;
  fields: F;
};

function baseId(): string {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID is not configured");
  return id;
}

function apiKey(): string {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY is not configured");
  return key;
}

export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

function headers() {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
}

export async function listRecords<F = Record<string, unknown>>(
  table: string,
  options: { filterByFormula?: string; sort?: { field: string; direction?: "asc" | "desc" }[] } = {}
): Promise<AirtableRecord<F>[]> {
  const records: AirtableRecord<F>[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    if (options.filterByFormula) params.set("filterByFormula", options.filterByFormula);
    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction ?? "asc");
      });
    }
    if (offset) params.set("offset", offset);
    const res = await fetch(`${API_BASE}/${baseId()}/${encodeURIComponent(table)}?${params.toString()}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Airtable list ${table} failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return records;
}

export async function getRecord<F = Record<string, unknown>>(
  table: string,
  recordId: string
): Promise<AirtableRecord<F> | null> {
  const res = await fetch(`${API_BASE}/${baseId()}/${encodeURIComponent(table)}/${recordId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Airtable get ${table}/${recordId} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function createRecord<F = Record<string, unknown>>(
  table: string,
  fields: Partial<F>
): Promise<AirtableRecord<F>> {
  const res = await fetch(`${API_BASE}/${baseId()}/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Airtable create ${table} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function updateRecord<F = Record<string, unknown>>(
  table: string,
  recordId: string,
  fields: Partial<F>
): Promise<AirtableRecord<F>> {
  const res = await fetch(`${API_BASE}/${baseId()}/${encodeURIComponent(table)}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Airtable update ${table}/${recordId} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function deleteRecord(table: string, recordId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${baseId()}/${encodeURIComponent(table)}/${recordId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Airtable delete ${table}/${recordId} failed: ${res.status} ${await res.text()}`);
  }
}
