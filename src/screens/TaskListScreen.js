import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Voice from '@react-native-voice/voice';
import TrackPlayer from 'react-native-track-player';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import NovaButton from '../components/NovaButton';
import FocusCheckButton from '../components/FocusCheckButton';
import { taskTemplate } from '../../src/backend/data-models';
import { processTaskText, getSignalOrNoise } from '../services/api';

export default function TaskListScreen() {
  const { user, signOut } = useAuth();
  const { tasks, loading } = useTasks();

  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [followUpContext, setFollowUpContext] = useState(null);

  // Focus Check state
  const [focusListening, setFocusListening] = useState(false);
  const [focusPartial, setFocusPartial] = useState('');
  const [focusTranscript, setFocusTranscript] = useState('');
  const [focusProcessing, setFocusProcessing] = useState(false);

  // Setup Voice handlers for Nova (task add)
  useEffect(() => {
    Voice.onSpeechStart = () => setPartial('');
    Voice.onSpeechPartialResults = (e) => setPartial((e.value && e.value[0]) || '');
    Voice.onSpeechResults = (e) => setTranscript((e.value && e.value[0]) || '');
    Voice.onSpeechError = (e) => {
      console.warn('Voice error', e);
      setListening(false);
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Separate Focus Check listeners use the same Voice singleton.
  // We will explicitly reset focus state around start/stop calls to avoid overlap.

  // Setup TrackPlayer minimal (used later for TTS playback placeholders)
  useEffect(() => {
    (async () => {
      try {
        await TrackPlayer.setupPlayer();
      } catch (e) {
        // ignore if already setup or on platform without audio session
      }
    })();
  }, []);

  const startListening = useCallback(async () => {
    try {
      setTranscript('');
      setPartial('');
      setListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.warn('Failed to start listening', e);
      setListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.warn('Failed to stop', e);
    } finally {
      setListening(false);
    }
  }, []);

  // When transcript (Nova) arrives, run processing
  useEffect(() => {
    const run = async () => {
      if (!transcript || !user) return;
      setProcessing(true);
      try {
        const result = await processTaskText({
          userId: user.uid,
          text: transcript,
          context: followUpContext,
        });
        // Expected: { taskName, priority, dueDate, followUpQuestion }
        if (result.followUpQuestion) {
          // TODO: call backend TTS and play audio; placeholder Alert for MVP
          setFollowUpContext({ prior: { ...result } });
          Alert.alert('Nova asks', result.followUpQuestion, [
            { text: 'Speak answer', onPress: () => startListening() },
          ]);
        } else {
          // Create the task
          await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('tasks')
            .add({
              ...taskTemplate,
              taskName: result.taskName || '',
              priority: result.priority || 'Medium',
              dueDate: result.dueDate || '',
              status: 'pending',
              createdAt: firestore.FieldValue.serverTimestamp(),
            });
          setFollowUpContext(null);
          Alert.alert('Task added', result.taskName || 'New task');
        }
      } catch (e) {
        console.warn('processTaskText error', e);
        Alert.alert('Error', 'Unable to process your request.');
      } finally {
        setProcessing(false);
        setTranscript('');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // Focus Check controls
  const startFocusListening = useCallback(async () => {
    try {
      setFocusTranscript('');
      setFocusPartial('');
      setFocusListening(true);
      // Remap partial/results handlers temporarily
      Voice.onSpeechPartialResults = (e) => setFocusPartial((e.value && e.value[0]) || '');
      Voice.onSpeechResults = (e) => setFocusTranscript((e.value && e.value[0]) || '');
      await Voice.start('en-US');
    } catch (e) {
      console.warn('Failed to start focus listening', e);
      setFocusListening(false);
    }
  }, []);

  const stopFocusListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.warn('Failed to stop focus', e);
    } finally {
      setFocusListening(false);
    }
  }, []);

  // When focus transcript arrives, call getSignalOrNoise
  useEffect(() => {
    const run = async () => {
      if (!focusTranscript || !user) return;
      setFocusProcessing(true);
      try {
        // Build important tasks list (Top and Medium)
        const important = tasks
          .filter(t => ['Top', 'Medium'].includes(t.priority))
          .map(t => t.taskName)
          .filter(Boolean);

        const verdict = await getSignalOrNoise({
          userId: user.uid,
          currentActivity: focusTranscript,
          importantTasks: important,
        });
        // Expected: { verdict: "Signal" | "Noise" }
        const msg = verdict && verdict.verdict === 'Signal' ? "That's signal." : "That's noise.";
        Alert.alert('Focus Check', msg);
        // TODO: TTS playback of msg
      } catch (e) {
        console.warn('getSignalOrNoise error', e);
        Alert.alert('Error', 'Unable to analyze activity.');
      } finally {
        setFocusProcessing(false);
        setFocusTranscript('');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTranscript, user, tasks]);

  const renderItem = ({ item }) => {
    const color = item.priority === 'Top' ? '#e53935' : item.priority === 'Low' ? '#43a047' : '#ffb300';
    return (
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.taskName}>{item.taskName}</Text>
          <Text style={styles.meta}>{item.priority} • {item.dueDate || 'No date'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Tasks</Text>
        <TouchableOpacity onPress={signOut}><Text style={styles.signout}>Sign out</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={<Text style={styles.empty}>No tasks yet. Tap the mic to add one.</Text>}
        />
      )}
 
      <NovaButton
        listening={listening}
        processing={processing}
        onPress={() => (listening ? stopListening() : startListening())}
        partial={partial}
      />

      <FocusCheckButton
        listening={focusListening}
        processing={focusProcessing}
        onPress={() => (focusListening ? stopFocusListening() : startFocusListening())}
        partial={focusPartial}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  signout: { color: '#d32f2f', fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  taskName: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
});