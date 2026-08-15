export function isSchoolEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (domain.endsWith(".edu") || domain.endsWith(".org")) return true;
  if (/\.k12\.[a-z]+\.us$/.test(domain)) return true;
  return false;
}
