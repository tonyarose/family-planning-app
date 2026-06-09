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
    "practice", "game", "recital", "playdate", "pickup", "dropoff", "tutor",
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
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800",
    text: "text-green-700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    text: "text-blue-700",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800",
    text: "text-yellow-700",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800",
    text: "text-purple-700",
  },
};
