/**
 * Cloud Function: processTaskText
 * - HTTPS function that accepts { userId, text, context }
 * - Calls Vertex AI (Gemini) to extract { taskName, priority, dueDate, followUpQuestion }
 * - Returns JSON only with these fields.
 *
 * Prerequisites:
 * - Enable APIs: aiplatform.googleapis.com (Vertex AI)
 * - Set env vars if needed for region/project or rely on default GOOGLE_CLOUD_PROJECT
 * - Deploy with Firebase Functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { VertexAI } = require('@google-cloud/aiplatform');
const { z } = require('zod');

admin.initializeApp();

const REGION = process.env.FUNCTIONS_REGION || 'us-central1';
const MODEL = process.env.VERTEX_MODEL || 'gemini-1.5-flash'; // Adjust model as desired

const ResponseSchema = z.object({
  taskName: z.string().nullable(),
  priority: z.enum(['Top', 'Medium', 'Low']).nullable(),
  dueDate: z.string().nullable(), // YYYY-MM-DD
  followUpQuestion: z.string().nullable(),
});

// Create a Vertex AI client (generative models)
function getGenerativeModel() {
  const vertex = new VertexAI({ project: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, location: process.env.VERTEX_LOCATION || 'us-central1' });
  // For latest syntax, the generativeModels API may vary by SDK version. We build a small wrapper:
  const model = vertex.getGenerativeModel({ model: MODEL });
  return model;
}

function buildPrompt(userText) {
  const today = new Date().toISOString().slice(0, 10); // fallback ISO date
  return [
    'You are Nova, a helpful productivity assistant. Analyze the following user text to identify a task, its priority, and its due date.',
    "Today's date is " + today + '.',
    "- Priority can be 'Top', 'Medium', or 'Low'.",
    "- If a value is missing, set it to null.",
    '- Based on what is missing, formulate a single, concise follow-up question. If nothing is missing, set the question to null.',
    'Respond ONLY with a JSON object in the format: { "taskName": "...", "priority": "...", "dueDate": "YYYY-MM-DD", "followUpQuestion": "..." }',
    '',
    'User Text: ' + JSON.stringify(userText),
  ].join('\n');
}

exports.processTaskText = functions.region(REGION).https.onRequest(async (req, res) => {
  // CORS (basic)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, text, context } = req.body || {};
    if (!userId || !text) {
      return res.status(400).json({ error: 'Missing userId or text' });
    }

    const model = getGenerativeModel();
    const prompt = buildPrompt(text);

    // The SDK for Vertex AI generative models supports either generateContent or similar call.
    // Adjust to actual SDK method naming for your installed version.
    let contentResponse;
    try {
      contentResponse = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    } catch (e) {
      // Some SDK versions require a plain prompt string
      contentResponse = await model.generateContent(prompt);
    }

    // Extract text from response
    let outputText = '';
    if (contentResponse && contentResponse.response && contentResponse.response.candidates && contentResponse.response.candidates[0]) {
      const candidate = contentResponse.response.candidates[0];
      const parts = candidate.content && candidate.content.parts ? candidate.content.parts : [];
      outputText = parts.map(p => p.text || '').join(' ').trim();
    } else if (contentResponse && contentResponse.candidates && contentResponse.candidates[0] && contentResponse.candidates[0].content) {
      // Fallback path based on older/newer SDK shapes
      const parts = contentResponse.candidates[0].content.parts || [];
      outputText = parts.map(p => p.text || '').join(' ').trim();
    } else if (typeof contentResponse === 'string') {
      outputText = contentResponse;
    }

    // Try to parse JSON from the model output
    let parsed;
    try {
      // Extract JSON block if model added any extra text
      const match = outputText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(outputText);
    } catch (e) {
      return res.status(502).json({ error: 'Model returned non-JSON output', raw: outputText });
    }

    const safe = ResponseSchema.safeParse(parsed);
    if (!safe.success) {
      return res.status(502).json({ error: 'Model JSON did not match schema', issues: safe.error.issues, raw: parsed });
    }

    return res.status(200).json(safe.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
});