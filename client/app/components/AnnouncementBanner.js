import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AnnouncementBanner({ message }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%', backgroundColor: '#ffb347', padding: 10,
    borderRadius: 10, marginBottom: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  bannerText: { color: '#1e7575', fontSize: 16, fontWeight: '600' },
});