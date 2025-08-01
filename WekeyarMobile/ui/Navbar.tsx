import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Dashboard: undefined;
  InactiveCustomerList: any;
  CustomerReport: undefined;
  StoreReport: undefined;
  UserCreation: undefined;
};

type NavItem = {
  name: keyof RootStackParamList;
  title: string;
  icon: string;
  color: string;
};

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    title: 'Dashboard',
    icon: '📊',
    color: '#2563eb',
  },
  {
    name: 'InactiveCustomerList',
    title: 'Inactive',
    icon: '👥',
    color: '#7c3aed',
  },
  {
    name: 'CustomerReport',
    title: 'Customers',
    icon: '📈',
    color: '#059669',
  },
  {
    name: 'StoreReport',
    title: 'Stores',
    icon: '🏪',
    color: '#dc2626',
  },
  {
    name: 'UserCreation',
    title: 'Users',
    icon: '👤',
    color: '#ea580c',
  },
];

const CustomNavbar: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const activeIndicatorAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Active indicator animation
    const currentIndex = navItems.findIndex(item => item.name === route.name);
    if (currentIndex !== -1) {
      Animated.spring(activeIndicatorAnim, {
        toValue: currentIndex,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [route.name]);

  const handleNavigation = (screenName: keyof RootStackParamList) => {
    if (screenName === 'InactiveCustomerList') {
      navigation.navigate(screenName, {
        selectedStore: null,
        fromDate: '',
        toDate: '',
      });
    } else {
      navigation.navigate(screenName);
    }
  };

  const itemWidth = width / navItems.length;
  const indicatorTranslateX = activeIndicatorAnim.interpolate({
    inputRange: navItems.map((_, index) => index),
    outputRange: navItems.map((_, index) => index * itemWidth),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.navbar,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Background Gradient */}
        <View style={styles.backgroundGradient} />
        
        {/* Active Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: itemWidth,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />

        {/* Navigation Items - Scrollable for 5 items */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navContainer}
        >
          {navItems.map((item, index) => {
            const isActive = route.name === item.name;
            
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, { width: itemWidth }]}
                onPress={() => handleNavigation(item.name)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.navItemContent,
                    isActive && styles.activeNavItem,
                    isActive && { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <View style={[
                    styles.iconContainer,
                    isActive && { backgroundColor: item.color }
                  ]}>
                    <Text style={[
                      styles.icon,
                      isActive && styles.activeIcon
                    ]}>
                      {item.icon}
                    </Text>
                  </View>
                  <Text style={[
                    styles.navTitle,
                    isActive && { color: item.color, fontWeight: '700' }
                  ]}>
                    {item.title}
                  </Text>
                </Animated.View>
                
                {/* Glow Effect for Active Item */}
                {isActive && (
                  <Animated.View 
                    style={[
                      styles.glowEffect,
                      { 
                        backgroundColor: item.color,
                        transform: [{ scale: pulseAnim }]
                      }
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Floating Decorative Elements */}
        <Animated.View 
          style={[
            styles.floatingElement,
            {
              transform: [{ scale: pulseAnim }, { rotate: '45deg' }]
            }
          ]}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
  },
  navbar: {
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#2563eb',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 4,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    minHeight: 60,
  },
  activeNavItem: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    backgroundColor: '#f8fafc',
  },
  icon: {
    fontSize: 14,
  },
  activeIcon: {
    fontSize: 16,
  },
  navTitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.1,
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  floatingElement: {
    position: 'absolute',
    top: 10,
    right: 30,
    width: 6,
    height: 6,
    backgroundColor: '#60a5fa',
    borderRadius: 3,
    opacity: 0.3,
  },
});

export default CustomNavbar;