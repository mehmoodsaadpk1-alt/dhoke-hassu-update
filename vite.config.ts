import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

// Dynamically write VITE_ and NEXT_PUBLIC_ env variables from system process.env to a .env file for Vite client bundling
const viteEnvKeys = Object.keys(process.env).filter(key => key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_'));
if (viteEnvKeys.length > 0) {
  const envContent = viteEnvKeys.map(key => `${key}="${process.env[key]}"`).join('\n');
  const envPath = path.resolve(__dirname, '.env');
  let currentContent = '';
  try {
    currentContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    // File doesn't exist yet
  }
  
  if (currentContent !== envContent) {
    fs.writeFileSync(envPath, envContent);
    console.log('Successfully generated .env from process.env keys:', viteEnvKeys);
  }
}
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['lucide-react'],
            'vendor-motion': ['motion']
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
// Force Vite restart 
