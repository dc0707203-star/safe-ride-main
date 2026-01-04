import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.44ed9b52d14b40fc9e5c9ac67d4d5037',
  appName: 'safe-ride-isu',
  webDir: 'dist',
  server: {
    url: 'https://44ed9b52-d14b-40fc-9e5c-9ac67d4d5037.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // Background mode plugin config will go here
  }
};

export default config;
