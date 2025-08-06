// Firebase bootstrap for React Native Firebase
// Ensure platform setup is complete:
// - Android: add android/build.gradle and android/app/build.gradle config per https://rnfirebase.io/
// - Place android/app/google-services.json
// - iOS: add ios/GoogleService-Info.plist and run pod install

import app from '@react-native-firebase/app';

// If you need to pass manual options (not typical for RNFirebase when using google-services files):
// const firebaseConfig = { apiKey: '', projectId: '', appId: '', messagingSenderId: '', storageBucket: '' };
// if (!app.apps.length) app.initializeApp(firebaseConfig);

export function ensureFirebase() {
  // Accessing default app will initialize using native configs if present.
  return app.app();
}