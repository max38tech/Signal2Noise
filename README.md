# Signal2Noise — Phase 1 (Foundation)

This repository contains the foundational backend and cloud environment setup for the Signal2Noise mobile application. The app is a voice-first productivity tool with an AI assistant named "Nova". Phase 1 establishes Firebase Authentication, Firestore data models and security rules, and enables Google Cloud AI APIs for Speech, TTS, and Vertex AI.

## Stack

- Backend: Firebase
- Database: Cloud Firestore
- Authentication: Firebase Authentication (Email/Password)
- AI/ML Platform: Google Cloud Vertex AI
- Mobile Framework: React Native

---

## Deliverables in this repo

- [firestore.rules](firestore.rules) — Firestore Security Rules enforcing user isolation
- [src/backend/data-models.js](src/backend/data-models.js) — JavaScript templates/factories for user and task documents
- [scripts/enable_apis.sh](scripts/enable_apis.sh) — gcloud script to enable required AI/ML APIs
- This [README.md](README.md)

---

## Firestore Security Rules

The rules enforce that an authenticated user can only read/write their own `users/{userId}` document and any documents in its `tasks` sub-collection.

Reference: [firestore.rules](firestore.rules)

Deployment example:
1) Ensure you are logged in and targeting the correct Firebase project.
2) If not already initialized, run `firebase init firestore` and choose to use existing rules file path `firestore.rules`.
3) Deploy:
   firebase deploy --only firestore:rules

---

## Data Models

Location: [src/backend/data-models.js](src/backend/data-models.js)

These export templates and helper factory functions for creating new documents:

User document (collection: `users`, docId: Firebase Auth UID):
{
  "name": "string",
  "email": "string",
  "createdAt": "timestamp",
  "settings": {
    "voiceOutput": "enabled|disabled",
    "notifications": "enabled|disabled"
  }
}

Task document (sub-collection: `users/{userId}/tasks`, auto-id):
{
  "taskName": "string",
  "priority": "Top|Medium|Low",
  "dueDate": "YYYY-MM-DD",
  "status": "pending|in_progress|completed",
  "createdAt": "timestamp",
  "completedAt": "timestamp|null",
  "timeTracked": 0
}

Usage (Firebase Web SDK v9+):
import { serverTimestamp } from 'firebase/firestore';
import { createUserDoc, createTaskDoc } from './src/backend/data-models';

const userDoc = createUserDoc(
  { name: 'Alice', email: 'alice@example.com' },
  { serverTimestamp }
);

const taskDoc = createTaskDoc(
  { taskName: 'Daily review', priority: 'Top', dueDate: '2025-08-06' },
  { serverTimestamp }
);

---

## Firebase Setup

1) Create a Firebase project
   - https://console.firebase.google.com/
   - Add a project, link to an existing GCP project if desired.

2) Enable Authentication (Email/Password)
   - Firebase Console > Build > Authentication > Get started
   - Sign-in method: Enable Email/Password

3) Create Cloud Firestore
   - Firebase Console > Build > Firestore Database
   - Create database (production or test mode as you prefer; these rules will secure access)

4) Deploy Rules
   - Ensure `firebase-tools` is installed:
     npm install -g firebase-tools
   - Login:
     firebase login
   - Initialize if needed:
     firebase init firestore
     - Use existing project or select your new project
     - Point to the provided firestore.rules file
   - Deploy:
     firebase deploy --only firestore:rules

---

## Enable Google Cloud AI APIs

Prerequisites:
- gcloud CLI installed and authenticated (https://cloud.google.com/sdk/docs/install)
- You must have permission to enable services for the target project

Run the script:
chmod +x ./scripts/enable_apis.sh
./scripts/enable_apis.sh YOUR_GCP_PROJECT_ID

This enables:
- Cloud Speech-to-Text API (speech.googleapis.com)
- Cloud Text-to-Speech API (texttospeech.googleapis.com)
- Vertex AI API (aiplatform.googleapis.com)

Optional verification:
gcloud services list --enabled --project YOUR_GCP_PROJECT_ID | grep -E "speech.googleapis.com|texttospeech.googleapis.com|aiplatform.googleapis.com"

---

## Integration Notes (React Native)

- Use Firebase JS SDK:
  - Install:
    npm install firebase
  - Initialize in your app and use:
    - Authentication (Email/Password)
    - Firestore for data persistence
- For server timestamps with the factories in data-models.js, pass serverTimestamp from 'firebase/firestore'.
- For AI functionality (Nova):
  - Speech-to-Text: Use Google Cloud STT via a secure backend or authorized mobile client flow.
  - Text-to-Speech: Use Google Cloud TTS for generating voice responses.
  - Vertex AI: Use Gemini models for NLU and conversational logic. Access via secure backend endpoints or client SDK with proper authentication and security.

Security reminder:
- Do not expose service account keys in the mobile app.
- Consider building a minimal backend proxy for sensitive AI operations and quota control.

---

## Phase 1 Completion

Phase 1 (Foundation) is complete with:
- Firestore rules enforcing per-user isolation.
- Defined data models (users, users/{userId}/tasks).
- Script to enable required Google Cloud AI APIs.
- Documented setup steps for Firebase and GCP.

You can now proceed to Phase 2: building the React Native client, wiring auth flows, CRUD for tasks, and integrating Nova (STT/TTS + Vertex AI).