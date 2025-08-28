import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';
import { API_URL } from '../utils/api';

export default function HotelListScreen() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/hotels`)
      .then(res => setHotels(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <View className="flex-1 bg-brand-teal p-4">
      <Text className="text-2xl text-brand-cream mb-2">Hotels</Text>
      <FlatList
        data={hotels}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View className="bg-brand-cream rounded p-2 mb-4">
            <Text className="text-lg text-brand-teal">{item.name}</Text>
            <Text>{item.description}</Text>
            <Text>Price per night: ${item.pricePerNight}</Text>
          </View>
        )}
      />
    </View>
  );
}