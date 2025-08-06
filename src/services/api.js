// API service for calling Google Cloud Function: processTaskText
// This module assumes you will deploy a HTTPS function and expose its URL.
// For local emulation, set API_BASE to your emulator URL.

import axios from 'axios';

// Configure this to your deployed function URL or use env injection at build time.
const API_BASE = 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/processTaskText';

export async function processTaskText({ userId, text, context }) {
  // context can include any prior answers for follow-ups
  const payload = { userId, text, context: context || null };
  const res = await axios.post(API_BASE, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });
  return res.data; // Expected shape: { taskName, priority, dueDate, followUpQuestion }
}

// Helper for STT request (if you choose to forward from app; often done server-side)
// You may choose to call Google Cloud STT directly in native code; this is a placeholder.
export async function transcribeSpeechBase64({ audioContentBase64, languageCode = 'en-US' }) {
  // This is a placeholder: in production, route via a secure backend to call STT.
  // Left intentionally unimplemented to avoid exposing service account creds on-device.
  throw new Error('transcribeSpeechBase64 should be implemented via a secure backend proxy.');
}

// Helper for TTS request (text -> audio). Same security note as above.
export async function synthesizeSpeech({ text, voice = { languageCode: 'en-US', name: 'en-US-Neural2-F' } }) {
  // This is a placeholder: in production, route via a secure backend to call TTS.
  throw new Error('synthesizeSpeech should be implemented via a secure backend proxy.');
}