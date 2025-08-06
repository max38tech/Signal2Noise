# Signal2Noise — MVP (React Native + Firebase + Vertex AI)

This repository now includes the Phase 2 MVP mobile application for Signal2Noise. The app enables:
- Email/password authentication
- Real-time task list from Firestore
- Voice capture with a mic button (react-native-voice)
- Backend AI processing via a Cloud Function (Vertex AI Gemini), turning speech into structured tasks
- Placeholder hooks for Text-to-Speech (TTS) playback

Phase 1 (foundation) deliverables remain:
- [firestore.rules](firestore.rules)
- [src/backend/data-models.js](src/backend/data-models.js)
- [scripts/enable_apis.sh](scripts/enable_apis.sh)

New MVP app deliverables:
- App entry: [App.js](App.js)
- Contexts: [src/context/AuthContext.js](src/context/AuthContext.js), [src/context/TaskContext.js](src/context/TaskContext.js)
- Services: [src/services/firebase.js](src/services/firebase.js), [src/services/api.js](src/services/api.js)
- Screens: [src/screens/LoginScreen.js](src/screens/LoginScreen.js), [src/screens/SignUpScreen.js](src/screens/SignUpScreen.js), [src/screens/TaskListScreen.js](src/screens/TaskListScreen.js)
- Component: [src/components/NovaButton.js](src/components/NovaButton.js)
- Cloud Function: [functions/index.js](functions/index.js), [functions/package.json](functions/package.json)

Note on security: direct calls to Google Cloud STT/TTS from the device are intentionally not implemented here to avoid exposing credentials. Route these via secure backend endpoints if needed.

---

## Prerequisites

- Node.js 20.x LTS
- Watchman (macOS), JDK 17+ (Android)
- React Native environment set up (Android Studio / Xcode)
- Firebase project created and configured
- Google Cloud project with APIs enabled:
  - Speech-to-Text (speech.googleapis.com)
  - Text-to-Speech (texttospeech.googleapis.com)
  - Vertex AI (aiplatform.googleapis.com)

Enable APIs with:
./scripts/enable_apis.sh YOUR_GCP_PROJECT_ID

---

## Firebase setup in React Native

1) Install packages
npm install

2) Add native config files
- Android: place google-services.json at android/app/google-services.json
- iOS: place GoogleService-Info.plist at ios/GoogleService-Info.plist and run:
  cd ios && pod install && cd ..

3) React Native Firebase native setup
Follow: https://rnfirebase.io/ to update android/build.gradle and android/app/build.gradle
- Add classpath for com.google.gms:google-services at project level
- Apply plugin com.google.gms.google-services in app module

4) Ensure Firestore rules are deployed
firebase deploy --only firestore:rules

---

## Cloud Function: processTaskText

1) Install function deps
npm run functions:install

2) Configure environment (optional but recommended)
- Default region: us-central1 (override FUNCTIONS_REGION)
- Model: gemini-1.5-flash (override VERTEX_MODEL)
- Location: us-central1 (override VERTEX_LOCATION)
You can set env in Firebase Functions config or via environment variables on deploy.

3) Deploy function
firebase deploy --only functions:processTaskText

The HTTPS URL will be shown after deploy. Copy that URL and set it in the app at:
[src/services/api.js](src/services/api.js)

Replace the placeholder:
const API_BASE = 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/processTaskText';

Tip: For local testing with Firebase Emulator, use the emulator URL and configure CORS accordingly.

---

## Running the app

Android:
npm run android

iOS (macOS):
npm run ios

Always start the Metro bundler if needed:
npm start

---

## Voice Capture and Nova Flow

1) Tap the big mic button (NovaButton) to start recording.
2) The app uses react-native-voice to capture speech and produce a transcript.
3) The transcript is sent to the processTaskText Cloud Function, which prompts Vertex AI Gemini to extract:
   - taskName
   - priority (Top, Medium, Low)
   - dueDate (YYYY-MM-DD)
   - followUpQuestion (null if complete)
4) If followUpQuestion is null, the app writes a new task document to Firestore:
   - Collection: users/{userId}/tasks
   - Uses template fields from [src/backend/data-models.js](src/backend/data-models.js)
5) If a follow-up is required, an alert is shown as a placeholder for TTS playback. You can extend this by:
   - Implementing a backend route to call Google Cloud TTS
   - Downloading/streaming the audio to the device
   - Playing audio using react-native-track-player
   - Re-activating the mic to capture the follow-up answer

---

## Libraries in use

- @react-native-firebase/app, auth, firestore
- @react-navigation/native and native-stack
- react-native-voice for voice input
- react-native-track-player for audio output (scaffolded, used minimally)
- axios for HTTP calls
- Firebase Cloud Functions for Vertex AI invocation

---

## Project structure (key files)

- App shell: [App.js](App.js)
- Auth state: [src/context/AuthContext.js](src/context/AuthContext.js)
- Task stream: [src/context/TaskContext.js](src/context/TaskContext.js)
- Firebase bootstrap: [src/services/firebase.js](src/services/firebase.js)
- API client: [src/services/api.js](src/services/api.js)
- Screens:
  - [src/screens/LoginScreen.js](src/screens/LoginScreen.js)
  - [src/screens/SignUpScreen.js](src/screens/SignUpScreen.js)
  - [src/screens/TaskListScreen.js](src/screens/TaskListScreen.js)
- Nova Button: [src/components/NovaButton.js](src/components/NovaButton.js)
- Cloud Function:
  - [functions/index.js](functions/index.js)
  - [functions/package.json](functions/package.json)

---

## Notes and TODOs

- Provide the Firebase config files for each platform as described.
- Replace API_BASE in [src/services/api.js](src/services/api.js) with the deployed function URL.
- Consider adding an authenticated callable function instead of a public HTTPS function:
  - Use onCall, validate Firebase ID token, and lock down CORS further.
- Implement secure backend routes for STT and TTS if needed by your UX.
- App permissions:
  - Android: add RECORD_AUDIO permission to AndroidManifest.xml and request runtime permission.
  - iOS: add NSMicrophoneUsageDescription in Info.plist.

---

## Phase 2 Completion (MVP)

This repo includes a runnable React Native MVP:
- Auth screens (signup/login)
- Main task list connected to Firestore in real-time
- Mic button that captures speech, sends transcript to a Cloud Function powered by Vertex AI (Gemini), and creates tasks or asks follow-ups
- Clear integration points for STT/TTS productionization

Proceed to feature polish, UI/UX enhancements, TTS playback integration, and stricter backend security (e.g., ID token verification in the function).