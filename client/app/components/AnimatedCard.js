import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function AnimatedCard({ children, delay = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.animated, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animated: {
    width: '100%',
  },
});