import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

export default function FocusCheckButton({ listening, processing, onPress, partial }) {
  return (
    <View style={styles.wrapper}>
      {partial ? <Text style={styles.partial} numberOfLines={2}>{partial}</Text> : null}
      <TouchableOpacity
        style={[styles.button, listening ? styles.buttonActive : null]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.label}>{listening ? 'Listening…' : 'Focus Check'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16, bottom: 96,
    alignItems: 'flex-start', justifyContent: 'center',
  },
  partial: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    color: '#333',
    maxWidth: '70%',
  },
  button: {
    width: 160, height: 48, borderRadius: 24,
    backgroundColor: '#00897b',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: '#00695c',
  },
  label: { color: '#fff', fontWeight: '700' },
});