import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function PropertyCard({ title, description, price, image }) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.img} />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#24b3b3',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
  },
  img: {
    width: 120,
    height: 120,
  },
  info: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#24b3b3' },
  desc: { fontSize: 15, color: '#666', marginTop: 4 },
  price: { fontSize: 16, color: '#ffb347', marginTop: 8, fontWeight: '600' },
});