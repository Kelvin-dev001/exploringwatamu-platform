import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ReviewList({ reviews, onEdit, onDelete }) {
  const { user } = useAuth();

  if (!reviews || reviews.length === 0) {
    return <Text style={styles.empty}>No reviews yet. Be the first to review!</Text>;
  }

  return (
    <View style={styles.wrap}>
      {reviews.map((rev, idx) => (
        <View key={rev._id || idx} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.user}>{rev.userName}</Text>
            <Text style={styles.date}>{rev.date || new Date(rev.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.rating}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</Text>
          <Text style={styles.text}>{rev.text}</Text>
          {user && user._id === rev.userId && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity onPress={() => onEdit(rev)}>
                  <Text style={styles.actionEdit}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={() => onDelete(rev._id)}>
                  <Text style={styles.actionDelete}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  card: { backgroundColor: '#f1f1f1', borderRadius: 8, padding: 12, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  user: { fontWeight: 'bold', color: '#24b3b3', fontSize: 15 },
  date: { fontSize: 12, color: '#888' },
  rating: { color: '#ffb347', fontSize: 16, marginVertical: 2 },
  text: { fontSize: 15, color: '#333', marginTop: 2 },
  empty: { color: '#888', fontStyle: 'italic', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 20, marginTop: 6 },
  actionEdit: { color: '#24b3b3', fontWeight: 'bold', marginRight: 18 },
  actionDelete: { color: '#ff5e5e', fontWeight: 'bold' },
});