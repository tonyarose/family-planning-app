export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "house-projects",
    name: "House Projects",
    description: "Home improvement, repairs, contractors, and yard work",
    icon: "🏠",
    color: "green",
  },
  {
    slug: "noah",
    name: "Noah",
    description: "School, camps, activities, appointments, and everything Noah",
    icon: "⭐",
    color: "blue",
  },
  {
    slug: "financial-planning",
    name: "Financial Planning",
    description: "Budgets, investments, goals, and financial documents",
    icon: "💰",
    color: "yellow",
  },
  {
    slug: "vacations",
    name: "Vacations",
    description: "Trip planning, itineraries, bookings, and wishlists",
    icon: "✈️",
    color: "purple",
  },
];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "house-projects": [
    "contractor", "repair", "renovation", "plumber", "electrician", "hvac",
    "roof", "roofing", "landscap", "lawn", "yard", "garden", "fence", "deck",
    "paint", "flooring", "tile", "inspection", "permit", "handyman", "install",
    "home depot", "hardware", "remodel", "construction", "foundation",
    "gutter", "drywall", "carpet", "window", "door", "garage", "home",
  ],
  "noah": [
    "noah", "camp", "school", "pediatrician", "dentist", "orthodontist",
    "practice", "game", "recital", "playdate", "tutor",
    "sleepover", "field trip", "parent teacher", "conference", "registration",
  ],
  "financial-planning": [
    "financial", "advisor", "budget", "tax", "taxes", "irs", "accountant", "cpa",
    "investment", "401k", "ira", "roth", "mortgage", "loan", "refinance", "bank",
    "credit union", "stocks", "portfolio", "retirement", "estate", "trust",
    "net worth", "savings", "debt", "credit", "fidelity", "vanguard", "schwab",
  ],
  "vacations": [
    "vacation", "trip", "travel", "flight", "airline", "hotel", "airbnb", "vrbo",
    "resort", "cruise", "passport", "visa", "itinerary", "tour", "booking",
    "reservation", "check-in", "checkout", "airport", "departure", "arrival",
    "road trip", "staycation", "disney", "universal", "expedia", "kayak",
  ],
};

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  green: {
    bg: "bg-[#eef3ef]",
    border: "border-[#c8daca]",
    badge: "bg-[#dde9de] text-[#2f5e35]",
    text: "text-[#2f5e35]",
  },
  blue: {
    bg: "bg-[#eaeff8]",
    border: "border-[#bdd0ef]",
    badge: "bg-[#d4e0f4] text-[#1e3d6b]",
    text: "text-[#1e3d6b]",
  },
  yellow: {
    bg: "bg-[#f7f0e4]",
    border: "border-[#e5cfaa]",
    badge: "bg-[#f0e2c8] text-[#6b4f15]",
    text: "text-[#6b4f15]",
  },
  purple: {
    bg: "bg-[#f0ecf8]",
    border: "border-[#cfc3ec]",
    badge: "bg-[#e2d8f4] text-[#4a2f82]",
    text: "text-[#4a2f82]",
  },
};
