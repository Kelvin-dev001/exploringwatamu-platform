import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';
import { API_URL } from '../utils/api';

export default function TransferListScreen() {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/transfers`)
      .then(res => setTransfers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <View className="flex-1 bg-brand-teal p-4">
      <Text className="text-2xl text-brand-cream mb-2">Transfers</Text>
      <FlatList
        data={transfers}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View className="bg-brand-cream rounded p-2 mb-4">
            <Text className="text-lg text-brand-teal">{item.route}</Text>
            <Text>Vehicle: {item.vehicleType}</Text>
            <Text>Price: ${item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}