import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const TYPES = [
  { key: 'hotel', label: 'Hotels' },
  { key: 'airbnb', label: 'Airbnbs' },
  { key: 'villa', label: 'Villas' },
];

export default function AccommodationTypeTabs({ selectedType, onSelect }) {
  return (
    <View style={styles.tabs}>
      {TYPES.map(type => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.tab,
            selectedType === type.key && styles.selectedTab
          ]}
          onPress={() => onSelect(type.key)}
        >
          <Text style={[
            styles.tabText,
            selectedType === type.key && styles.selectedTabText
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3f6f5',
    borderRadius: 18,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#24b3b3',
  },
  selectedTab: {
    backgroundColor: '#24b3b3',
    borderColor: '#24b3b3',
  },
  tabText: {
    fontSize: 16,
    color: '#24b3b3',
    fontWeight: '500',
  },
  selectedTabText: {
    color: '#fff',
    fontWeight: '700',
  },
});