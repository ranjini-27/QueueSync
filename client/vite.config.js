import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard CSS only in this project — no Tailwind/PostCSS pipeline needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
