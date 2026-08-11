const AMAZON_ASSOCIATE_TAG = "theteacher0db-20";
const AMAZON_HOST_PATTERN = /(^|\.)amazon\.[a-z.]+$/i;

/**
 * Rewrites any amazon.* link to carry the site's Associates tag, overwriting
 * a pre-existing tag if the link already had one. Non-Amazon links, and
 * malformed URLs, pass through untouched.
 */
export function withAffiliateTag(url: string): string {
  if (!url) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!AMAZON_HOST_PATTERN.test(parsed.hostname)) return url;
  parsed.searchParams.set("tag", AMAZON_ASSOCIATE_TAG);
  return parsed.toString();
}
