import React, { useState } from 'react';
import { ScrollView, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Premium homepage components
import HeroSection from '../components/HeroSection';
import NavigationGrid from '../components/NavigationGrid';
import Footer from '../components/Footer';
import AnnouncementBanner from '../components/AnnouncementBanner';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomeScreen() {
  // Example usage for loader and announcement
  const [loading, setLoading] = useState(false);
  const announcement = "Welcome! Explore new properties for sale and enjoy exclusive offers.";

  return (
    <LinearGradient
      colors={['#24b3b3', '#46c3d6', '#fbeec1']}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={{ flex: 1 }}
    >
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#24b3b3"
      />
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: 52,
          paddingHorizontal: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AnnouncementBanner message={announcement} />
        <LoadingSpinner loading={loading} />
        <HeroSection />
        <NavigationGrid />
        <Footer />
      </ScrollView>
    </LinearGradient>
  );
}