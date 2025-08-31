import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function LoadingSpinner({ loading }) {
  if (!loading) return null;
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size="large" color="#24b3b3" />
    </View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: { marginVertical: 30, alignItems: 'center', justifyContent: 'center' },
});