import React from 'react';
import { View, StyleSheet } from 'react-native';
import NavButton from './NavButton';
import { useRouter } from 'expo-router';

const features = [
  { title: 'Accommodation', icon: 'bed-outline', screen: '/hotels' },
  { title: 'Transfers', icon: 'car-outline', screen: '/transfers' },
  { title: 'Tours & Excursions', icon: 'map-outline', screen: '/tours' },
  { title: 'Services', icon: 'sparkles-outline', screen: '/services' },
  { title: 'Car Hire', icon: 'car-sport-outline', screen: '/carhire' },
  { title: 'Properties For Sale', icon: 'home-outline', screen: '/properties-for-sale' },
];

export default function NavigationGrid() {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {features.map((feature) => (
        <NavButton
          key={feature.title}
          title={feature.title}
          icon={feature.icon}
          onPress={() => router.push(feature.screen)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%', marginTop: 8, marginBottom: 18 },
});