import { listRecords } from "./airtable";
import type { Favorites, GiftCatalogItem, SuggestedGift } from "./types";

const TABLE = "GiftCatalog";

type GiftCatalogFields = {
  Name: string;
  Blurb?: string;
  PriceRange?: string;
  Link?: string;
  Tag_Color?: string;
  Tag_Treat?: string;
  Tag_Drink?: string;
  Tag_Scent?: string;
  Tag_Hobby?: string;
  Tag_Store?: string;
  Tag_Restaurant?: string;
  Tag_Flower?: string;
  Tag_SportsTeam?: string;
  Sizable?: boolean;
  Active?: boolean;
};

function toGift(record: { id: string; fields: Partial<GiftCatalogFields> }): GiftCatalogItem {
  const f = record.fields;
  return {
    recordId: record.id,
    name: f.Name ?? "Gift idea",
    blurb: f.Blurb ?? "",
    priceRange: f.PriceRange ?? "",
    link: f.Link ?? "",
    sizable: Boolean(f.Sizable),
    tags: {
      color: f.Tag_Color,
      treat: f.Tag_Treat,
      drink: f.Tag_Drink,
      scent: f.Tag_Scent,
      hobby: f.Tag_Hobby,
      store: f.Tag_Store,
      restaurant: f.Tag_Restaurant,
      flower: f.Tag_Flower,
      sportsTeam: f.Tag_SportsTeam,
    },
  };
}

export async function listGiftCatalog(): Promise<GiftCatalogItem[]> {
  const records = await listRecords<GiftCatalogFields>(TABLE, {
    filterByFormula: "{Active}=1",
  });
  return records.map(toGift);
}

function scoreGift(gift: GiftCatalogItem, favorites: Favorites): number {
  let score = 0;
  if (gift.tags.color && gift.tags.color === favorites.color) score += 1;
  if (gift.tags.treat && gift.tags.treat === favorites.treat) score += 2;
  if (gift.tags.drink && gift.tags.drink === favorites.drink) score += 2;
  if (gift.tags.scent && gift.tags.scent === favorites.scent) score += 2;
  if (gift.tags.store && gift.tags.store === favorites.store) score += 2;
  if (gift.tags.restaurant && gift.tags.restaurant === favorites.restaurant) score += 2;
  if (gift.tags.flower && gift.tags.flower === favorites.flower) score += 2;
  if (gift.tags.sportsTeam && gift.tags.sportsTeam === favorites.sportsTeam) score += 2;
  if (gift.tags.hobby && (favorites.hobbies ?? []).includes(gift.tags.hobby)) score += 1.5;
  if (gift.sizable && favorites.shirtSize) score += 1;
  return score;
}

export function suggestGifts(
  catalog: GiftCatalogItem[],
  favorites: Favorites,
  limit = 8
): SuggestedGift[] {
  return catalog
    .map((gift) => ({ ...gift, score: scoreGift(gift, favorites) }))
    .filter((gift) => gift.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
