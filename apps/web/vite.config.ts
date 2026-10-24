import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Automatic chunk splitting preserves route-level lazy imports; avoid a single giant vendor bundle.
export default defineConfig({ plugins: [react()], base:'/krishigo/', build:{ target:'es2022', cssCodeSplit:true, sourcemap:false } });
