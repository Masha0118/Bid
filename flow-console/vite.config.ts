import { defineConfig } from "vite";

const configuredBase = process.env.VITE_BASE_PATH ?? "/";
const base = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;

export default defineConfig({
  base,
});
