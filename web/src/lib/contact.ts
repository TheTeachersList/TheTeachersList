import { createRecord } from "./airtable";

const TABLE = "Contact Messages";

type ContactFields = {
  name: string;
  email: string;
  message: string;
};

export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await createRecord<ContactFields>(TABLE, {
    name: input.name,
    email: input.email,
    message: input.message,
  });
}
