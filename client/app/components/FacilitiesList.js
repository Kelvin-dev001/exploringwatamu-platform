import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FacilitiesList({ facilities }) {
  if (!facilities || facilities.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {facilities.map((fac, i) => (
        <Text key={i} style={styles.fac}>{fac}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 3,
  },
  fac: {
    fontSize: 13,
    backgroundColor: '#e3f6f5',
    color: '#24b3b3',
    borderRadius: 7,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    marginBottom: 4,
  },
});