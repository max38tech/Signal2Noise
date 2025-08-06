import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import { userTemplate } from '../../src/backend/data-models';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onSignUp = async () => {
    try {
      const cred = await signUp(email.trim(), password);
      const uid = cred.user.uid;

      // Create user profile document
      await firestore()
        .collection('users')
        .doc(uid)
        .set({
          ...userTemplate,
          name: name || '',
          email: email.trim(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Welcome!', 'Your account has been created.');
    } catch (e) {
      console.warn('Sign up error', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Name (optional)"
        onChangeText={setName}
        value={name}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Sign Up" onPress={onSignUp} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'stretch', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  link: { marginTop: 16, textAlign: 'center', color: '#007bff' },
});