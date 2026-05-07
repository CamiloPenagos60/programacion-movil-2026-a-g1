import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.attendance.academic",
  appName: "Academic Attendance",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;

