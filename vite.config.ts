import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{output:{manualChunks:{maps:['leaflet'],xml:['fast-xml-parser']}}}}});
