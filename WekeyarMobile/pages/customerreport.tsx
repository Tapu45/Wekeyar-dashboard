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

type Store = {
  id: number;
  storeName: string;
  address: string;
};

type CustomerReportData = {
  customerId: number;
  customerName: string;
  mobileNo: string;
  totalBills: number;
  totalAmount: number;
  dates: {
    date: string;
    totalAmount: number;
    salesBills: {
      billNo: string;
      amount: number;
      medicines: {
        name: string;
        quantity: number;
      }[];
    }[];
    returnBills: {
      billNo: string;
      amount: number;
      medicines: {
        name: string;
        quantity: number;
      }[];
    }[];
  }[];
};

type RootStackParamList = {
  Dashboard: undefined;
  CustomerReport: undefined;
};

type Props = {};

const CustomerReport: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // State management
  const [customers, setCustomers] = useState<CustomerReportData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePickerCalendar, setShowDatePickerCalendar] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('customerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Expanded states (matching web version)
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [loadingCustomerExpansion, setLoadingCustomerExpansion] = useState<number | null>(null);

  // Scroll state for hiding sections
  const [showStatsAndSort, setShowStatsAndSort] = useState(true);
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
  const sortAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    fetchStores();
    startAnimations();
  }, []);

  useEffect(() => {
    if (startDate && endDate && selectedStore !== null && validateDateRange()) {
      fetchCustomerReport();
    }
  }, [selectedStore, startDate, endDate, searchQuery]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [searchQuery, customers, sortField, sortDirection]);

  const validateDateRange = () => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  };

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

  const fetchStores = async () => {
    try {
      const response = await api.get(API_ROUTES.STORES);
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      Alert.alert('Error', 'Failed to fetch stores');
    }
  };

  const fetchCustomerReport = async () => {
    try {
      setLoading(true);
      
      const isBillNo = /^[A-Z]+\/\d+/.test(searchQuery);
      
      const params: any = {
        startDate,
        endDate,
      };

      if (selectedStore && selectedStore !== 0) {
        params.storeId = selectedStore;
      }

      if (searchQuery.trim()) {
        if (isBillNo) {
          params.billNo = searchQuery.trim();
        } else {
          params.search = searchQuery.trim();
        }
      }

      const response = await api.get(API_ROUTES.CUSTOMER_REPORT, { params });
      setCustomers(response.data);

      cardAnims.length = 0;
      response.data.forEach(() => {
        cardAnims.push(new Animated.Value(0));
      });
      setTimeout(animateCards, 200);

    } catch (error) {
      console.error('Error fetching customer report:', error);
      Alert.alert('Error', 'Failed to fetch customer report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'customerName':
          return a.customerName.localeCompare(b.customerName) * direction;
        case 'mobileNo':
          return a.mobileNo.localeCompare(b.mobileNo) * direction;
        case 'totalBills':
          return (a.totalBills - b.totalBills) * direction;
        case 'totalAmount':
          return (a.totalAmount - b.totalAmount) * direction;
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => {
      const newValue = !prev;
      Animated.timing(filtersAnim, {
        toValue: newValue ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
      return newValue;
    });
  }, []);

  const clearFilters = () => {
    setSelectedStore(null);
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setExpandedCustomer(null);
    setExpandedDate(null);
    setExpandedBill(null);
  };

  const toggleCustomerExpand = useCallback(async (customerIndex: number) => {
    setLoadingCustomerExpansion(customerIndex);
    
    // Simulate loading for smooth animation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setExpandedCustomer(prev => prev === customerIndex ? null : customerIndex);
    setExpandedDate(null);
    setExpandedBill(null);
    setLoadingCustomerExpansion(null);
  }, []);

  const toggleDateExpand = useCallback((date: string) => {
    setExpandedDate(prev => prev === date ? null : date);
    setExpandedBill(null);
  }, []);

  const toggleBillExpand = useCallback((billNo: string) => {
    setExpandedBill(prev => prev === billNo ? null : billNo);
  }, []);

  // Calendar handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePickerCalendar(null);
      return;
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      if (showDatePickerCalendar === 'start') {
        setStartDate(formattedDate);
      } else if (showDatePickerCalendar === 'end') {
        setEndDate(formattedDate);
      }
    }
    
    setShowDatePickerCalendar(null);
  };

  const openDatePicker = (type: 'start' | 'end') => {
    const currentDate = type === 'start' 
      ? (startDate ? new Date(startDate) : new Date())
      : (endDate ? new Date(endDate) : new Date());
    
    setTempDate(currentDate);
    setShowDatePickerCalendar(type);
  };

  // Scroll handler for hiding stats and sort
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

    // Hide sections when scrolling down, show when scrolling up
    if (scrollDelta > 10 && showStatsAndSort) {
      setShowStatsAndSort(false);
      Animated.parallel([
        Animated.timing(statsAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sortAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (scrollDelta < -10 && !showStatsAndSort) {
      setShowStatsAndSort(true);
      Animated.parallel([
        Animated.timing(statsAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sortAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    scrollY.current = currentScrollY;

    // Set timeout to stop scrolling detection
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [showStatsAndSort, isScrolling]);

  const onRefresh = () => {
    setRefreshing(true);
    if (startDate && endDate && selectedStore !== null) {
      fetchCustomerReport();
    } else {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getTotalStats = () => {
    const totalCustomers = filteredCustomers.length;
    const totalAmount = filteredCustomers.reduce((sum, customer) => sum + customer.totalAmount, 0);
    const totalBills = filteredCustomers.reduce((sum, customer) => sum + customer.totalBills, 0);
    
    return { totalCustomers, totalAmount, totalBills };
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
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
    outputRange: [0, 300],
  });

  // Skeleton loading component
  const SkeletonCard = () => (
    <Animated.View className="mb-4 rounded-2xl bg-white border border-gray-200 p-5">
      <View className="flex-row items-center">
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
            className="h-3 bg-gray-200 rounded mb-1 w-1/2"
            style={{ opacity: pulseAnim }}
          />
          <Animated.View 
            className="h-3 bg-gray-200 rounded w-1/3"
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
    </Animated.View>
  );

  const renderCustomerCard = (customer: CustomerReportData, index: number) => {
    const cardAnim = cardAnims[index] || new Animated.Value(1);
    const isExpanded = expandedCustomer === index;
    const isLoading = loadingCustomerExpansion === index;

    return (
      <Animated.View
        key={customer.customerId}
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
        {/* Customer Header */}
        <TouchableOpacity
          className={`p-5 flex-row items-center ${isExpanded ? 'bg-slate-50' : ''}`}
          onPress={() => toggleCustomerExpand(index)}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {/* Customer Avatar */}
          <View className="w-12 h-12 rounded-full bg-blue-600 justify-center items-center mr-4">
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-xl font-black text-white">
                {customer.customerName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Customer Info */}
          <View className="flex-1 mr-4">
            <Text className="text-lg font-bold text-slate-800 mb-2" numberOfLines={1}>
              {customer.customerName}
            </Text>
            <View className="flex-row items-center mb-1">
              <Text className="text-sm mr-2">📱</Text>
              <Text className="text-sm text-slate-600 font-medium">{customer.mobileNo}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-sm mr-2">📄</Text>
              <Text className="text-sm text-blue-600 font-semibold">{customer.totalBills} bills</Text>
            </View>
          </View>

          {/* Amount Info */}
          <View className="items-end">
            <Text className="text-xs text-slate-400 font-medium">Total Amount</Text>
            <Text className="text-lg text-blue-600 font-black mb-1">
              {formatCurrency(customer.totalAmount)}
            </Text>
            <Text className="text-xs text-slate-600 font-semibold">
              {customer.dates.length} purchase days
            </Text>
          </View>

          {/* Expand Arrow */}
          <View className="ml-3">
            <Text className="text-xl text-blue-600 font-bold">{isExpanded ? '↑' : '↓'}</Text>
          </View>

          {/* Card Glow Effect */}
          <Animated.View 
            className="absolute inset-0 border-2 border-blue-600 rounded-2xl"
            style={{ opacity: glowOpacity }}
          />
        </TouchableOpacity>

        {/* Expanded Customer Details */}
        {isExpanded && (
          <Animated.View 
            className="bg-slate-50 border-t border-gray-200"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View className="p-4">
              {customer.dates
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((dateEntry) => (
                  <View key={dateEntry.date} className="bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden">
                    {/* Date Header */}
                    <TouchableOpacity
                      className={`p-4 flex-row justify-between items-center ${expandedDate === dateEntry.date ? 'bg-blue-50' : 'bg-white'}`}
                      onPress={() => toggleDateExpand(dateEntry.date)}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-base mr-2">📅</Text>
                        <Text className="text-base font-semibold text-slate-800">{formatDate(dateEntry.date)}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold text-blue-600 mr-2">
                          {formatCurrency(dateEntry.totalAmount)}
                        </Text>
                        <Text className="text-sm text-slate-600">
                          {expandedDate === dateEntry.date ? '↑' : '↓'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Date Details */}
                    {expandedDate === dateEntry.date && (
                      <Animated.View className="bg-slate-50 border-t border-gray-200">
                        {/* Sales Bills Section */}
                        <View className="p-4 border-b border-gray-200">
                          <View className="flex-row items-center mb-3">
                            <Text className="text-base mr-2">💰</Text>
                            <Text className="text-base font-bold text-slate-800 flex-1">Sales Bills</Text>
                            <Text className="text-sm text-blue-600 font-semibold">({dateEntry.salesBills.length})</Text>
                          </View>
                          
                          {dateEntry.salesBills.map((bill) => (
                            <View key={bill.billNo} className="bg-white rounded-lg mb-2 border border-gray-200 overflow-hidden">
                              <TouchableOpacity
                                className={`p-3 flex-row justify-between items-center ${expandedBill === bill.billNo ? 'bg-slate-50' : ''}`}
                                onPress={() => toggleBillExpand(bill.billNo)}
                                activeOpacity={0.8}
                              >
                                <View className="flex-row items-center">
                                  <Text className="text-sm mr-2">🧾</Text>
                                  <Text className="text-sm font-semibold text-slate-800">#{bill.billNo}</Text>
                                </View>
                                <View className="flex-row items-center">
                                  <Text className="text-sm font-bold text-blue-600 mr-2">
                                    {formatCurrency(bill.amount)}
                                  </Text>
                                  <Text className="text-xs text-slate-600">
                                    {expandedBill === bill.billNo ? '↑' : '↓'}
                                  </Text>
                                </View>
                              </TouchableOpacity>

                              {/* Expanded Bill Details (Medicines) */}
                              {expandedBill === bill.billNo && (
                                <Animated.View className="bg-slate-50 border-t border-gray-200 p-3">
                                  <View className="flex-row items-center mb-2">
                                    <Text className="text-sm mr-2">💊</Text>
                                    <Text className="text-sm font-semibold text-slate-600">Medicines:</Text>
                                  </View>
                                  {bill.medicines.map((medicine, medIndex) => (
                                    <View key={medIndex} className="flex-row items-center justify-between bg-white p-2 rounded-md mb-1 border border-gray-200">
                                      <View className="flex-row items-center flex-1 mr-2">
                                        <Text className="text-xs text-blue-600 mr-1.5">•</Text>
                                        <Text className="text-xs text-slate-600 flex-1" numberOfLines={2}>
                                          {medicine.name}
                                        </Text>
                                      </View>
                                      <View className="flex-row items-center">
                                        <Text className="text-xs mr-1">📦</Text>
                                        <Text className="text-xs font-semibold text-blue-600">
                                          {medicine.quantity}
                                        </Text>
                                      </View>
                                    </View>
                                  ))}
                                </Animated.View>
                              )}
                            </View>
                          ))}
                        </View>

                        {/* Return Bills Section */}
                        <View className="p-4">
                          <View className="flex-row items-center mb-3">
                            <Text className="text-base mr-2">↩️</Text>
                            <Text className="text-base font-bold text-red-500 flex-1">Return Bills</Text>
                            <Text className="text-sm text-blue-600 font-semibold">({dateEntry.returnBills.length})</Text>
                          </View>
                          
                          {dateEntry.returnBills.length > 0 ? (
                            dateEntry.returnBills.map((bill) => (
                              <View key={bill.billNo} className="bg-red-50 rounded-lg mb-2 border border-red-200 overflow-hidden">
                                <TouchableOpacity
                                  className={`p-3 flex-row justify-between items-center ${expandedBill === bill.billNo ? 'bg-slate-50' : ''}`}
                                  onPress={() => toggleBillExpand(bill.billNo)}
                                  activeOpacity={0.8}
                                >
                                  <View className="flex-row items-center">
                                    <Text className="text-sm mr-2">📋</Text>
                                    <Text className="text-sm font-semibold text-slate-800">#{bill.billNo}</Text>
                                  </View>
                                  <View className="flex-row items-center">
                                    <Text className="text-sm font-bold text-red-500 mr-2">
                                      -{formatCurrency(Math.abs(bill.amount))}
                                    </Text>
                                    <Text className="text-xs text-slate-600">
                                      {expandedBill === bill.billNo ? '↑' : '↓'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>

                                {/* Expanded Return Bill Details */}
                                {expandedBill === bill.billNo && (
                                  <Animated.View className="bg-slate-50 border-t border-gray-200 p-3">
                                    <View className="flex-row items-center mb-2">
                                      <Text className="text-sm mr-2">💊</Text>
                                      <Text className="text-sm font-semibold text-slate-600">Returned Items:</Text>
                                    </View>
                                    {bill.medicines.map((medicine, medIndex) => (
                                      <View key={medIndex} className="flex-row items-center justify-between bg-red-50 p-2 rounded-md mb-1 border border-red-200">
                                        <View className="flex-row items-center flex-1 mr-2">
                                          <Text className="text-xs text-blue-600 mr-1.5">•</Text>
                                          <Text className="text-xs text-slate-600 flex-1" numberOfLines={2}>
                                            {medicine.name}
                                          </Text>
                                        </View>
                                        <View className="flex-row items-center">
                                          <Text className="text-xs mr-1">📦</Text>
                                          <Text className="text-xs font-semibold text-blue-600">
                                            {medicine.quantity}
                                          </Text>
                                        </View>
                                      </View>
                                    ))}
                                  </Animated.View>
                                )}
                              </View>
                            ))
                          ) : (
                            <View className="p-4 items-center">
                              <Text className="text-sm text-slate-400 italic">No return bills for this date</Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    )}
                  </View>
                ))}
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const stats = getTotalStats();

  if (loading && customers.length === 0) {
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
        <Text className="mt-5 text-lg text-slate-600 font-medium">Loading customer report...</Text>
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
            <Text className="text-2xl font-black text-slate-800 mb-1">Customer Report</Text>
            <Text className="text-sm text-slate-600 font-medium">
              {stats.totalCustomers} customers • {formatCurrency(stats.totalAmount)}
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

      {/* Enhanced Filters Section */}
      <Animated.View 
        className="bg-white overflow-hidden border-b border-slate-100"
        style={{ height: filtersHeight }}
      >
        {showFilters && (
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-slate-800">🔍 Filters & Search</Text>
              <TouchableOpacity className="bg-blue-600 py-2 px-4 rounded-2xl" onPress={clearFilters}>
                <Text className="text-white text-sm font-semibold">Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Store Dropdown */}
            <View className="mb-5">
              <Text className="text-sm text-slate-600 mb-2 font-semibold">Store:</Text>
              <TouchableOpacity 
                className="flex-row justify-between items-center border-2 border-gray-200 rounded-xl p-4 bg-slate-50"
                onPress={() => setShowStoreDropdown(true)}
                activeOpacity={0.8}
              >
                <Text className="text-base text-slate-800 font-medium">
                  {selectedStore === null ? 'Select Store' : selectedStore === 0 ? 'All Stores' : stores.find(s => s.id === selectedStore)?.storeName}
                </Text>
                <Text className="text-xs text-slate-600">▼</Text>
              </TouchableOpacity>
            </View>

            {/* Date Range with Calendar */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-sm text-slate-600 mb-2 font-semibold">From Date:</Text>
                <TouchableOpacity 
                  className={`flex-row justify-between items-center border-2 border-gray-200 rounded-xl p-4 ${selectedStore === null ? 'bg-slate-100' : 'bg-slate-50'}`}
                  onPress={() => selectedStore !== null && openDatePicker('start')}
                  disabled={selectedStore === null}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="text-base mr-2">📅</Text>
                    <Text className={`text-base font-medium ${selectedStore === null ? 'text-slate-400' : 'text-slate-800'}`}>
                      {startDate ? formatDate(startDate) : 'Select Start Date'}
                    </Text>
                  </View>
                  {selectedStore !== null && (
                    <View className="p-1">
                      <Text className="text-lg opacity-70">🗓️</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              <View className="flex-1">
                <Text className="text-sm text-slate-600 mb-2 font-semibold">To Date:</Text>
                <TouchableOpacity 
                  className={`flex-row justify-between items-center border-2 border-gray-200 rounded-xl p-4 ${selectedStore === null ? 'bg-slate-100' : 'bg-slate-50'}`}
                  onPress={() => selectedStore !== null && openDatePicker('end')}
                  disabled={selectedStore === null}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="text-base mr-2">📅</Text>
                    <Text className={`text-base font-medium ${selectedStore === null ? 'text-slate-400' : 'text-slate-800'}`}>
                      {endDate ? formatDate(endDate) : 'Select End Date'}
                    </Text>
                  </View>
                  {selectedStore !== null && (
                    <View className="p-1">
                      <Text className="text-lg opacity-70">🗓️</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Input */}
            <View className="mb-5">
              <Text className="text-sm text-slate-600 mb-2 font-semibold">Search (Name, Mobile, or Bill No):</Text>
              <TextInput
                className={`border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-slate-800 ${selectedStore === null ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                placeholder="Search by name, phone, or bill number..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                editable={selectedStore !== null}
              />
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Stats Summary - Animated */}
      <Animated.View 
        className="flex-row px-5 py-4 gap-3"
        style={{
          opacity: statsAnim,
          transform: [{ 
            translateY: statsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0],
            })
          }]
        }}
      >
        <View className="flex-1 bg-slate-50 p-4 rounded-xl items-center border border-gray-200">
          <Text className="text-xl font-black text-slate-800 mb-1">{stats.totalCustomers}</Text>
          <Text className="text-xs text-slate-600 font-semibold">Customers</Text>
        </View>
        <View className="flex-1 bg-slate-50 p-4 rounded-xl items-center border border-gray-200">
          <Text className="text-xl font-black text-slate-800 mb-1">{stats.totalBills}</Text>
          <Text className="text-xs text-slate-600 font-semibold">Total Bills</Text>
        </View>
        <View className="flex-1 bg-blue-600 p-4 rounded-xl items-center">
          <Text className="text-base font-black text-white mb-1">{formatCurrency(stats.totalAmount)}</Text>
          <Text className="text-xs text-white opacity-90 font-semibold">Total Amount</Text>
        </View>
      </Animated.View>

      {/* Sort Options - Animated */}
      {filteredCustomers.length > 0 && (
        <Animated.View 
          className="bg-white px-5 py-2.5 border-b border-slate-100"
          style={{
            opacity: sortAnim,
            transform: [{ 
              translateY: sortAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              })
            }]
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className={`px-4 py-2 mr-2 rounded-2xl border ${sortField === 'customerName' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-gray-200'}`}
              onPress={() => handleSort('customerName')}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold ${sortField === 'customerName' ? 'text-white' : 'text-slate-600'}`}>
                Name {getSortIcon('customerName')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 mr-2 rounded-2xl border ${sortField === 'mobileNo' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-gray-200'}`}
              onPress={() => handleSort('mobileNo')}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold ${sortField === 'mobileNo' ? 'text-white' : 'text-slate-600'}`}>
                Mobile {getSortIcon('mobileNo')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 mr-2 rounded-2xl border ${sortField === 'totalBills' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-gray-200'}`}
              onPress={() => handleSort('totalBills')}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold ${sortField === 'totalBills' ? 'text-white' : 'text-slate-600'}`}>
                Bills {getSortIcon('totalBills')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 mr-2 rounded-2xl border ${sortField === 'totalAmount' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-gray-200'}`}
              onPress={() => handleSort('totalAmount')}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold ${sortField === 'totalAmount' ? 'text-white' : 'text-slate-600'}`}>
                Amount {getSortIcon('totalAmount')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}

      {/* Customer List */}
      <ScrollView
        className="flex-1 px-5"
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
        {loading && customers.length === 0 ? (
          // Show skeleton cards while loading
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          <>
            {filteredCustomers.map((customer, index) => renderCustomerCard(customer, index))}
            
            {loading && customers.length > 0 && (
              <View className="p-5 items-center">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="mt-2 text-base text-slate-600 font-medium">Loading more data...</Text>
              </View>
            )}

            {filteredCustomers.length === 0 && !loading && (
              <View className="flex-1 items-center justify-center py-15">
                <Text className="text-6xl mb-5">📊</Text>
                <Text className="text-2xl font-bold text-slate-800 mb-3">No customer data found</Text>
                <Text className="text-base text-slate-600 text-center px-10 leading-6">
                  {searchQuery ? 'Try adjusting your search criteria' : selectedStore === null ? 'Please select a store and date range' : 'No customers found for the selected filters'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Store Dropdown Modal */}
      <Modal
        visible={showStoreDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStoreDropdown(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowStoreDropdown(false)}
        >
          <Animated.View 
            className="bg-white rounded-2xl w-5/6 max-h-96 p-5 shadow-2xl"
            style={{ transform: [{ scale: scaleAnim }] }}
          >
            <Text className="text-xl font-bold text-slate-800 text-center mb-5">Select Store</Text>
            <ScrollView>
              <TouchableOpacity
                className="p-4 border-b border-slate-100 rounded-lg mb-1"
                onPress={() => {
                  setSelectedStore(0);
                  setShowStoreDropdown(false);
                }}
                activeOpacity={0.8}
              >
                <Text className="text-base text-slate-800 font-medium">🏪 All Stores</Text>
              </TouchableOpacity>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  className="p-4 border-b border-slate-100 rounded-lg mb-1"
                  onPress={() => {
                    setSelectedStore(store.id);
                    setShowStoreDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-slate-800 font-medium">🏬 {store.storeName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Date Picker */}
      {showDatePickerCalendar && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePickerCalendar(null)}
        >
          <TouchableOpacity 
            className="flex-1 bg-black/50 justify-center items-center"
            activeOpacity={1}
            onPress={() => setShowDatePickerCalendar(null)}
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
                    Select {showDatePickerCalendar === 'start' ? 'Start' : 'End'} Date
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-white/20 justify-center items-center"
                  onPress={() => setShowDatePickerCalendar(null)}
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-white font-bold">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white py-5 items-center">
                <DateTimePicker
                  value={tempDate}
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
                  onPress={() => setShowDatePickerCalendar(null)}
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-slate-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="py-3 px-8 rounded-3xl bg-blue-600 border-2 border-blue-600"
                  onPress={() => handleDateChange({ type: 'set' }, tempDate)}
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

export default CustomerReport;