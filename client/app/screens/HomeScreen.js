import { View, Text, Image } from 'react-native';
export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-brand-teal">
      <Image source={require('../assets/logo.png')} style={{ width: 120, height: 120 }} />
      <Text className="text-3xl text-brand-cream mt-4">Exploring Watamu</Text>
      <Text className="text-lg text-brand-orange mb-8">Your gateway to sweetness</Text>
      {/* Add animated navigation buttons here */}
    </View>
  );
}