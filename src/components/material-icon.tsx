const LEGACY_ICON_ALIASES: Record<string, string> = {
  "ellipsis-horizontal": "more_horiz",
  "trending-up": "trending_up",
  "bag-handle": "shopping_bag",
  briefcase: "work",
  basket: "shopping_basket",
  body: "spa",
  medkit: "medical_services",
  film: "movie",
  car: "directions_car",
  airplane: "flight",
  flash: "bolt",
  gift: "card_giftcard",
  wallet: "account_balance_wallet",
  "card-outline": "credit_card",
};

const SAFE_FALLBACK_ICON = "category";
const KNOWN_ICON_NAMES = new Set<string>([
  "account_balance",
  "account_balance_wallet",
  "add",
  "add_a_photo",
  "add_circle",
  "add_photo_alternate",
  "arrow_back",
  "bar_chart",
  "bolt",
  "card_giftcard",
  "category",
  "chevron_right",
  "child_care",
  "close",
  "credit_card",
  "dashboard",
  "directions_car",
  "edit",
  "edit_note",
  "flight",
  "help_outline",
  "hide_image",
  "home",
  "laptop_mac",
  "local_cafe",
  "local_gas_station",
  "lock",
  "logout",
  "mail",
  "medical_services",
  "menu",
  "more_horiz",
  "movie",
  "notifications",
  "payments",
  "person",
  "pets",
  "photo_library",
  "real_estate_agent",
  "receipt",
  "receipt_long",
  "redeem",
  "restaurant",
  "school",
  "sell",
  "settings",
  "shield",
  "shopping_bag",
  "shopping_basket",
  "spa",
  "storefront",
  "subscriptions",
  "swap_horiz",
  "track_changes",
  "trending_up",
  "tune",
  "undo",
  "visibility",
  "visibility_off",
  "volunteer_activism",
  "work",
  "yard",
]);

function resolveMaterialIconName(name: string) {
  const raw = name.trim().toLowerCase();
  if (!raw) return SAFE_FALLBACK_ICON;
  const mapped = LEGACY_ICON_ALIASES[raw] ?? raw.replace(/[\s-]+/g, "_");
  return KNOWN_ICON_NAMES.has(mapped) ? mapped : SAFE_FALLBACK_ICON;
}

export function MaterialIcon({
  name,
  className = "",
  filled,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
          : undefined
      }
    >
      {resolveMaterialIconName(name)}
    </span>
  );
}
