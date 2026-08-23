/**
 * Applies the employee-only PWA identity to the document head:
 * manifest, Apple touch icons, app title and theme color.
 * This ensures the installed icon and app preview are the employee ones,
 * never the chef/canteen app branding.
 */
export function applyDipendenteHead() {
  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) manifest.setAttribute("href", "/manifest-dipendente.webmanifest");

  // Replace every apple-touch-icon with the employee icon (iOS home screen)
  document.querySelectorAll('link[rel="apple-touch-icon"]').forEach((el) => el.remove());
  const appleIcon = document.createElement("link");
  appleIcon.rel = "apple-touch-icon";
  appleIcon.setAttribute("sizes", "180x180");
  appleIcon.href = "/apple-touch-icon-dipendente.png";
  document.head.appendChild(appleIcon);

  // Favicon / tab preview
  document.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/png";
  icon.href = "/pwa-dipendente-192.png";
  document.head.appendChild(icon);

  const setMeta = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  setMeta("apple-mobile-web-app-title", "Dipendente");
  setMeta("application-name", "MealLink Dipendente");
  setMeta("theme-color", "#16a34a");
}
