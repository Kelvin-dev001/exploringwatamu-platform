import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HouseRulesList({ rules }) {
  if (!rules || rules.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {rules.map((rule, idx) => (
        <Text key={idx} style={styles.rule}>• {rule}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  rule: { color: '#555', fontSize: 14, marginBottom: 3 },
});