import React, { createContext, useContext, useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('tasks')
      .orderBy('createdAt', 'desc');

    const unsub = ref.onSnapshot(
      snap => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const value = { tasks, loading };
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  return useContext(TaskContext);
}