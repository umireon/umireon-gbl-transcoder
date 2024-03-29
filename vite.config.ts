import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "app.html"),
        edit: resolve(__dirname, "edit.html"),
        index: resolve(__dirname, "index.html"),
        privacypolicy: resolve(__dirname, "privacypolicy.html"),
        termsofservice: resolve(__dirname, "termsofservice.html"),
      },
      output: {
        manualChunks: {
          firebasecompat: ["firebase/compat/app"],
        },
      },
    },
  },
  plugins: [svelte()],
});
