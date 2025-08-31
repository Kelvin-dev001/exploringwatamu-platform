import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AnimatedCard from './AnimatedCard';
import { useRouter } from 'expo-router';

export default function AccommodationCard({ accommodation, delay }) {
  const router = useRouter();
  const { name, type, starRating, description, images, location, popularFacilities, id } = accommodation;
  const previewImage = images && images.length > 0 ? images[0] : null;

  const handlePress = () => {
    router.push(`/accommodation/${id}`);
  };

  return (
    <AnimatedCard delay={delay}>
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={handlePress}>
        {previewImage && (
          <Image source={previewImage} style={styles.img} resizeMode="cover" />
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.row}>
            <Text style={styles.type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            {starRating && (
              <Text style={styles.stars}>{' ★'.repeat(starRating)} </Text>
            )}
          </View>
          <Text style={styles.desc} numberOfLines={2}>{description}</Text>
          <View style={styles.facilitiesRow}>
            {popularFacilities && popularFacilities.map((fac, i) => (
              <Text key={i} style={styles.facility}>{fac}</Text>
            ))}
          </View>
          <Text style={styles.address}>{location?.address}</Text>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#24b3b3',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  img: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#24b3b3',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  type: {
    fontSize: 15,
    color: '#1e7575',
    fontWeight: '600',
    marginRight: 5,
  },
  stars: {
    fontSize: 15,
    color: '#ffb347',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  desc: {
    fontSize: 14,
    color: '#555',
    marginVertical: 3,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  facility: {
    fontSize: 13,
    color: '#24b3b3',
    backgroundColor: '#e3f6f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 3,
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },
});