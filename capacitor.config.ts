import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.perilab.todaydate',
  appName: 'Today Date',
  webDir: 'public',
  server: {
    url: 'https://today-date-seven.vercel.app',
    cleartext: false
  }
};

export default config;
