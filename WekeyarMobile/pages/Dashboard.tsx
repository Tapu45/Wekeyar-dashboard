import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput
} from 'react-native';
import api, { API_ROUTES } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Dashboard: undefined;
  InactiveCustomerList: {
    selectedStore: Store | null;
    fromDate: string;
    toDate: string;
  };
};

type SummaryData = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalBills: number;
  totalAmount: number;
};

type Store = {
  id: number;
  storeName: string;
  address: string;
};

type Props = {};

const Dashboard: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    fetchStores();
    fetchSummaryData();
  }, []);

  useEffect(() => {
    fetchSummaryData();
  }, [selectedStore, fromDate, toDate]);

  const fetchStores = async () => {
    try {
      const response = await api.get(API_ROUTES.STORES);
      setStores(response.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

   const handleSeeInactiveCustomers = () => {
    navigation.navigate('InactiveCustomerList', {
      selectedStore,
      fromDate,
      toDate,
    });
  };

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (selectedStore && selectedStore.id !== 0) {
        params.storeId = selectedStore.id;
      }
      
      if (fromDate) {
        params.fromDate = fromDate;
      }
      
      if (toDate) {
        params.toDate = toDate;
      }

      const response = await api.get(API_ROUTES.SUMMARY, { params });
      setSummaryData(response.data);
    } catch (err) {
      console.error('Error fetching summary data:', err);
      setError('Failed to fetch summary data');
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN');
  };

  const clearFilters = () => {
    setSelectedStore(null);
    setFromDate('');
    setToDate('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error || !summaryData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
      </View>
    );
  }

  const { totalCustomers, activeCustomers, inactiveCustomers, totalBills, totalAmount } = summaryData;
  const activePercentage = calculatePercentage(activeCustomers, totalCustomers);
  const inactivePercentage = calculatePercentage(inactiveCustomers, totalCustomers);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Sales Overview</Text>
      </View>

      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters</Text>
        
        {/* Store Dropdown */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Store:</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowStoreDropdown(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedStore ? selectedStore.storeName : 'All Stores'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Date Range */}
        <View style={styles.dateRangeContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.filterLabel}>From:</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker('from')}
            >
              <Text style={styles.dateText}>
                {fromDate ? formatDate(fromDate) : 'Select Date'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.filterLabel}>To:</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker('to')}
            >
              <Text style={styles.dateText}>
                {toDate ? formatDate(toDate) : 'Select Date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear Filters Button */}
        {(selectedStore || fromDate || toDate) && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.totalAmountCard]}>
          <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💰</Text>
          </View>
        </View>

        <View style={[styles.statCard, styles.totalBillsCard]}>
          <Text style={styles.statValue}>{totalBills.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Bills</Text>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📄</Text>
          </View>
        </View>
      </View>

      {/* Customer Analytics Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Customer Analytics</Text>
        
        {/* Total Customers Card */}
        <View style={styles.customerTotalCard}>
          <Text style={styles.customerTotalValue}>{totalCustomers.toLocaleString()}</Text>
          <Text style={styles.customerTotalLabel}>Total Customers</Text>
        </View>

        {/* Active vs Inactive Customers */}
        <View style={styles.customerBreakdownContainer}>
          <View style={[styles.customerCard, styles.activeCard]}>
            <View style={styles.customerCardHeader}>
              <Text style={styles.customerCardIcon}>✅</Text>
              <Text style={styles.customerCardTitle}>Active</Text>
            </View>
            <Text style={styles.customerCardValue}>{activeCustomers.toLocaleString()}</Text>
            <Text style={styles.customerCardPercentage}>{activePercentage}%</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  styles.activeProgress,
                  { width: `${activePercentage}%` as import('react-native').DimensionValue }
                ]} 
              />
            </View>
          </View>

          <View style={[styles.customerCard, styles.inactiveCard]}>
    <View style={styles.customerCardHeader}>
      <Text style={styles.customerCardIcon}>⏰</Text>
      <Text style={styles.customerCardTitle}>Inactive</Text>
    </View>
    <Text style={styles.customerCardValue}>{inactiveCustomers.toLocaleString()}</Text>
    <Text style={styles.customerCardPercentage}>{inactivePercentage}%</Text>
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill, 
          styles.inactiveProgress,
          { width: `${inactivePercentage}%` as import('react-native').DimensionValue }
        ]} 
      />
    </View>
    {/* Add See Customers Button */}
    <TouchableOpacity 
      style={styles.seeCustomersButton}
      onPress={handleSeeInactiveCustomers}
    >
      <Text style={styles.seeCustomersButtonText}>See Customers</Text>
    </TouchableOpacity>
  </View>
        </View>
      </View>

      {/* Visual Representation */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Customer Distribution</Text>
        <View style={styles.chartContainer}>
          <View style={styles.pieChart}>
            <View style={[styles.pieSlice, { 
              backgroundColor: '#1976D2',
              height: (Number(activePercentage) / 100) * 120
            }]} />
            <View style={[styles.pieSlice, { 
              backgroundColor: '#42A5F5',
              height: (Number(inactivePercentage) / 100) * 120
            }]} />
          </View>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#1976D2' }]} />
              <Text style={styles.legendText}>Active ({activePercentage}%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#42A5F5' }]} />
              <Text style={styles.legendText}>Inactive ({inactivePercentage}%)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Bill Value</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(totalBills > 0 ? totalAmount / totalBills : 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Revenue per Customer</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(totalCustomers > 0 ? totalAmount / totalCustomers : 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Store Dropdown Modal */}
      <Modal
        visible={showStoreDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStoreDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStoreDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedStore(null);
                  setShowStoreDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>All Stores</Text>
              </TouchableOpacity>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedStore(store);
                    setShowStoreDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{store.storeName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(null)}
        >
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>
              Select {showDatePicker === 'from' ? 'From' : 'To'} Date
            </Text>
            <TextInput
              style={styles.datePickerInput}
              placeholder="YYYY-MM-DD"
              value={showDatePicker === 'from' ? fromDate : toDate}
              onChangeText={(text) => {
                if (showDatePicker === 'from') {
                  setFromDate(text);
                } else {
                  setToDate(text);
                }
              }}
            />
            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(null)}
              >
                <Text style={styles.datePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.datePickerButton, styles.datePickerButtonPrimary]}
                onPress={() => setShowDatePicker(null)}
              >
                <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextPrimary]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1976D2',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 5,
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 16,
    color: '#212121',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#757575',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  dateText: {
    fontSize: 16,
    color: '#212121',
  },
  clearButton: {
    backgroundColor: '#42A5F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  totalAmountCard: {
    backgroundColor: '#1976D2',
  },
  totalBillsCard: {
    backgroundColor: '#42A5F5',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  iconContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  icon: {
    fontSize: 24,
  },
  sectionContainer: {
    margin: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
  },
  customerTotalCard: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  customerTotalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  customerTotalLabel: {
    fontSize: 16,
    color: '#757575',
    marginTop: 5,
  },
  customerBreakdownContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  customerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  inactiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#42A5F5',
  },
  customerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerCardIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  customerCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  customerCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 5,
  },
  customerCardPercentage: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  activeProgress: {
    backgroundColor: '#1976D2',
  },
  inactiveProgress: {
    backgroundColor: '#42A5F5',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#42A5F5',
    overflow: 'hidden',
    marginBottom: 20,
  },
  pieSlice: {
    width: '100%',
  },
  legendContainer: {
    alignSelf: 'stretch',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#212121',
  },
  metricsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  metricItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 16,
    color: '#757575',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: width * 0.8,
    maxHeight: 300,
    padding: 10,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#212121',
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: width * 0.8,
    padding: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
    textAlign: 'center',
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  datePickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerButtonPrimary: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#757575',
  },
  datePickerButtonTextPrimary: {
    color: '#FFFFFF',
  },
});

export default Dashboard;