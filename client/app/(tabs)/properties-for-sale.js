import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import PropertyCard from '../components/PropertyCard';
import AnimatedCard from '../components/AnimatedCard';

const properties = [
  {
    id: 1,
    title: "Luxury Beach Villa",
    description: "5 bed villa, ocean views, private pool.",
    price: "$650,000",
    image: require('../assets/property1.jpeg'),
  },
  {
    id: 2,
    title: "Cozy Cottage",
    description: "2 bed cottage, walking distance to beach.",
    price: "$180,000",
    image: require('../assets/property2.jpeg'),
  },
  {
    id: 3,
    title: "Modern Apartment",
    description: "3 bed apartment, city center, security.",
    price: "$320,000",
    image: require('../assets/property3.jpeg'),
  },
];

export default function PropertiesForSale() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Properties For Sale</Text>
      <Text style={styles.subheader}>Browse beautiful properties available in Watamu!</Text>
      <View style={styles.list}>
        {properties.map((prop, idx) => (
           <AnimatedCard key={prop.id} delay={idx * 120}>
          <PropertyCard
            key={prop.id}
            title={prop.title}
            description={prop.description}
            price={prop.price}
            image={prop.image}
          />
           </AnimatedCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, backgroundColor: '#fbeec1', minHeight: '100%' },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#24b3b3',
    marginBottom: 6,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 17,
    color: '#1e7575',
    marginBottom: 18,
    textAlign: 'center',
  },
  list: {
    marginTop: 8,
  },
});