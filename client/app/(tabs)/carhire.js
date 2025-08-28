import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';
import { API_URL } from '../utils/api';
export default function CarHireListScreen() {
  const [carHires, setCarHires] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/carhire`)
      .then(res => setCarHires(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <View className="flex-1 bg-brand-teal p-4">
      <Text className="text-2xl text-brand-cream mb-2">Car Hire</Text>
      <FlatList
        data={carHires}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View className="bg-brand-cream rounded p-2 mb-4">
            <Text className="text-lg text-brand-teal">{item.vehicleType}</Text>
            <Text>{item.description}</Text>
            <Text>Price per day: ${item.pricePerDay}</Text>
          </View>
        )}
      />
    </View>
  );
}