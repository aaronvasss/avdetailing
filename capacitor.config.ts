import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.5268592bbe3a43028986c547b2ca2e04",
  appName: "avdetailing",
  webDir: "dist",
  server: {
    url: "https://5268592b-be3a-4302-8986-c547b2ca2e04.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    BackgroundGeolocation: {
      // android-only: persistent foreground notification copy
    },
  },
};

export default config;
