// Signal2Noise - Data Model Templates
// These templates can be imported and cloned when creating new docs in Firestore.
// Usage example:
//   import { userTemplate, taskTemplate } from './data-models';
//   const newUser = { ...userTemplate, name: 'Alice', email: 'alice@example.com' };

export const userTemplate = {
  name: '',
  email: '',
  createdAt: null, // Firestore server timestamp recommended at write time
  settings: {
    voiceOutput: 'enabled', // 'enabled' | 'disabled'
    notifications: 'enabled', // 'enabled' | 'disabled'
  },
};

// Sub-collection: users/{userId}/tasks - template for documents in the tasks subcollection
export const taskTemplate = {
  taskName: '',
  priority: 'Medium', // 'Top' | 'Medium' | 'Low'
  dueDate: '', // 'YYYY-MM-DD'
  status: 'pending', // 'pending' | 'in_progress' | 'completed'
  createdAt: null, // Firestore server timestamp recommended at write time
  completedAt: null, // timestamp | null
  timeTracked: 0, // seconds
};

// Helper factories that inject FieldValue.serverTimestamp() when used with Firebase Web SDK v9+
/**
 * createUserDoc
 * @param {{name:string, email:string, settings?:{voiceOutput?:'enabled'|'disabled', notifications?:'enabled'|'disabled'}}} data
 * @param {{serverTimestamp: any}} deps - pass { serverTimestamp: serverTimestamp } from 'firebase/firestore'
 */
export function createUserDoc(data, deps = {}) {
  const { serverTimestamp } = deps;
  return {
    ...userTemplate,
    ...data,
    createdAt: serverTimestamp ? serverTimestamp() : null,
    settings: {
      ...userTemplate.settings,
      ...(data?.settings || {}),
    },
  };
}

/**
 * createTaskDoc
 * @param {{taskName:string, priority?:'Top'|'Medium'|'Low', dueDate?:string, status?:'pending'|'in_progress'|'completed', timeTracked?:number}} data
 * @param {{serverTimestamp: any}} deps - pass { serverTimestamp: serverTimestamp } from 'firebase/firestore'
 */
export function createTaskDoc(data, deps = {}) {
  const { serverTimestamp } = deps;
  return {
    ...taskTemplate,
    ...data,
    createdAt: serverTimestamp ? serverTimestamp() : null,
    // completedAt remains null unless explicitly set when status becomes 'completed'
  };
}