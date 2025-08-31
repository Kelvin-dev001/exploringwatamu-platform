import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Ensure this context exists!

export default function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleStarPress = (star) => setRating(star);

  const handleSubmit = () => {
    if (!user) {
      setError('You must be logged in to submit a review.');
      return;
    }
    if (!rating || !text.trim()) {
      setError('Please provide a star rating and review text.');
      return;
    }
    setError('');
    onSubmit({
      rating,
      text,
      userId: user._id,
      userName: user.name,
      date: new Date().toISOString().split('T')[0],
    });
    setRating(0);
    setText('');
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Your Rating:</Text>
      <View style={styles.stars}>
        {[1,2,3,4,5].map(star => (
          <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
            <Text style={star <= rating ? styles.starFilled : styles.starEmpty}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Write your review..."
        value={text}
        onChangeText={setText}
        multiline
        accessibilityLabel="Review text"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { marginVertical: 16, backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 2 },
  label: { fontWeight: 'bold', marginBottom: 6, color: '#24b3b3' },
  stars: { flexDirection: 'row', marginBottom: 8 },
  starFilled: { color: '#ffb347', fontSize: 28, marginHorizontal: 2 },
  starEmpty: { color: '#ddd', fontSize: 28, marginHorizontal: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 7, padding: 10, fontSize: 16, minHeight: 60, backgroundColor: '#f9f9f9', marginBottom: 8 },
  error: { color: '#ff5e5e', marginBottom: 5 },
  button: { backgroundColor: '#24b3b3', borderRadius: 7, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});