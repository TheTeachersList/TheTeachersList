export type SchoolLevel = "Public" | "Charter" | "Private";

export type School = {
  recordId: string;
  id: string;
  name: string;
  city: string;
  parish: string;
  level: SchoolLevel | "";
  domain: string;
  grades: string[];
};

export type ProfileCategory = "teacher" | "staff";

export type Favorites = {
  color: string;
  treat: string;
  drink: string;
  scent: string;
  hobbies: string[];
  store: string;
  restaurant: string;
  flower: string;
  sportsTeam: string;
  shirtSize: string;
  avoid: string;
  wishlist: string;
};

export type GiftDecision = "approved" | "declined" | "pending";

export type CustomGift = {
  id: string;
  name: string;
  link: string;
  price: string;
  note: string;
};

export type Profile = {
  recordId: string;
  id: string;
  school: string;
  category: ProfileCategory;
  gradeOrRole: string[];
  name: string;
  schoolEmail: string;
  emailVerified: boolean;
  birthday: string;
  favorites: Favorites;
  giftDecisions: Record<string, GiftDecision>;
  customGifts: CustomGift[];
  hasPhoto: boolean;
};

export type GiftCatalogItem = {
  recordId: string;
  name: string;
  blurb: string;
  priceRange: string;
  link: string;
  sizable: boolean;
  tags: {
    color?: string;
    treat?: string;
    drink?: string;
    scent?: string;
    hobby?: string;
    store?: string;
    restaurant?: string;
    flower?: string;
    sportsTeam?: string;
  };
};

export type SuggestedGift = GiftCatalogItem & { score: number };

export type Claim = {
  recordId: string;
  personId: string;
  giftKey: string;
  claimedBy: string;
};

export const COLORS = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Teal",
  "Blue",
  "Purple",
  "Pink",
  "Black / Neutral",
];
export const TREATS = [
  "Chocolate",
  "Sweet & Fruity",
  "Salty & Crunchy",
  "Baked Goods",
  "Healthy Snacks",
];
export const DRINKS = ["Coffee", "Tea", "Soda", "Wine", "Sparkling Water"];
export const SCENTS = [
  "Vanilla",
  "Citrus",
  "Floral",
  "Fresh Linen",
  "Spiced / Warm",
  "Unscented",
];
export const HOBBIES = [
  "Reading",
  "Cooking / Baking",
  "Gardening",
  "Crafting / DIY",
  "Fitness / Yoga",
  "Travel",
  "Coffee & Tea Culture",
  "Home Decor",
];
export const STORES = [
  "Target",
  "Amazon",
  "Starbucks",
  "Trader Joe's",
  "Local Bookstore",
  "Ulta / Sephora",
  "HomeGoods / TJ Maxx",
];
export const RESTAURANTS = [
  "Chick-fil-A",
  "Raising Cane's",
  "Olive Garden",
  "Chili's",
  "Whataburger",
  "Panera Bread",
  "Local Cajun / Creole Spot",
];
export const FLOWERS = [
  "Roses",
  "Sunflowers",
  "Tulips",
  "Daisies",
  "Lilies",
  "Hydrangeas",
  "Orchids",
];
export const SPORTS_TEAMS = [
  "LSU Tigers",
  "New Orleans Saints",
  "New Orleans Pelicans",
  "Tulane Green Wave",
  "ULL Ragin' Cajuns",
  "Southern University Jaguars",
  "Grambling State Tigers",
];
export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
export const STAFF_ROLES = [
  "Librarian",
  "School Counselor",
  "Art Teacher",
  "Music Teacher",
  "PE Teacher",
  "School Nurse",
  "Front Office",
  "Custodian",
  "Cafeteria Staff",
];
