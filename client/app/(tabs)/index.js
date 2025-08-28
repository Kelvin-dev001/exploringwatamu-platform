import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Navigation features configuration
const features = [
  { title: 'Hotels', icon: 'bed-outline', screen: 'hotels' },
  { title: 'Transfers', icon: 'car-outline', screen: 'transfers' },
  { title: 'Tours', icon: 'map-outline', screen: 'tours' },
  { title: 'Services', icon: 'sparkles-outline', screen: 'services' },
  { title: 'Car Hire', icon: 'car-sport-outline', screen: 'carhire' },
];

export default function HomeScreen({ navigation }) {
  // Animation for logo
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#24b3b3', '#46c3d6', '#fbeec1']}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={styles.gradient}
    >
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#24b3b3"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroLogoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.title}>Explore Watamu</Text>
        <Text style={styles.subtitle}>Your gateway to paradise</Text>

        <View style={styles.buttonGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.title}
              style={styles.featureButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={feature.icon} size={28} color="#24b3b3" />
              </View>
              <Text style={styles.buttonText}>{feature.title}</Text>
              <Ionicons name="chevron-forward" size={22} color="#46c3d6" style={styles.chevronIcon} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Exploring Watamu. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 52,
    paddingHorizontal: 18,
  },
  heroLogoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#24b3b3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e7575',
    marginBottom: 6,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#ffb347',
    marginBottom: 32,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  buttonGrid: {
    width: '100%',
    marginTop: 8,
    marginBottom: 18,
  },
  featureButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    marginVertical: 10,
    paddingVertical: 18,
    paddingHorizontal: 22,
    shadowColor: '#24b3b3',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    backgroundColor: '#fbeec1',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#24b3b3',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 2,
  },
  buttonText: {
    fontSize: 22,
    color: '#1e7575',
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
  chevronIcon: {
    marginLeft: 6,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.7,
  },
  footerText: {
    fontSize: 14,
    color: '#1e7575',
  },
});