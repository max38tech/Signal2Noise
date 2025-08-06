import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

export default function NovaButton({ listening, processing, onPress, partial }) {
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
          <Text style={styles.label}>{listening ? 'Listening… Tap to stop' : 'Talk to Nova'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0, right: 0, bottom: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  partial: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    color: '#333',
    maxWidth: '90%',
  },
  button: {
    width: 200, height: 56, borderRadius: 28,
    backgroundColor: '#3f51b5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: '#d32f2f',
  },
  label: { color: '#fff', fontWeight: '700' },
});