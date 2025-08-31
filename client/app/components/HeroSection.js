import React, { useRef, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';

export default function HeroSection() {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoContainer,
        { transform: [{ scale: logoScale }], opacity: logoOpacity }
      ]}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Text style={styles.title}>Exploring Watamu</Text>
      <Text style={styles.subtitle}>Experiencing the sweetness</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 20 },
  logoContainer: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.93)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    shadowColor: '#24b3b3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18,
    shadowRadius: 18, elevation: 12,
  },
  logo: { width: 120, height: 120, borderRadius: 60 },
  title: {
    fontSize: 36, fontWeight: 'bold', color: '#1e7575', marginBottom: 6,
    letterSpacing: 1, textAlign: 'center',
  },
  subtitle: {
    fontSize: 20, color: '#ffb347', marginBottom: 2, fontWeight: '500',
    textAlign: 'center', letterSpacing: 0.2,
  },
});