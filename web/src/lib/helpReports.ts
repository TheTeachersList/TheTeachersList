import { createRecord, updateRecord } from "./airtable";

const TABLE = "Help Reports";

type HelpReportFields = {
  email: string;
  description: string;
  pageUrl: string;
  Status: "New" | "Resolved";
  emailSent: boolean;
};

export async function submitHelpReport(input: {
  email: string;
  description: string;
  pageUrl: string;
}): Promise<string> {
  const record = await createRecord<HelpReportFields>(TABLE, {
    email: input.email,
    description: input.description,
    pageUrl: input.pageUrl,
    Status: "New",
    emailSent: false,
  });
  return record.id;
}

export async function markHelpReportEmailSent(recordId: string): Promise<void> {
  await updateRecord<HelpReportFields>(TABLE, recordId, { emailSent: true });
}
