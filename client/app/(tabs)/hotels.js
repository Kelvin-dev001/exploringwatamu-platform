import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AccommodationTypeTabs from '../components/AccommodationTypeTabs';
import StarRatingTabs from '../components/StarRatingTabs';
import AccommodationCard from '../components/AccommodationCard';

// API endpoint for hotels
const API_URL = 'https://your-api-url.com/api/hotels'; // <-- Replace with your backend endpoint

export default function Hotels() {
  const [accommodations, setAccommodations] = useState([]);
  const [type, setType] = useState('hotel'); // hotel | airbnb | villa
  const [star, setStar] = useState(null); // null = all, 5, 4, 3...
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch hotels from backend
    const fetchHotels = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();

        // Optional: Map backend fields to expected card props here if needed
        setAccommodations(data);
      } catch (err) {
        setError('Failed to load hotels.');
        setAccommodations([]);
      }
      setLoading(false);
    };
    fetchHotels();
  }, []);

  // Filtering logic
  const filtered = accommodations.filter(acc => {
    const matchesType = acc.type === type;
    const matchesStar = star ? acc.stars === star : true; // backend: acc.stars, not acc.starRating
    return matchesType && matchesStar;
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Accommodations</Text>
      <Text style={styles.subheader}>Find the perfect place to stay in Watamu.</Text>
      <AccommodationTypeTabs selectedType={type} onSelect={setType} />
      <StarRatingTabs selectedStar={star} onSelect={setStar} />
      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator size="large" color="#24b3b3" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : filtered.length > 0 ? (
          filtered.map((acc, idx) => (
            <AccommodationCard key={acc._id || acc.id} accommodation={acc} delay={idx * 120} />
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