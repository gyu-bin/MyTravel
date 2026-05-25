import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { devApiPlugin } from "./dev-api-plugin.js";

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApiPlugin(mode)],
}));
