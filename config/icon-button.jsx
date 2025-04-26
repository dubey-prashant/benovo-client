import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const TabBarIconButton = ({
  iconName,
  label,
  onPress,
  isActive,
  color = '#78909C',
  activeColor = '#1976D2',
  size = 24,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={iconName}
          size={size}
          color={isActive ? activeColor : color}
        />
      </View>
      <Text style={[styles.label, { color: isActive ? activeColor : color }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
