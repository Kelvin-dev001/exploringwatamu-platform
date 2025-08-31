import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © {new Date().getFullYear()} Exploring Watamu. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 40, alignItems: 'center', opacity: 0.7 },
  footerText: { fontSize: 14, color: '#1e7575' },
});