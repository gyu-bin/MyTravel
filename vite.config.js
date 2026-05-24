import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function ogImageAbsoluteUrl() {
  return {
    name: "og-image-absolute-url",
    transformIndexHtml(html) {
      const siteUrl = process.env.VITE_SITE_URL?.replace(/\/$/, "");
      if (!siteUrl) return html;
      const ogImage = `${siteUrl}/og-image.png`;
      return html
        .replace(
          'property="og:image" content="/og-image.png"',
          `property="og:image" content="${ogImage}"`
        )
        .replace(
          'name="twitter:image" content="/og-image.png"',
          `name="twitter:image" content="${ogImage}"`
        )
        .replace(
          'property="og:url" content=""',
          `property="og:url" content="${siteUrl}"`
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), ogImageAbsoluteUrl()],
});
