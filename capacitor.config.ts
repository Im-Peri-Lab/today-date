import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.perilab.todaydate',
  appName: 'Today Date',
  webDir: 'public',
  server: {
    url: 'https://today-date-seven.vercel.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      // JS(NativeBootOverlay)가 SplashScreen.hide() 를 호출할 때까지 네이티브 스플래시 유지
      launchAutoHide: false,
      backgroundColor: '#f5f3ff',
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
