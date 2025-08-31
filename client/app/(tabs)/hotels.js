import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import AccommodationTypeTabs from '../components/AccommodationTypeTabs';
import StarRatingTabs from '../components/StarRatingTabs';
import AccommodationCard from '../components/AccommodationCard';

// Example mock data (expand as needed)
export const accommodations = [
  {
    id: '1',
    name: 'Severin Sea Lodge',
    type: 'hotel',
    starRating: 5,
    location: {
      address: 'Malindi Road, Mombasa',
      coordinates: { lat: -3.9992, lng: 39.7241 },
      mapUrl: 'https://maps.google.com/?q=-3.9992,39.7241',
    },
    description: 'A beautiful beachfront hotel with stunning views and modern amenities.',
    images: [
      require('../assets/hotel1.jpg'),
      require('../assets/hotel2.jpg'),
      // ... up to 20 images
    ],
    roomTypes: [
      { name: 'Deluxe Room', price: 120, description: 'Spacious room with sea view.', amenities: ['WiFi', 'AC'], availability: true },
      { name: 'Suite', price: 190, description: 'Luxury suite with living area.', amenities: ['WiFi', 'AC', 'Mini bar'], availability: false },
    ],
    facilities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant'],
    popularFacilities: ['Beachfront', 'Breakfast included'],
    availability: { dates: ['2025-09-01', '2025-09-02'], roomsAvailable: 5 },
    faqs: [
      { question: 'Is breakfast included?', answer: 'Yes, full buffet breakfast.' },
      { question: 'Is parking available?', answer: 'Yes, free parking.' },
    ],
    houseRules: ['No smoking', 'Check-in after 2pm', 'No pets'],
    // Inside each accommodation object:
reviews: [
  { user: "Alice", rating: 5, text: "Amazing place! Highly recommended.", date: "2025-08-30" },
  { user: "Bob", rating: 4, text: "Great location, friendly staff.", date: "2025-08-29" },
],
    contact: {
      whatsapp: 'https://wa.me/254700000000',
      email: 'book@severin.com',
    },
  },
  {
    id: '2',
    name: 'Watamu Airbnb Home',
    type: 'airbnb',
    starRating: 4,
    location: {
      address: 'Watamu Beach Road, Watamu',
      coordinates: { lat: -2.3606, lng: 40.0256 },
      mapUrl: 'https://maps.google.com/?q=-2.3606,40.0256',
    },
    description: 'A cozy Airbnb home with easy beach access and local charm.',
    images: [
      require('../assets/airbnb1.jpeg'),
      require('../assets/airbnb2.jpg'),
    ],
    roomTypes: [
      { name: 'Entire Home', price: 90, description: '2 bedrooms, kitchen, living room.', amenities: ['WiFi', 'Kitchen'], availability: true },
    ],
    facilities: ['Kitchen', 'WiFi', 'Parking'],
    popularFacilities: ['Beachfront', 'Self check-in'],
    availability: { dates: ['2025-09-01', '2025-09-02'], roomsAvailable: 1 },
    faqs: [
      { question: 'Is WiFi available?', answer: 'Yes, free WiFi.' },
    ],
    houseRules: ['No parties', 'Check-in after 1pm'],
    reviews: [
      { user: "JRomerio", rating: 5, text: "very clean and friendly room service.", date: "2025-08-30" },
      { user: "Valentino", rating: 4, text: "I love the breeze.", date: "2025-08-29" },
    ],
    contact: {
      whatsapp: 'https://wa.me/254711111111',
      email: 'host@watamuairbnb.com',
    },
  },
  {
    id: '3',
    name: 'Luxury Watamu Villa',
    type: 'villa',
    starRating: 5,
    location: {
      address: 'Luxury Villa Lane, Watamu',
      coordinates: { lat: -2.3620, lng: 40.0280 },
      mapUrl: 'https://maps.google.com/?q=-2.3620,40.0280',
    },
    description: 'Private villa with pool, gardens, and chef service.',
    images: [
      require('../assets/villa1.jpg'),
    ],
    roomTypes: [
      { name: 'Villa', price: 350, description: '4 bedrooms, private pool.', amenities: ['WiFi', 'Pool', 'Chef'], availability: true },
    ],
    facilities: ['Pool', 'Chef', 'WiFi'],
    popularFacilities: ['Private pool', 'Chef service'],
    availability: { dates: ['2025-09-01', '2025-09-10'], roomsAvailable: 1 },
    faqs: [
      { question: 'Is chef service included?', answer: 'Yes, chef service is included.' },
    ],
    houseRules: ['No pets', 'No smoking'],
    reviews: [
      { user: "JRomerio", rating: 5, text: "very clean and friendly room service.", date: "2025-08-30" },
      { user: "Valentino", rating: 4, text: "I love the breeze.", date: "2025-08-29" },
    ],
    contact: {
      whatsapp: 'https://wa.me/254722222222',
      email: 'book@watamuvilla.com',
    },
  },
  // ... add more as needed
];

// This is optional: keeps your list screen working!
export default function Hotels() {
  // State for filtering
  const [type, setType] = useState('hotel'); // hotel | airbnb | villa
  const [star, setStar] = useState(null); // null = all, 5, 4, 3...

  // Filter accommodations
  const filtered = accommodations.filter(acc => {
    const matchesType = acc.type === type;
    const matchesStar = star ? acc.starRating === star : true;
    return matchesType && matchesStar;
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Accommodations</Text>
      <Text style={styles.subheader}>Find the perfect place to stay in Watamu.</Text>
      <AccommodationTypeTabs selectedType={type} onSelect={setType} />
      <StarRatingTabs selectedStar={star} onSelect={setStar} />
      <View style={styles.list}>
        {filtered.length > 0 ? (
          filtered.map((acc, idx) => (
            <AccommodationCard key={acc.id} accommodation={acc} delay={idx * 120} />
          ))
        ) : (
          <Text style={styles.emptyText}>No accommodations found for your selection.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, backgroundColor: '#fbeec1', minHeight: '100%' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#24b3b3', marginBottom: 6, textAlign: 'center' },
  subheader: { fontSize: 17, color: '#1e7575', marginBottom: 18, textAlign: 'center' },
  list: { marginTop: 8, width: '100%' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 18 },
});