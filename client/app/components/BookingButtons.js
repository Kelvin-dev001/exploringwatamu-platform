import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';

export default function BookingButtons({ whatsapp, email }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, styles.whatsapp]}
        onPress={() => Linking.openURL(whatsapp)}
      >
        <Text style={styles.btnText}>Book via WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.email]}
        onPress={() => Linking.openURL(`mailto:${email}`)}
      >
        <Text style={styles.btnText}>Book via Email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
    marginBottom: 30,
  },
  btn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsapp: {
    backgroundColor: '#25D366',
  },
  email: {
    backgroundColor: '#24b3b3',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});