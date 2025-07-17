import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import api, { API_ROUTES } from '../utils/api';

const { width, height } = Dimensions.get('window');

type StoreReport = {
  storeName: string;
  address: string;
  salesData: {
    totalNetAmount: number;
    totalBills: number;
    totalItemsSold: number;
    isUploaded: boolean;
    lastUploadDate: string | null;
  };
  trends: {
    previousDay: {
      totalNetAmount: number;
      totalBills: number;
      totalItemsSold: number;
      isUploaded: boolean;
      lastUploadDate: string | null;
    };
    previousWeek: {
      totalNetAmount: number;
      totalBills: number;
      totalItemsSold: number;
      isUploaded: boolean;
      lastUploadDate: string | null;
    };
    previousMonth: {
      totalNetAmount: number;
      totalBills: number;
      totalItemsSold: number;
      isUploaded: boolean;
      lastUploadDate: string | null;
    };
    currentMonth: {
      totalNetAmount: number;
      totalBills: number;
      totalItemsSold: number;
      isUploaded: boolean;
      lastUploadDate: string | null;
    };
  };
};

type StoreReportResponse = {
  selectedDate: string;
  storeReports: StoreReport[];
};

type RootStackParamList = {
  Dashboard: undefined;
  StoreReport: undefined;
};

type Props = {};

