import { createRecord, deleteRecord, listRecords } from "./airtable";
import type { Claim } from "./types";

const TABLE = "Claims";

type ClaimFields = {
  Name: string;
  personId: string;
  giftKey: string;
  claimedBy: string;
};

function toClaim(record: { id: string; fields: Partial<ClaimFields> }): Claim {
  const f = record.fields;
  return {
    recordId: record.id,
    personId: f.personId ?? "",
    giftKey: f.giftKey ?? "",
    claimedBy: f.claimedBy ?? "",
  };
}

export async function listClaimsForPerson(personId: string): Promise<Claim[]> {
  const records = await listRecords<ClaimFields>(TABLE, {
    filterByFormula: `{personId}='${personId.replace(/'/g, "\\'")}'`,
  });
  return records.map(toClaim);
}

export async function createClaim(
  personId: string,
  giftKey: string,
  claimedBy: string
): Promise<Claim> {
  const record = await createRecord<ClaimFields>(TABLE, {
    Name: `${claimedBy} — ${giftKey}`,
    personId,
    giftKey,
    claimedBy,
  });
  return toClaim(record);
}

export async function deleteClaim(recordId: string): Promise<void> {
  await deleteRecord(TABLE, recordId);
}

export function giftKeyFor(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^\w-]/g, "");
}
