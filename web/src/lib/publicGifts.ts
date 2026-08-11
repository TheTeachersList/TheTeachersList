import { withAffiliateTag } from "./affiliate";
import { listClaimsForPerson } from "./claims";
import { listGiftCatalog, suggestGifts } from "./gifts";
import type { Profile } from "./types";

export type DisplayGift = {
  key: string;
  name: string;
  blurb: string;
  price: string;
  link: string;
  source: "catalog" | "custom";
  topPick: boolean;
  claimedBy: string | null;
  claimRecordId: string | null;
};

export async function getPublicGiftsForProfile(profile: Profile): Promise<DisplayGift[]> {
  const catalog = await listGiftCatalog();
  const suggestions = suggestGifts(catalog, profile.favorites, 20);

  const approvedCatalogGifts: DisplayGift[] = suggestions
    .filter((s) => profile.giftDecisions[s.recordId] === "approved")
    .slice(0, 8)
    .map((s, i) => ({
      key: s.recordId,
      name: s.name,
      blurb: s.blurb,
      price: s.priceRange,
      link: withAffiliateTag(s.link),
      source: "catalog" as const,
      topPick: i < 2 && s.score >= 2,
      claimedBy: null,
      claimRecordId: null,
    }));

  const customGiftEntries: DisplayGift[] = profile.customGifts.map((g) => ({
    key: g.id,
    name: g.name,
    blurb: g.note,
    price: g.price,
    link: withAffiliateTag(g.link),
    source: "custom" as const,
    topPick: false,
    claimedBy: null,
    claimRecordId: null,
  }));

  const gifts = [...approvedCatalogGifts, ...customGiftEntries];

  const claims = await listClaimsForPerson(profile.id);
  const claimByKey = new Map(claims.map((c) => [c.giftKey, c]));
  return gifts.map((g) => {
    const claim = claimByKey.get(g.key);
    return claim ? { ...g, claimedBy: claim.claimedBy, claimRecordId: claim.recordId } : g;
  });
}
