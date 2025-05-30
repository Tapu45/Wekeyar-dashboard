import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import api, { API_ROUTES } from '../utils/api';
import Layout from '../ui/Layout';

const { width, height } = Dimensions.get('window');

type Store = {
  id: number;
  storeName: string;
  address: string;
};

type InactiveCustomer = {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: string | null;
  storeName: string | null;
  lastCalledDate: string | null;
};

type PurchaseHistory = {
  [monthKey: string]: {
    totalAmount: number;
    totalBills: number;
    dailyData: {
      [dayKey: string]: {
        totalAmount: number;
        bills: {
          billNo: string;
          amount: number;
          medicines: {
            name: string;
            quantity: number;
          }[];
        }[];
      };
    };
  };
};

type RootStackParamList = {
  Dashboard: undefined;
  InactiveCustomerList: {
    selectedStore: Store | null;
    fromDate: string;
    toDate: string;
  };
};

type Props = {};

const InactiveCustomerList: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as any;

  const [customers, setCustomers] = useState<InactiveCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<InactiveCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<InactiveCustomer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>([]).current;

  const { selectedStore, fromDate, toDate } = params || {};

  useEffect(() => {
    fetchInactiveCustomers(1, false);
    startAnimations();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const startAnimations = () => {
    // Main entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for interactive elements
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
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, animations).start();
  };

  const fetchInactiveCustomers = async (pageNum: number = 1, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      }

      const queryParams: any = {
        page: pageNum,
        pageSize: 50,
      };

      if (selectedStore && selectedStore.id !== 0) {
        queryParams.storeId = selectedStore.id;
      }

      if (fromDate) {
        queryParams.fromDate = fromDate;
      }

      if (toDate) {
        queryParams.toDate = toDate;
      }

      const response = await api.get(API_ROUTES.INACTIVE_CUSTOMERS, { params: queryParams });
      const data = response.data;

      const newCustomers = isLoadMore ? [...customers, ...data.items] : data.items;
      setCustomers(newCustomers);

      // Create animations for new cards
      if (!isLoadMore) {
        cardAnims.length = 0;
        data.items.forEach(() => {
          cardAnims.push(new Animated.Value(0));
        });
        setTimeout(animateCards, 300);
      }

      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching inactive customers:', error);
      Alert.alert('Error', 'Failed to fetch inactive customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      (customer.storeName && customer.storeName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  };

  const fetchPurchaseHistory = async (customerId: number) => {
    try {
      setHistoryLoading(true);
      const response = await api.get(
        API_ROUTES.CUSTOMER_PURCHASE_HISTORY.replace(':customerId', customerId.toString())
      );
      setPurchaseHistory(response.data);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      Alert.alert('Error', 'Failed to fetch purchase history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCustomerPress = (customer: InactiveCustomer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    fetchPurchaseHistory(customer.id);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    Animated.timing(searchAnim, {
      toValue: showSearch ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInactiveCustomers(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchInactiveCustomers(page + 1, true);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const getDaysSinceLastPurchase = (lastPurchaseDate: string | null) => {
    if (!lastPurchaseDate) return '∞';
    const days = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  const getStatusColor = (lastPurchaseDate: string | null) => {
    if (!lastPurchaseDate) return '#ef4444'; // red-500
    const days = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 90) return '#ef4444'; // red-500
    if (days > 60) return '#f59e0b'; // amber-500
    return '#84cc16'; // lime-500
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const renderCustomerCard = (customer: InactiveCustomer, index: number) => {
    const cardAnim = cardAnims[index] || new Animated.Value(1);
    const statusColor = getStatusColor(customer.lastPurchaseDate);
    const daysSince = getDaysSinceLastPurchase(customer.lastPurchaseDate);

    return (
      <Animated.View
        key={customer.id}
        style={[
          styles.customerCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              { scale: cardAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.customerCardContent}
          onPress={() => handleCustomerPress(customer)}
          activeOpacity={0.7}
        >
          {/* Status Indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{daysSince}</Text>
          </View>

          {/* Customer Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Customer Info */}
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer.name}
            </Text>
            <View style={styles.customerMetaRow}>
              <Text style={styles.phoneIcon}>📱</Text>
              <Text style={styles.customerPhone}>{customer.phone}</Text>
            </View>
            {customer.storeName && (
              <View style={styles.customerMetaRow}>
                <Text style={styles.storeIcon}>🏪</Text>
                <Text style={styles.storeName} numberOfLines={1}>
                  {customer.storeName}
                </Text>
              </View>
            )}
          </View>

          {/* Purchase Info */}
          <View style={styles.purchaseInfo}>
            <Text style={styles.lastPurchaseLabel}>Last Purchase</Text>
            <Text style={styles.lastPurchaseDate}>
              {formatDate(customer.lastPurchaseDate)}
            </Text>
            {customer.lastCalledDate && (
              <>
                <Text style={styles.lastCalledLabel}>Last Called</Text>
                <Text style={styles.lastCalledDate}>
                  {formatDate(customer.lastCalledDate)}
                </Text>
              </>
            )}
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>

          {/* Card Glow Effect */}
          <Animated.View 
            style={[
              styles.cardGlow,
              { opacity: glowOpacity }
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPurchaseHistory = () => {
    if (!purchaseHistory) return null;

    return (
      <ScrollView style={styles.historyContent} showsVerticalScrollIndicator={false}>
        {Object.entries(purchaseHistory)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, monthData]) => (
            <Animated.View 
              key={monthKey} 
              style={[
                styles.monthContainer,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <View style={styles.monthHeader}>
                <View>
                  <Text style={styles.monthTitle}>{formatMonthYear(monthKey)}</Text>
                  <Text style={styles.monthStats}>
                    📊 {monthData.totalBills} bills • {formatCurrency(monthData.totalAmount)}
                  </Text>
                </View>
                <View style={styles.monthIconContainer}>
                  <Text style={styles.monthIcon}>📅</Text>
                </View>
              </View>

              {Object.entries(monthData.dailyData)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dayKey, dayData]) => (
                  <View key={dayKey} style={styles.dayContainer}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayTitle}>
                        {new Date(dayKey).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      <Text style={styles.dayAmount}>
                        {formatCurrency(dayData.totalAmount)}
                      </Text>
                    </View>

                    {dayData.bills.map((bill, index) => (
                      <View key={index} style={styles.billContainer}>
                        <View style={styles.billHeader}>
                          <View style={styles.billInfo}>
                            <Text style={styles.billIcon}>🧾</Text>
                            <Text style={styles.billNo}>#{bill.billNo}</Text>
                          </View>
                          <Text style={styles.billAmount}>
                            {formatCurrency(bill.amount)}
                          </Text>
                        </View>
                        {bill.medicines.length > 0 && (
                          <View style={styles.medicinesContainer}>
                            <Text style={styles.medicinesHeader}>💊 Medicines:</Text>
                            {bill.medicines.slice(0, 3).map((medicine, medIndex) => (
                              <View key={medIndex} style={styles.medicineRow}>
                                <Text style={styles.medicineBullet}>•</Text>
                                <Text style={styles.medicineItem}>
                                  {medicine.name} 
                                  <Text style={styles.medicineQuantity}> (Qty: {medicine.quantity})</Text>
                                </Text>
                              </View>
                            ))}
                            {bill.medicines.length > 3 && (
                              <Text style={styles.moreItems}>
                                +{bill.medicines.length - 3} more items
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
            </Animated.View>
          ))}
      </ScrollView>
    );
  };

  if (loading && customers.length === 0) {
    return (
      
      <View style={styles.loadingContainer}>
        {/* Floating Decorative Elements */}
        <Animated.View 
          style={[
            styles.floatingElement,
            { 
              top: 100, 
              right: 50,
              opacity: glowOpacity,
              transform: [{ translateY: floatingY }, { scale: pulseAnim }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.floatingElement,
            { 
              bottom: 200, 
              left: 30,
              width: 80,
              height: 80,
              backgroundColor: '#dbeafe',
              opacity: glowOpacity,
              transform: [{ translateY: floatingY }, { scale: pulseAnim }]
            }
          ]} 
        />

        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }]
          }}
        >
          <ActivityIndicator size="large" color="#2563eb" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading inactive customers...</Text>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((index) => (
            <Animated.View 
              key={index}
              style={[
                styles.dot,
                { 
                  transform: [{ 
                    scale: pulseAnim.interpolate({
                      inputRange: [0.95, 1.05],
                      outputRange: [0.8, 1.2],
                    })
                  }] 
                }
              ]} 
            />
          ))}
        </View>
      </View>
      
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating Decorative Elements */}
      <Animated.View 
        style={[
          styles.floatingElement,
          { 
            top: 120, 
            right: 30,
            opacity: glowOpacity,
            transform: [{ translateY: floatingY }, { scale: pulseAnim }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.floatingElement,
          { 
            bottom: 250, 
            left: -20,
            width: 100,
            height: 100,
            backgroundColor: '#bfdbfe',
            opacity: glowOpacity,
            transform: [{ translateY: floatingY }, { scale: pulseAnim }]
          }
        ]} 
      />

      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />

      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerAnim }]
          }
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Inactive Customers</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} customers found
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
          {showSearch && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or store..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
          )}
        </Animated.View>

        {/* Header Gradient Line */}
        <Animated.View 
          style={[
            styles.headerLine,
            { transform: [{ scaleX: fadeAnim }] }
          ]}
        >
          <View style={styles.headerLineGradient} />
        </Animated.View>
      </Animated.View>

      {/* Enhanced Filters Info */}
      <Animated.View 
        style={[
          styles.filtersInfo,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.filtersHeader}>
          <Text style={styles.filtersTitle}>🔍 Applied Filters</Text>
          <View style={styles.customerCount}>
            <Text style={styles.customerCountText}>{filteredCustomers.length}</Text>
          </View>
        </View>
        <View style={styles.filtersContent}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>
              🏪 {selectedStore ? selectedStore.storeName : 'All Stores'}
            </Text>
          </View>
          {fromDate && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                📅 From: {formatDate(fromDate)}
              </Text>
            </View>
          )}
          {toDate && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                📅 To: {formatDate(toDate)}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Enhanced Customer List */}
      <ScrollView
        style={styles.customerList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            loadMore();
          }
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredCustomers.map((customer, index) => renderCustomerCard(customer, index))}
        
        {loading && customers.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadMoreText}>Loading more customers...</Text>
          </View>
        )}

        {filteredCustomers.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No inactive customers match your filters'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Enhanced Purchase History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="white" />
          
          {/* Enhanced Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHistoryModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedCustomer?.name}
              </Text>
              <Text style={styles.modalSubtitle}>Purchase History</Text>
            </View>
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIcon}>📊</Text>
            </View>
          </View>

          {historyLoading ? (
            <View style={styles.modalLoadingContainer}>
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }]
                }}
              >
                <ActivityIndicator size="large" color="#2563eb" />
              </Animated.View>
              <Text style={styles.loadingText}>Loading purchase history...</Text>
            </View>
          ) : (
            renderPurchaseHistory()
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  floatingElement: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: '#eff6ff',
    borderRadius: 60,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#2563eb',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#475569',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  searchContainer: {
    overflow: 'hidden',
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  headerLine: {
    height: 4,
    marginTop: 20,
    borderRadius: 2,
    backgroundColor: '#60a5fa',
  },
  headerLineGradient: {
    position: 'absolute',
    right: 0,
    width: '40%',
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  filtersInfo: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  customerCount: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  customerCountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  filtersContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  customerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customerCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  customerCardContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  customerInfo: {
    flex: 1,
    marginRight: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  storeIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  storeName: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    flex: 1,
  },
  purchaseInfo: {
    alignItems: 'flex-end',
  },
  lastPurchaseLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  lastPurchaseDate: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 8,
  },
  lastCalledLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  lastCalledDate: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 16,
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: 'bold',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 20,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    padding: 20,
  },
  monthContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  monthHeader: {
    backgroundColor: '#2563eb',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  monthStats: {
    fontSize: 14,
    color: '#bfdbfe',
    fontWeight: '500',
  },
  monthIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthIcon: {
    fontSize: 20,
  },
  dayContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  dayAmount: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700',
  },
  billContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  billNo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  medicinesContainer: {
    marginTop: 8,
  },
  medicinesHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  medicineBullet: {
    fontSize: 14,
    color: '#2563eb',
    marginRight: 8,
    marginTop: 2,
  },
  medicineItem: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    lineHeight: 20,
  },
  medicineQuantity: {
    fontWeight: '600',
    color: '#2563eb',
  },
  moreItems: {
    fontSize: 14,
    color: '#2563eb',
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default InactiveCustomerList;