import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FAQList({ faqs }) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {faqs.map((item, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.q}>Q: {item.question}</Text>
          <Text style={styles.a}>A: {item.answer}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 7 },
  row: { marginBottom: 6 },
  q: { color: '#24b3b3', fontWeight: '700' },
  a: { color: '#555', marginLeft: 12 },
});