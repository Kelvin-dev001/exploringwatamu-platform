import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAdminAuth } from '../../context/AdminAuthContext'; // create this context!

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAdminAuth();

  const handleLogin = async () => {
    setError('');
    try {
      await login(email, password);
      // redirect to admin dashboard
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 30, marginTop: 80 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 7, padding: 10, marginBottom: 12 },
  button: { backgroundColor: '#24b3b3', borderRadius: 7, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#ff5e5e', marginBottom: 8 },
});