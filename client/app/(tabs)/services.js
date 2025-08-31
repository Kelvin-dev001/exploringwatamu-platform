import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import AnimatedCard from '../components/AnimatedCard';

const services = [
  {
    id: 1,
    name: "Spa & Wellness",
    description: "Relaxing massages and beauty treatments.",
    price: "From $40",
    image: require('../assets/service1.jpeg'),
  },
  {
    id: 2,
    name: "Event Planning",
    description: "Professional event coordination and venues.",
    price: "Custom pricing",
    image: require('../assets/service2.jpg'),
  },
];

function ServiceCard({ name, description, price, image }) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.img} />
      <View style={styles.info}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.desc}>{description}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
    </View>
  );
}

export default function Services() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Services</Text>
      <Text style={styles.subheader}>Premium services for your comfort.</Text>
      <View style={styles.list}>
        {services.map((service, idx) => (
          <AnimatedCard key={service.id} delay={idx * 120}>
            <ServiceCard
              name={service.name}
              description={service.description}
              price={service.price}
              image={service.image}
            />
          </AnimatedCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, backgroundColor: '#fbeec1', minHeight: '100%' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#24b3b3', marginBottom: 6, textAlign: 'center' },
  subheader: { fontSize: 17, color: '#1e7575', marginBottom: 18, textAlign: 'center' },
  list: { marginTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 18, overflow: 'hidden',
    shadowColor: '#24b3b3', shadowOpacity: 0.09, shadowRadius: 8, elevation: 4, flexDirection: 'row',
  },
  img: { width: 120, height: 120 },
  info: { flex: 1, padding: 14, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#24b3b3' },
  desc: { fontSize: 15, color: '#666', marginTop: 4 },
  price: { fontSize: 16, color: '#ffb347', marginTop: 8, fontWeight: '600' },
});