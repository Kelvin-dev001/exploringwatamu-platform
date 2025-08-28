import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';
import { API_URL } from '../utils/api';

export default function TourListScreen() {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/tours`)
      .then(res => setTours(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <View className="flex-1 bg-brand-teal p-4">
      <Text className="text-2xl text-brand-cream mb-2">Tours</Text>
      <FlatList
        data={tours}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View className="bg-brand-cream rounded p-2 mb-4">
            <Text className="text-lg text-brand-teal">{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>Resident Price: ${item.residentPrice}</Text>
            <Text>Non-Resident Price: ${item.nonResidentPrice}</Text>
            <Text>Available Dates: {item.dates && item.dates.join(', ')}</Text>
          </View>
        )}
      />
    </View>
  );
}