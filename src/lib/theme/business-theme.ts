export type BusinessVertical = "minimarket" | "clothing" | "food"

export interface BusinessVerticalOption {
  id: BusinessVertical
  name: string
  shortLabel: string
  badgeLabel: string
  tagline: string
  description: string
  hex: string
  accentName: "orange" | "emerald" | "rose"
}

export interface BusinessTheme {
  vertical: BusinessVertical
  name: string
  shortLabel: string
  badgeLabel: string
  hex: string
  // Tailwind class tokens
  primaryBg: string
  primaryHoverBg: string
  primaryText: string
  primaryBorder: string
  primaryRing: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  softBg: string
  softBorder: string
  gradientAvatar: string
  shadow: string
}

export const VERTICAL_OPTIONS: BusinessVerticalOption[] = [
  {
    id: "minimarket",
    name: "Minimercado, Almacén & Kiosco",
    shortLabel: "Minimercado",
    badgeLabel: "Minimercado",
    tagline: "Venta minorista rápida con pistola de código de barras y fiado",
    description: "Ideal para autoservicios, almacenes de barrio, kioscos, fiambrerías y verdulerías con alta rotación.",
    hex: "#FE9820",
    accentName: "orange",
  },
  {
    id: "clothing",
    name: "Ropa, Calzado & Showroom",
    shortLabel: "Indumentaria",
    badgeLabel: "Indumentaria",
    tagline: "Catálogo ágil y cobro directo de prendas, calzado y accesorios",
    description: "Pensado para tiendas de ropa, calzado, lencería y showrooms con venta rápida sin inventarios engorrosos.",
    hex: "#10B981",
    accentName: "emerald",
  },
  {
    id: "food",
    name: "Comida al paso & Rotisería",
    shortLabel: "Gastronomía",
    badgeLabel: "Gastronomía",
    tagline: "Despacho veloz por mostrador, bebidas y retiro sencillo",
    description: "Para casas de comidas, rotiserías, pizzerías al paso, hamburgueserías y cafeterías sin servicio de mesa.",
    hex: "#EF4444",
    accentName: "rose",
  },
]

export const VERTICAL_THEMES: Record<BusinessVertical, BusinessTheme> = {
  minimarket: {
    vertical: "minimarket",
    name: "Minimercado, Almacén & Kiosco",
    shortLabel: "Minimercado",
    badgeLabel: "Minimercado",
    hex: "#FE9820",
    primaryBg: "bg-[#FE9820]",
    primaryHoverBg: "hover:bg-[#FE9820]/90",
    primaryText: "text-[#FE9820]",
    primaryBorder: "border-[#FE9820]",
    primaryRing: "focus:border-[#FE9820] focus:ring-[#FE9820]",
    badgeBg: "bg-[#FE9820]/15",
    badgeText: "text-[#FE9820]",
    badgeBorder: "border-[#FE9820]/30",
    softBg: "bg-orange-50",
    softBorder: "border-orange-200",
    gradientAvatar: "from-[#FBDAA9] to-[#FE9820]",
    shadow: "shadow-orange-500/20",
  },
  clothing: {
    vertical: "clothing",
    name: "Ropa, Calzado & Showroom",
    shortLabel: "Indumentaria",
    badgeLabel: "Indumentaria",
    hex: "#10B981",
    primaryBg: "bg-emerald-600",
    primaryHoverBg: "hover:bg-emerald-700",
    primaryText: "text-emerald-600",
    primaryBorder: "border-emerald-600",
    primaryRing: "focus:border-emerald-600 focus:ring-emerald-600",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-500/30",
    softBg: "bg-emerald-50",
    softBorder: "border-emerald-200",
    gradientAvatar: "from-emerald-300 to-emerald-600",
    shadow: "shadow-emerald-500/20",
  },
  food: {
    vertical: "food",
    name: "Comida al paso & Rotisería",
    shortLabel: "Gastronomía",
    badgeLabel: "Gastronomía",
    hex: "#EF4444",
    primaryBg: "bg-rose-600",
    primaryHoverBg: "hover:bg-rose-700",
    primaryText: "text-rose-600",
    primaryBorder: "border-rose-600",
    primaryRing: "focus:border-rose-600 focus:ring-rose-600",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-500/30",
    softBg: "bg-rose-50",
    softBorder: "border-rose-200",
    gradientAvatar: "from-rose-300 to-rose-600",
    shadow: "shadow-rose-500/20",
  },
}

export function resolveBusinessVertical(industry?: string | null): BusinessVertical {
  if (!industry) return "minimarket"
  const normalized = industry.toLowerCase().trim()

  if (
    normalized.includes("ropa") ||
    normalized.includes("indumentaria") ||
    normalized.includes("calzado") ||
    normalized.includes("moda") ||
    normalized.includes("showroom") ||
    normalized.includes("clothing")
  ) {
    return "clothing"
  }

  if (
    normalized.includes("comida") ||
    normalized.includes("rotiser") ||
    normalized.includes("restauran") ||
    normalized.includes("cafeter") ||
    normalized.includes("bar") ||
    normalized.includes("takeaway") ||
    normalized.includes("take away") ||
    normalized.includes("gastronom") ||
    normalized.includes("food") ||
    normalized.includes("pizz") ||
    normalized.includes("empanad")
  ) {
    return "food"
  }

  return "minimarket"
}

export function getBusinessTheme(industry?: string | null): BusinessTheme {
  const vertical = resolveBusinessVertical(industry)
  return VERTICAL_THEMES[vertical]
}
