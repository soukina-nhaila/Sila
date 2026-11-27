export function toast(msg: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sila-toast", { detail: msg }));
}
export function cartChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sila-cart"));
}
