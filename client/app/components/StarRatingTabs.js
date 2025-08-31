import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const STARS = [
  { key: 5, label: '5 Stars' },
  { key: 4, label: '4 Stars' },
  { key: 3, label: '3 Stars' },
  { key: null, label: 'All' },
];

export default function StarRatingTabs({ selectedStar, onSelect }) {
  return (
    <View style={styles.tabs}>
      {STARS.map(star => (
        <TouchableOpacity
          key={star.key === null ? 'all' : star.key}
          style={[
            styles.tab,
            selectedStar === star.key && styles.selectedTab
          ]}
          onPress={() => onSelect(star.key)}
        >
          <Text style={[
            styles.tabText,
            selectedStar === star.key && styles.selectedTabText
          ]}>
            {star.label}
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
    marginBottom: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fbeec1',
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
    fontSize: 15,
    color: '#24b3b3',
    fontWeight: '500',
  },
  selectedTabText: {
    color: '#fff',
    fontWeight: '700',
  },
});