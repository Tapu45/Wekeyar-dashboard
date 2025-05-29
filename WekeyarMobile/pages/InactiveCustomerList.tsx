import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import api, { API_ROUTES } from '../utils/api';

const { width } = Dimensions.get('window');

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<InactiveCustomer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { selectedStore, fromDate, toDate } = params || {};

  useEffect(() => {
    fetchInactiveCustomers(1, false);
  }, []);

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

      if (isLoadMore) {
        setCustomers(prev => [...prev, ...data.items]);
      } else {
        setCustomers(data.items);
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

  const renderCustomerCard = (customer: InactiveCustomer) => (
    <TouchableOpacity
      key={customer.id}
      style={styles.customerCard}
      onPress={() => handleCustomerPress(customer)}
    >
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{customer.name}</Text>
        <Text style={styles.customerPhone}>{customer.phone}</Text>
        {customer.storeName && (
          <Text style={styles.storeName}>Store: {customer.storeName}</Text>
        )}
      </View>
      <View style={styles.customerMeta}>
        <Text style={styles.lastPurchaseLabel}>Last Purchase:</Text>
        <Text style={styles.lastPurchaseDate}>
          {formatDate(customer.lastPurchaseDate)}
        </Text>
        {customer.lastCalledDate && (
          <>
            <Text style={styles.lastCalledLabel}>Last Called:</Text>
            <Text style={styles.lastCalledDate}>
              {formatDate(customer.lastCalledDate)}
            </Text>
          </>
        )}
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPurchaseHistory = () => {
    if (!purchaseHistory) return null;

    return (
      <ScrollView style={styles.historyContent}>
        {Object.entries(purchaseHistory)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, monthData]) => (
            <View key={monthKey} style={styles.monthContainer}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{formatMonthYear(monthKey)}</Text>
                <View style={styles.monthSummary}>
                  <Text style={styles.monthStats}>
                    {monthData.totalBills} bills • {formatCurrency(monthData.totalAmount)}
                  </Text>
                </View>
              </View>

              {Object.entries(monthData.dailyData)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dayKey, dayData]) => (
                  <View key={dayKey} style={styles.dayContainer}>
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

                    {dayData.bills.map((bill, index) => (
                      <View key={index} style={styles.billContainer}>
                        <View style={styles.billHeader}>
                          <Text style={styles.billNo}>Bill: {bill.billNo}</Text>
                          <Text style={styles.billAmount}>
                            {formatCurrency(bill.amount)}
                          </Text>
                        </View>
                        {bill.medicines.length > 0 && (
                          <View style={styles.medicinesContainer}>
                            {bill.medicines.slice(0, 3).map((medicine, medIndex) => (
                              <Text key={medIndex} style={styles.medicineItem}>
                                • {medicine.name} (Qty: {medicine.quantity})
                              </Text>
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
            </View>
          ))}
      </ScrollView>
    );
  };

  if (loading && customers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading inactive customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inactive Customers</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount} customers found
        </Text>
      </View>

      {/* Filters Info */}
      <View style={styles.filtersInfo}>
        <Text style={styles.filtersTitle}>Applied Filters:</Text>
        <Text style={styles.filterText}>
          Store: {selectedStore ? selectedStore.storeName : 'All Stores'}
        </Text>
        {fromDate && (
          <Text style={styles.filterText}>
            From: {formatDate(fromDate)}
          </Text>
        )}
        {toDate && (
          <Text style={styles.filterText}>
            To: {formatDate(toDate)}
          </Text>
        )}
      </View>

      {/* Customer List */}
      <ScrollView
        style={styles.customerList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            loadMore();
          }
        }}
      >
        {customers.map(renderCustomerCard)}
        
        {loading && customers.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={styles.loadMoreText}>Loading more...</Text>
          </View>
        )}
      </ScrollView>

      {/* Purchase History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCustomer?.name}
            </Text>
            <Text style={styles.modalSubtitle}>Purchase History</Text>
          </View>

          {historyLoading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#1976D2" />
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
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1976D2',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  filtersInfo: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  filterText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 2,
  },
  customerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 5,
  },
  customerPhone: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 3,
  },
  storeName: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  customerMeta: {
    alignItems: 'flex-end',
  },
  lastPurchaseLabel: {
    fontSize: 12,
    color: '#757575',
  },
  lastPurchaseDate: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
    marginBottom: 5,
  },
  lastCalledLabel: {
    fontSize: 12,
    color: '#757575',
  },
  lastCalledDate: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  arrowContainer: {
    marginLeft: 10,
  },
  arrow: {
    fontSize: 20,
    color: '#1976D2',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 5,
    fontSize: 14,
    color: '#757575',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1976D2',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  monthHeader: {
    backgroundColor: '#1976D2',
    padding: 15,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  monthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthStats: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  dayContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 5,
  },
  dayAmount: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
    marginBottom: 10,
  },
  billContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  billNo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
  },
  billAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  medicinesContainer: {
    marginTop: 5,
  },
  medicineItem: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#1976D2',
    fontStyle: 'italic',
  },
});

export default InactiveCustomerList;