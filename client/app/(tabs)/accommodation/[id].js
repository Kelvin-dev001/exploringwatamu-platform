import React from 'react';
import { View, ScrollView, Text, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// MOCK DATA: Replace with API or context in production!
import { accommodations } from '../hotels';

// ---- Gallery Component ----
function ImageGallery({ images }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={galleryStyles.scroll}>
      {images.map((img, idx) => (
        <Image key={idx} source={img} style={galleryStyles.img} />
      ))}
    </ScrollView>
  );
}
const galleryStyles = StyleSheet.create({
  scroll: { marginVertical: 8, marginLeft: -8 },
  img: { width: 170, height: 130, borderRadius: 12, marginRight: 12, backgroundColor: '#eee' },
});

// ---- Facilities Component ----
function FacilitiesList({ facilities }) {
  return (
    <View style={facStyles.wrap}>
      {facilities.map((fac, i) => (
        <Text key={i} style={facStyles.fac}>{fac}</Text>
      ))}
    </View>
  );
}
const facStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 3 },
  fac: { fontSize: 13, backgroundColor: '#e3f6f5', color: '#24b3b3', borderRadius: 7, paddingHorizontal: 8, marginHorizontal: 2, marginBottom: 4 },
});

// ---- FAQ Component ----
function FAQList({ faqs }) {
  return (
    <View style={faqStyles.wrap}>
      {faqs.map((item, idx) => (
        <View key={idx} style={faqStyles.row}>
          <Text style={faqStyles.q}>Q: {item.question}</Text>
          <Text style={faqStyles.a}>A: {item.answer}</Text>
        </View>
      ))}
    </View>
  );
}
const faqStyles = StyleSheet.create({
  wrap: { marginVertical: 7 },
  row: { marginBottom: 6 },
  q: { color: '#24b3b3', fontWeight: '700' },
  a: { color: '#555', marginLeft: 12 },
});

// ---- House Rules Component ----
function HouseRulesList({ rules }) {
  return (
    <View style={hrStyles.wrap}>
      {rules.map((rule, idx) => (
        <Text key={idx} style={hrStyles.rule}>• {rule}</Text>
      ))}
    </View>
  );
}
const hrStyles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  rule: { color: '#555', fontSize: 14, marginBottom: 3 },
});

// ---- Booking Buttons Component ----
function BookingButtons({ whatsapp, email }) {
  return (
    <View style={bbStyles.row}>
      <TouchableOpacity style={[bbStyles.btn, bbStyles.whatsapp]} onPress={() => Linking.openURL(whatsapp)}>
        <Text style={bbStyles.btnText}>Book via WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[bbStyles.btn, bbStyles.email]} onPress={() => Linking.openURL(`mailto:${email}`)}>
        <Text style={bbStyles.btnText}>Book via Email</Text>
      </TouchableOpacity>
    </View>
  );
}
const bbStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, marginBottom: 30 },
  btn: { flex: 1, marginHorizontal: 5, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  whatsapp: { backgroundColor: '#25D366' },
  email: { backgroundColor: '#24b3b3' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

// ---- Main Page ----
export default function AccommodationDetail() {
  // If using navigation, get id from route.params; else, just demo with the first accommodation
  const { id } = useLocalSearchParams();
  const accommodation = accommodations.find(acc => acc.id === id)


  if (!accommodation) {
    return (
      <View style={styles.center}><Text>Accommodation not found.</Text></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{accommodation.name}</Text>
      <Text style={styles.typeStars}>
        {accommodation.type.charAt(0).toUpperCase() + accommodation.type.slice(1)}
        {accommodation.starRating ? ` • ${'★'.repeat(accommodation.starRating)}` : ''}
      </Text>
      <ImageGallery images={accommodation.images} />
      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.desc}>{accommodation.description}</Text>
      <Text style={styles.sectionTitle}>Room Types</Text>
      {accommodation.roomTypes.map((room, idx) => (
        <View key={idx} style={styles.roomCard}>
          <Text style={styles.roomName}>{room.name} <Text style={styles.roomPrice}>${room.price}/night</Text></Text>
          <Text style={styles.roomDesc}>{room.description}</Text>
          <View style={styles.roomAm}>{room.amenities.map((am, i) => (
            <Text key={i} style={styles.roomAmItem}>{am}</Text>
          ))}</View>
          <Text style={room.availability ? styles.avail : styles.notAvail}>
            {room.availability ? 'Available' : 'Not Available'}
          </Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Location</Text>
      <Text style={styles.address}>{accommodation.location.address}</Text>
      <TouchableOpacity onPress={() => Linking.openURL(accommodation.location.mapUrl)}>
        <Text style={styles.mapLink}>View on Map</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Most Popular Facilities</Text>
      <FacilitiesList facilities={accommodation.popularFacilities} />
      <Text style={styles.sectionTitle}>All Facilities</Text>
      <FacilitiesList facilities={accommodation.facilities} />
      <Text style={styles.sectionTitle}>FAQs</Text>
      <FAQList faqs={accommodation.faqs} />
      <Text style={styles.sectionTitle}>House Rules</Text>
      <HouseRulesList rules={accommodation.houseRules} />
      <BookingButtons whatsapp={accommodation.contact.whatsapp} email={accommodation.contact.email} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, backgroundColor: '#fff', minHeight: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#24b3b3', marginBottom: 4, textAlign: 'center' },
  typeStars: { fontSize: 17, color: '#1e7575', marginBottom: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#24b3b3', marginTop: 16, marginBottom: 5 },
  desc: { fontSize: 15, color: '#555', marginBottom: 8 },
  address: { fontSize: 15, color: '#555', marginBottom: 3 },
  mapLink: { color: '#24b3b3', textDecorationLine: 'underline', marginBottom: 10, fontWeight: '600' },
  roomCard: { backgroundColor: '#fbeec1', borderRadius: 12, padding: 12, marginBottom: 9 },
  roomName: { fontSize: 16, fontWeight: 'bold', color: '#24b3b3' },
  roomPrice: { fontSize: 15, color: '#ffb347', fontWeight: '600' },
  roomDesc: { color: '#555', fontSize: 14, marginVertical: 2 },
  roomAm: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginVertical: 3 },
  roomAmItem: { fontSize: 12, color: '#1e7575', backgroundColor: '#e3f6f5', borderRadius: 7, paddingHorizontal: 7, marginRight: 3, marginBottom: 2 },
  avail: { color: '#25D366', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  notAvail: { color: '#ff5e5e', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
});
