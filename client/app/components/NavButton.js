import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NavButton({ title, icon, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={onPress}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={28} color="#24b3b3" />
        </View>
        <Text style={styles.buttonText}>{title}</Text>
        <Ionicons name="chevron-forward" size={22} color="#46c3d6" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, marginVertical: 10, paddingVertical: 18, paddingHorizontal: 22,
    shadowColor: '#24b3b3', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  iconCircle: {
    backgroundColor: '#fbeec1', borderRadius: 24, width: 48, height: 48,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
    shadowColor: '#24b3b3', shadowOpacity: 0.14, shadowRadius: 12, elevation: 2,
  },
  buttonText: { fontSize: 22, color: '#1e7575', fontWeight: '600', flex: 1, letterSpacing: 0.3 },
});