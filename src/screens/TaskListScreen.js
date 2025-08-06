import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Voice from '@react-native-voice/voice';
import TrackPlayer, { State as TrackState } from 'react-native-track-player';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import NovaButton from '../components/NovaButton';
import { taskTemplate } from '../../src/backend/data-models';
import { processTaskText } from '../services/api';

export default function TaskListScreen() {
  const { user, signOut } = useAuth();
  const { tasks, loading } = useTasks();

  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [followUpContext, setFollowUpContext] = useState(null);

  // Setup Voice handlers
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

  // Setup TrackPlayer minimal
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

  // When transcript arrives, run processing
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