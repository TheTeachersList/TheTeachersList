import { createRecord, deleteRecord, listRecords, updateRecord } from "./airtable";

const TABLE = "PendingVerifications";
const CODE_TTL_MINUTES = 10;

type VerificationFields = {
  email: string;
  code: string;
  expiresAt: string;
};

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueCode(email: string): Promise<string> {
  const code = genCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
  const normalized = email.toLowerCase().trim();
  const existing = await listRecords<VerificationFields>(TABLE, {
    filterByFormula: `LOWER({email})='${normalized.replace(/'/g, "\\'")}'`,
  });
  if (existing[0]) {
    await updateRecord<VerificationFields>(TABLE, existing[0].id, { code, expiresAt });
  } else {
    await createRecord<VerificationFields>(TABLE, { email: normalized, code, expiresAt });
  }
  return code;
}

export async function checkCode(email: string, code: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const existing = await listRecords<VerificationFields>(TABLE, {
    filterByFormula: `LOWER({email})='${normalized.replace(/'/g, "\\'")}'`,
  });
  const record = existing[0];
  if (!record) return false;
  const notExpired = new Date(record.fields.expiresAt).getTime() > Date.now();
  const matches = record.fields.code === code.trim();
  if (matches && notExpired) {
    await deleteRecord(TABLE, record.id);
    return true;
  }
  return false;
}
