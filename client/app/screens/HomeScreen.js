import React from 'react';
import { View, Text, Button, Image } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#24b3b3' }}>
      <Image source={require('../assets/logo.png')} style={{ width: 120, height: 120 }} />
      <Text style={{ fontSize: 24, color: '#fbeec1', marginTop: 16 }}>Explore Watamu</Text>
      <Text style={{ fontSize: 18, color: '#ffb347', marginBottom: 24 }}>Your gateway to paradise</Text>
      <Button title="Hotels" onPress={() => navigation.navigate('Hotels')} />
      <Button title="Transfers" onPress={() => navigation.navigate('Transfers')} />
      <Button title="Tours" onPress={() => navigation.navigate('Tours')} />
      <Button title="Services" onPress={() => navigation.navigate('Services')} />
      <Button title="Car Hire" onPress={() => navigation.navigate('Car Hire')} />
    </View>
  );
}