/**
 * API service for calling Cloud Functions.
 * Uses environment variables when available; otherwise falls back to local placeholders.
 */
export async function processTaskText(payload) {
  try {
    const url = process.env.PROCESS_TASK_URL || '';
    if (!url) {
      // Local placeholder: echo minimal parsed structure from free-form text
      const text = (payload?.text || '').trim();
      return {
        taskName: text ? text.slice(0, 40) : 'Example Task',
        priority: 'Medium',
        dueDate: null,
        followUpQuestion: null,
      };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.warn('processTaskText fetch error', e);
    throw e;
  }
}

// Backwards compatible named export used by TaskListScreen
export async function getSignalOrNoise(payload) {
  return getSignalOrNoiseVerdict(payload);
}

// Canonical function name for clarity
export async function getSignalOrNoiseVerdict(payload) {
  try {
    const url = process.env.SIGNAL_OR_NOISE_URL || '';
    if (!url) {
      // Local placeholder default
      return { verdict: 'Noise' };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.warn('getSignalOrNoise fetch error', e);
    throw e;
  }
}

// STT/TTS placeholders intentionally omitted for device security;
// route via secure backend if implementing.