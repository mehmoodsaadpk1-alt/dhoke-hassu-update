import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

// Dynamically write VITE_ and NEXT_PUBLIC_ env variables from system process.env to a .env file for Vite client bundling
const viteEnvKeys = Object.keys(process.env).filter(key => key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_'));
if (viteEnvKeys.length > 0) {
  const envContent = viteEnvKeys.map(key => `${key}="${process.env[key]}"`).join('\n');
  fs.writeFileSync(path.resolve(__dirname, '.env'), envContent);
  console.log('Successfully generated .env from process.env keys:', viteEnvKeys);
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
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
