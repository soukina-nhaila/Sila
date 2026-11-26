export type Lang = "fr" | "en";
const dict: Record<string, Record<Lang, string>> = {
  shop: { fr: "Boutique", en: "Shop" }, eat: { fr: "Restaurants", en: "Eat" },
  cart: { fr: "Panier", en: "Cart" }, orders: { fr: "Commandes", en: "Orders" },
  login: { fr: "Connexion", en: "Login" }, register: { fr: "Inscription", en: "Sign up" },
  logout: { fr: "Déconnexion", en: "Logout" }, dashboard: { fr: "Espace pro", en: "Dashboard" },
  search: { fr: "Rechercher un produit…", en: "Search products…" },
  slogan: { fr: "Shop. Eat. Discover.", en: "Shop. Eat. Discover." },
  featured: { fr: "Produits en vedette", en: "Featured products" },
  popular: { fr: "Restaurants populaires", en: "Popular restaurants" },
  add: { fr: "Ajouter au panier", en: "Add to cart" },
};
export const t = (k: string, l: Lang) => dict[k]?.[l] ?? k;
// Architecture prête pour l'arabe : ajouter "ar" à Lang, aux entrées du dictionnaire, et dir="rtl" sur <html>.