const StoreReport: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // State management
  const [storeReports, setStoreReports] = useState<StoreReport[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [loadingStoreExpansion, setLoadingStoreExpansion] = useState<string | null>(null);

  // Scroll state for hiding sections
  const [showStatsSection, setShowStatsSection] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const filtersAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    fetchStoreReport();
    startAnimations();
  }, []);

  useEffect(() => {
    fetchStoreReport();
  }, [selectedDate]);

  useEffect(() => {
    filterStores();
  }, [searchQuery, storeReports]);

  useEffect(() => {
    // Reset all animation values when component mounts
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.8);
    headerAnim.setValue(-100);
    filtersAnim.setValue(0);
    statsAnim.setValue(1);
    pulseAnim.setValue(1);
    glowAnim.setValue(0);
    floatingAnim.setValue(0);
    
    // Start animations after a small delay
    setTimeout(() => {
      startAnimations();
    }, 100);
  }, []);

  const startAnimations = () => {
    // Main entrance animations
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for interactive elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
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

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateCards = () => {
    const animations = cardAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 30,
        useNativeDriver: true,
      })
    );
    Animated.stagger(30, animations).start();
  };

  const fetchStoreReport = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        date: selectedDate.toISOString().split('T')[0],
      };

      if (searchQuery.trim()) {
        params.searchQuery = searchQuery.trim();
      }

      const response = await api.get(API_ROUTES.STORE_SALES_REPORT, { params });
      setStoreReports(response.data.storeReports);

      cardAnims.length = 0;
      response.data.storeReports.forEach(() => {
        cardAnims.push(new Animated.Value(0));
      });
      setTimeout(animateCards, 200);

    } catch (error) {
      console.error('Error fetching store report:', error);
      Alert.alert('Error', 'Failed to fetch store report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterStores = () => {
    if (!searchQuery.trim()) {
      setFilteredStores(storeReports);
      return;
    }

    const filtered = storeReports.filter(store => 
      store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStores(filtered);
  };

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => {
      const newValue = !prev;
      Animated.timing(filtersAnim, {
        toValue: newValue ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      return newValue;
    });
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDate(new Date());
    setExpandedStore(null);
  };

  const toggleStoreExpand = useCallback(async (storeName: string) => {
    setLoadingStoreExpansion(storeName);
    
    // Simulate loading for smooth animation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setExpandedStore(prev => prev === storeName ? null : storeName);
    setLoadingStoreExpansion(null);
  }, []);

  // Date picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
    
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  // Scroll handler for hiding stats
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - scrollY.current;
    
    if (!isScrolling) {
      setIsScrolling(true);
    }

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Hide stats section when scrolling down, show when scrolling up or at top
    if (scrollDelta > 10 && currentScrollY > 50 && showStatsSection) {
      setShowStatsSection(false);
      Animated.timing(statsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if ((scrollDelta < -10 || currentScrollY < 20) && !showStatsSection) {
      setShowStatsSection(true);
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    scrollY.current = currentScrollY;

    // Set timeout to stop scrolling detection
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [showStatsSection, isScrolling]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoreReport();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    const totalAmount = filteredStores.reduce((sum, store) => sum + store.salesData.totalNetAmount, 0);
    const totalBills = filteredStores.reduce((sum, store) => sum + store.salesData.totalBills, 0);
    const totalItems = filteredStores.reduce((sum, store) => sum + store.salesData.totalItemsSold, 0);
    const uploadedStores = filteredStores.filter(store => store.salesData.isUploaded).length;
    
    return { totalAmount, totalBills, totalItems, uploadedStores, totalStores: filteredStores.length };
  };

  const getUploadStatusColor = (isUploaded: boolean) => {
    return isUploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➖';
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const filtersHeight = filtersAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220], // Fixed height
  });

  const filtersOpacity = filtersAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Skeleton loading component
  const SkeletonCard = () => (
    <Animated.View className="mb-4 rounded-2xl bg-white border border-gray-200 p-5">
      <View className="flex-row items-center mb-4">
        <Animated.View 
          className="w-12 h-12 rounded-full bg-gray-200"
          style={{ opacity: pulseAnim }}
        />
        <View className="flex-1 ml-4">
          <Animated.View 
            className="h-4 bg-gray-200 rounded mb-2 w-3/4"
            style={{ opacity: pulseAnim }}
          />
          <Animated.View 
            className="h-3 bg-gray-200 rounded w-1/2"
            style={{ opacity: pulseAnim }}
          />
        </View>
        <View className="items-end">
          <Animated.View 
            className="h-4 bg-gray-200 rounded mb-2 w-20"
            style={{ opacity: pulseAnim }}
          />
          <Animated.View 
            className="h-3 bg-gray-200 rounded w-16"
            style={{ opacity: pulseAnim }}
          />
        </View>
      </View>
      <View className="flex-row gap-2">
        {[1, 2, 3].map((index) => (
          <Animated.View 
            key={index}
            className="flex-1 h-16 bg-gray-200 rounded-lg"
            style={{ opacity: pulseAnim }}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderStoreCard = (store: StoreReport, index: number) => {
    const cardAnim = cardAnims[index] || new Animated.Value(1);
    const isExpanded = expandedStore === store.storeName;
    const isLoading = loadingStoreExpansion === store.storeName;

    return (
      <Animated.View
        key={store.storeName}
        className="mb-4 rounded-2xl bg-white border border-gray-200 shadow-lg"
        style={{
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
            { scale: cardAnim },
          ],
        }}
      >
        {/* Store Header */}
        <TouchableOpacity
          className={`p-5 ${isExpanded ? 'bg-slate-50' : ''}`}
          onPress={() => toggleStoreExpand(store.storeName)}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {/* Store Info Row */}
          <View className="flex-row items-center mb-4">
            {/* Store Icon */}
            <View className="w-12 h-12 rounded-full bg-blue-600 justify-center items-center mr-4">
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-xl font-black text-white">🏪</Text>
              )}
            </View>

            {/* Store Details */}
            <View className="flex-1 mr-4">
              <Text className="text-lg font-bold text-slate-800 mb-1" numberOfLines={1}>
                {store.storeName}
              </Text>
              <Text className="text-sm text-slate-600 mb-2" numberOfLines={2}>
                {store.address}
              </Text>
              <View className="flex-row items-center">
                <View className={`px-2 py-1 rounded-full ${getUploadStatusColor(store.salesData.isUploaded)}`}>
                  <Text className="text-xs font-semibold">
                    {store.salesData.isUploaded ? '✅ Uploaded' : '❌ Not Uploaded'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount & Stats */}
            <View className="items-end">
              <Text className="text-xs text-slate-400 font-medium">Total Sales</Text>
              <Text className="text-lg text-blue-600 font-black mb-1">
                {formatCurrency(store.salesData.totalNetAmount)}
              </Text>
              <Text className="text-xs text-slate-600 font-semibold">
                {store.salesData.totalBills} bills
              </Text>
            </View>

            {/* Expand Arrow */}
            <View className="ml-3">
              <Text className="text-xl text-blue-600 font-bold">{isExpanded ? '↑' : '↓'}</Text>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-slate-50 p-3 rounded-lg">
              <Text className="text-xs text-slate-500 font-medium">Bills</Text>
              <Text className="text-base font-bold text-slate-800">{store.salesData.totalBills}</Text>
            </View>
            <View className="flex-1 bg-slate-50 p-3 rounded-lg">
              <Text className="text-xs text-slate-500 font-medium">Items</Text>
              <Text className="text-base font-bold text-slate-800">{store.salesData.totalItemsSold}</Text>
            </View>
            <View className="flex-1 bg-blue-50 p-3 rounded-lg">
              <Text className="text-xs text-blue-600 font-medium">Upload</Text>
              <Text className="text-xs font-semibold text-slate-600">
                {formatDateTime(store.salesData.lastUploadDate)}
              </Text>
            </View>
          </View>

          {/* Card Glow Effect */}
          <Animated.View 
            className="absolute inset-0 border-2 border-blue-600 rounded-2xl"
            style={{ opacity: glowOpacity }}
          />
        </TouchableOpacity>

        {/* Expanded Store Details */}
        {isExpanded && (
          <Animated.View 
            className="bg-slate-50 border-t border-gray-200 p-5"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <Text className="text-lg font-bold text-slate-800 mb-4">📊 Trends & Comparisons</Text>
            
            {/* Trends Grid */}
            <View className="gap-3">
              {/* Previous Day */}
              <View className="bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">📅</Text>
                    <Text className="text-base font-semibold text-slate-800">Previous Day</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">
                      {getTrendIcon(store.salesData.totalNetAmount, store.trends.previousDay.totalNetAmount)}
                    </Text>
                    <Text className={`text-sm font-bold ${getTrendColor(store.salesData.totalNetAmount, store.trends.previousDay.totalNetAmount)}`}>
                      {formatCurrency(store.trends.previousDay.totalNetAmount)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-slate-50 p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Bills</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.previousDay.totalBills}</Text>
                  </View>
                  <View className="flex-1 bg-slate-50 p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Items</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.previousDay.totalItemsSold}</Text>
                  </View>
                </View>
              </View>

              {/* Previous Week */}
              <View className="bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">🗓️</Text>
                    <Text className="text-base font-semibold text-slate-800">Previous Week</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">
                      {getTrendIcon(store.salesData.totalNetAmount, store.trends.previousWeek.totalNetAmount)}
                    </Text>
                    <Text className={`text-sm font-bold ${getTrendColor(store.salesData.totalNetAmount, store.trends.previousWeek.totalNetAmount)}`}>
                      {formatCurrency(store.trends.previousWeek.totalNetAmount)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-slate-50 p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Bills</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.previousWeek.totalBills}</Text>
                  </View>
                  <View className="flex-1 bg-slate-50 p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Items</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.previousWeek.totalItemsSold}</Text>
                  </View>
                </View>
              </View>

              {/* Previous Month */}
              <View className="bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">🗓️</Text>
                    <Text className="text-base font-semibold text-slate-800">Previous Month</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">
                      {getTrendIcon(store.salesData.totalNetAmount, store.trends.previousMonth.totalNetAmount)}
                    </Text>
                    <Text className={`text-sm font-bold ${getTrendColor(store.salesData.totalNetAmount, store.trends.previousMonth.totalNetAmount)}`}>
                      {formatCurrency(store.trends.previousMonth.totalNetAmount)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-slate-50 p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Bills</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.previousMonth.totalBills}</Text>
                  </View>
                  <View className="flex-1 bg-slate-50 p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Items</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.previousMonth.totalItemsSold}</Text>
                  </View>
                </View>
              </View>

              {/* Current Month */}
              <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">📈</Text>
                    <Text className="text-base font-semibold text-blue-800">Current Month</Text>
                  </View>
                  <Text className="text-sm font-bold text-blue-600">
                    {formatCurrency(store.trends.currentMonth.totalNetAmount)}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-white p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Bills</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.currentMonth.totalBills}</Text>
                  </View>
                  <View className="flex-1 bg-white p-2 rounded-lg">
                    <Text className="text-xs text-slate-500">Items</Text>
                    <Text className="text-sm font-semibold text-slate-800">{store.trends.currentMonth.totalItemsSold}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const stats = getTotalStats();

  if (loading && storeReports.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        {/* Floating Decorative Elements */}
        <Animated.View 
          className="absolute w-30 h-30 bg-blue-50 rounded-full z-10"
          style={{ 
            top: 100, 
            right: 50,
            opacity: glowOpacity,
            transform: [{ translateY: floatingY }, { scale: pulseAnim }]
          }} 
        />
        <Animated.View 
          className="absolute w-20 h-20 bg-blue-100 rounded-full z-10"
          style={{ 
            bottom: 200, 
            left: 30,
            opacity: glowOpacity,
            transform: [{ translateY: floatingY }, { scale: pulseAnim }]
          }} 
        />

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </Animated.View>
        <Text className="mt-5 text-lg text-slate-600 font-medium">Loading store reports...</Text>
        <View className="flex-row mt-5">
          {[0, 1, 2].map((index) => (
            <Animated.View 
              key={index}
              className="w-2 h-2 bg-blue-600 rounded-full mx-1"
              style={{ 
                transform: [{ 
                  scale: pulseAnim.interpolate({
                    inputRange: [0.98, 1.02],
                    outputRange: [0.8, 1.2],
                  })
                }] 
              }} 
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Floating Decorative Elements */}
      <Animated.View 
        className="absolute w-30 h-30 bg-blue-50 rounded-full z-10"
        style={{ 
          top: 120, 
          right: 30,
          opacity: glowOpacity,
          transform: [{ translateY: floatingY }, { scale: pulseAnim }]
        }} 
      />
      <Animated.View 
        className="absolute w-25 h-25 bg-blue-100 rounded-full z-10"
        style={{ 
          bottom: 250, 
          left: -20,
          opacity: glowOpacity,
          transform: [{ translateY: floatingY }, { scale: pulseAnim }]
        }} 
      />

      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />

      {/* Enhanced Header */}
      <Animated.View 
        className="bg-white pt-15 px-5 pb-5 border-b border-slate-100"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: headerAnim }]
        }}
      >
        <View className="flex-row items-center justify-between mb-2.5">
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-slate-50 border border-gray-200 justify-center items-center"
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text className="text-xl text-slate-600 font-bold">←</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-black text-slate-800 mb-1">Store Reports</Text>
            <Text className="text-sm text-slate-600 font-medium">
              {formatDate(selectedDate)} • {stats.totalStores} stores
            </Text>
          </View>
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-blue-600 justify-center items-center"
            onPress={toggleFilters}
            activeOpacity={0.8}
          >
            <Text className="text-xl">🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Header Gradient Line */}
        <Animated.View 
          className="h-1 mt-5 rounded-sm bg-blue-400"
          style={{ transform: [{ scaleX: fadeAnim }] }}
        >
          <View className="absolute right-0 w-2/5 h-full bg-blue-600 rounded-sm" />
        </Animated.View>
      </Animated.View>

      {/* Enhanced Filters Section - Fixed */}
      <Animated.View 
        className="bg-white border-b border-slate-100"
        style={{ 
          height: filtersHeight,
          overflow: 'hidden',
        }}
      >
        <Animated.View 
          className="flex-1"
          style={{ opacity: filtersOpacity }}
        >
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-slate-800">🔍 Filters & Search</Text>
              <TouchableOpacity className="bg-blue-600 py-2 px-4 rounded-2xl" onPress={clearFilters}>
                <Text className="text-white text-sm font-semibold">Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            <View className="mb-5">
              <Text className="text-sm text-slate-600 mb-2 font-semibold">Select Date:</Text>
              <TouchableOpacity 
                className="flex-row justify-between items-center border-2 border-gray-200 rounded-xl p-4 bg-slate-50"
                onPress={openDatePicker}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-base mr-2">📅</Text>
                  <Text className="text-base font-medium text-slate-800">
                    {formatDate(selectedDate)}
                  </Text>
                </View>
                <View className="p-1">
                  <Text className="text-lg opacity-70">🗓️</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="mb-5">
              <Text className="text-sm text-slate-600 mb-2 font-semibold">Search Stores:</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-slate-800 bg-slate-50"
                placeholder="Search by store name or address..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* Stats Summary - Fixed Animation */}
      {showStatsSection && (
        <Animated.View 
          className="px-5 py-4 bg-white"
          style={{
            opacity: statsAnim,
            transform: [{ 
              translateY: statsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              })
            }]
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
            <View className="bg-slate-50 p-4 rounded-xl items-center border border-gray-200 min-w-[90px]">
              <Text className="text-xl font-black text-slate-800 mb-1">{stats.totalStores}</Text>
              <Text className="text-xs text-slate-600 font-semibold">Stores</Text>
            </View>
            <View className="bg-slate-50 p-4 rounded-xl items-center border border-gray-200 min-w-[90px] ml-3">
              <Text className="text-xl font-black text-slate-800 mb-1">{stats.totalBills}</Text>
              <Text className="text-xs text-slate-600 font-semibold">Total Bills</Text>
            </View>
            <View className="bg-slate-50 p-4 rounded-xl items-center border border-gray-200 min-w-[90px] ml-3">
              <Text className="text-xl font-black text-slate-800 mb-1">{stats.totalItems}</Text>
              <Text className="text-xs text-slate-600 font-semibold">Items Sold</Text>
            </View>
            <View className="bg-blue-600 p-4 rounded-xl items-center min-w-[110px] ml-3">
              <Text className="text-base font-black text-white mb-1">{formatCurrency(stats.totalAmount)}</Text>
              <Text className="text-xs text-white opacity-90 font-semibold">Total Sales</Text>
            </View>
            <View className="bg-green-50 p-4 rounded-xl items-center border border-green-200 min-w-[90px] ml-3">
              <Text className="text-xl font-black text-green-700 mb-1">{stats.uploadedStores}</Text>
              <Text className="text-xs text-green-600 font-semibold">Uploaded</Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Store List */}
      <ScrollView
        className="flex-1 px-5 bg-white"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {loading && storeReports.length === 0 ? (
          // Show skeleton cards while loading
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          <>
            {filteredStores.map((store, index) => renderStoreCard(store, index))}
            
            {loading && storeReports.length > 0 && (
              <View className="p-5 items-center">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="mt-2 text-base text-slate-600 font-medium">Loading more data...</Text>
              </View>
            )}

            {filteredStores.length === 0 && !loading && (
              <View className="flex-1 items-center justify-center py-15">
                <Text className="text-6xl mb-5">🏪</Text>
                <Text className="text-2xl font-bold text-slate-800 mb-3">No stores found</Text>
                <Text className="text-base text-slate-600 text-center px-10 leading-6">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No store data available for the selected date'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            className="flex-1 bg-black/50 justify-center items-center"
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <Animated.View 
              className="bg-white rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: width * 0.9,
                maxHeight: height * 0.7,
                transform: [{ scale: scaleAnim }]
              }}
            >
              <View className="bg-blue-600 p-5 flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <Text className="text-lg mr-2">📅</Text>
                  <Text className="text-lg font-bold text-white">
                    Select Date
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-white/20 justify-center items-center"
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-white font-bold">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white py-5 items-center">
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="calendar"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(2020, 0, 1)}
                  style={{
                    width: width * 0.8,
                    height: 300,
                    backgroundColor: '#ffffff',
                  }}
                />
              </View>

              <View className="flex-row justify-around p-5 bg-slate-50 border-t border-gray-200">
                <TouchableOpacity 
                  className="py-3 px-8 rounded-3xl border-2 border-gray-200 bg-white"
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-slate-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="py-3 px-8 rounded-3xl bg-blue-600 border-2 border-blue-600"
                  onPress={() => handleDateChange({ type: 'set' }, selectedDate)}
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-white font-semibold">Confirm</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

export default StoreReport;