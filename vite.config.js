import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue()],
  define: {
    "process.env": {},
  },
  server: {
    proxy: {
      "/api/music": {
        target: "https://www.hhlqilongzhu.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/music/, ""),
      },
    },
  },
});
