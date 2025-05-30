import React, { useEffect, useState, useRef } from "react";
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
  TextInput,
  Animated,
  StatusBar,
} from "react-native";
import api, { API_ROUTES } from "../utils/api";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";


const { width } = Dimensions.get("window");

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState<"from" | "to" | null>(
    null
  );

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStores();
    fetchSummaryData();
    startAnimations();
  }, []);

  useEffect(() => {
    fetchSummaryData();
  }, [selectedStore, fromDate, toDate]);

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
    ]).start();

    // Staggered card animations
    const cardAnimations = cardAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 300 + index * 150,
        useNativeDriver: true,
      })
    );
    Animated.stagger(150, cardAnimations).start();

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

    // Rotation animation for loading states
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchStores = async () => {
    try {
      const response = await api.get(API_ROUTES.STORES);
      setStores(response.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const handleSeeInactiveCustomers = () => {
    try {
      navigation.navigate("InactiveCustomerList", {
        selectedStore,
        fromDate,
        toDate,
      });
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Failed to navigate to customer list");
    }
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
      console.error("Error fetching summary data:", err);
      setError("Failed to fetch summary data");
      Alert.alert("Error", "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const clearFilters = () => {
    setSelectedStore(null);
    setFromDate("");
    setToDate("");
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  if (loading) {
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
              transform: [{ translateY: floatingY }, { scale: pulseAnim }],
            },
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
              backgroundColor: "#dbeafe",
              opacity: glowOpacity,
              transform: [{ translateY: floatingY }, { scale: pulseAnim }],
            },
          ]}
        />

        <Animated.View
          style={{
            transform: [{ rotate }],
          }}
        >
          <ActivityIndicator size="large" color="#2563eb" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
        <View style={styles.loadingDots}>
          <Animated.View
            style={[styles.dot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ scale: pulseAnim }] }]}
          />
        </View>
      </View>
   
    );
  }

  if (error || !summaryData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || "No data available"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSummaryData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    totalBills,
    totalAmount,
  } = summaryData;
  const activePercentage = calculatePercentage(activeCustomers, totalCustomers);
  const inactivePercentage = calculatePercentage(
    inactiveCustomers,
    totalCustomers
  );

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
            transform: [{ translateY: floatingY }, { scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingElement,
          {
            top: 300,
            left: -20,
            width: 80,
            height: 80,
            backgroundColor: "#dbeafe",
            opacity: glowOpacity,
            transform: [{ translateY: floatingY }, { scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingElement,
          {
            bottom: 250,
            right: -30,
            width: 100,
            height: 100,
            backgroundColor: "#bfdbfe",
            opacity: glowOpacity,
            transform: [{ translateY: floatingY }, { scale: pulseAnim }],
          },
        ]}
      />

      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={false}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>Sales Overview</Text>
            </View>
            <Animated.View
              style={[styles.headerIcon, { transform: [{ scale: scaleAnim }] }]}
            >
              <Text style={styles.headerIconText}>📊</Text>
            </Animated.View>
          </View>

          {/* Header Gradient Line */}
          <Animated.View
            style={[styles.headerLine, { transform: [{ scaleX: fadeAnim }] }]}
          >
            <View style={styles.headerLineGradient} />
          </Animated.View>
        </Animated.View>

        {/* Enhanced Filters Section */}
        <Animated.View
          style={[
            styles.filtersContainer,
            {
              opacity: cardAnims[0],
              transform: [
                {
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>🔍 Filters</Text>
            {(selectedStore || fromDate || toDate) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Store Dropdown */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Store:</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowStoreDropdown(true)}
            >
              <Text style={styles.dropdownText}>
                {selectedStore ? selectedStore.storeName : "All Stores"}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Date Range */}
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.filterLabel}>From:</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker("from")}
              >
                <Text style={styles.dateText}>
                  {fromDate ? formatDate(fromDate) : "Select Date"}
                </Text>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.filterLabel}>To:</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker("to")}
              >
                <Text style={styles.dateText}>
                  {toDate ? formatDate(toDate) : "Select Date"}
                </Text>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Main Stats Cards */}
        <View style={styles.statsContainer}>
          <Animated.View
            style={[
              styles.statCard,
              styles.totalAmountCard,
              {
                opacity: cardAnims[1],
                transform: [
                  { scale: cardAnims[1] },
                  {
                    translateY: cardAnims[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.statCardContent}>
              <View>
                <Text style={styles.statValue}>
                  {formatCurrency(totalAmount)}
                </Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.icon}>💰</Text>
              </Animated.View>
            </View>
            <View style={styles.statCardGlow} />
          </Animated.View>

          <Animated.View
            style={[
              styles.statCard,
              styles.totalBillsCard,
              {
                opacity: cardAnims[2],
                transform: [
                  { scale: cardAnims[2] },
                  {
                    translateY: cardAnims[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.statCardContent}>
              <View>
                <Text style={styles.statValue}>
                  {totalBills.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Bills</Text>
              </View>
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.icon}>📄</Text>
              </Animated.View>
            </View>
            <View style={styles.statCardGlow} />
          </Animated.View>
        </View>

        {/* Enhanced Customer Analytics Section */}
        <Animated.View
          style={[
            styles.sectionContainer,
            {
              opacity: cardAnims[3],
              transform: [
                {
                  translateY: cardAnims[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>👥 Customer Analytics</Text>

          {/* Enhanced Total Customers Card */}
          <View style={styles.customerTotalCard}>
            <Animated.View
              style={[
                styles.customerTotalIcon,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.customerTotalIconText}>👥</Text>
            </Animated.View>
            <Text style={styles.customerTotalValue}>
              {totalCustomers.toLocaleString()}
            </Text>
            <Text style={styles.customerTotalLabel}>Total Customers</Text>
            <View style={styles.customerTotalGlow} />
          </View>

          {/* Enhanced Active vs Inactive Customers */}
          <View style={styles.customerBreakdownContainer}>
            <View style={[styles.customerCard, styles.activeCard]}>
              <View style={styles.customerCardHeader}>
                <Text style={styles.customerCardIcon}>✅</Text>
                <Text style={styles.customerCardTitle}>Active</Text>
              </View>
              <Text style={styles.customerCardValue}>
                {activeCustomers.toLocaleString()}
              </Text>
              <Text style={styles.customerCardPercentage}>
                {activePercentage}%
              </Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    styles.activeProgress,
                    {
                      width:
                        `${activePercentage}%` as import("react-native").DimensionValue,
                      transform: [{ scaleX: fadeAnim }],
                    },
                  ]}
                />
              </View>
              <Animated.View
                style={[styles.cardGlow, { opacity: glowOpacity }]}
              />
            </View>

            <View style={[styles.customerCard, styles.inactiveCard]}>
              <View style={styles.customerCardHeader}>
                <Text style={styles.customerCardIcon}>⏰</Text>
                <Text style={styles.customerCardTitle}>Inactive</Text>
              </View>
              <Text style={styles.customerCardValue}>
                {inactiveCustomers.toLocaleString()}
              </Text>
              <Text style={styles.customerCardPercentage}>
                {inactivePercentage}%
              </Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    styles.inactiveProgress,
                    {
                      width:
                        `${inactivePercentage}%` as import("react-native").DimensionValue,
                      transform: [{ scaleX: fadeAnim }],
                    },
                  ]}
                />
              </View>

              {/* Enhanced See Customers Button */}
              <TouchableOpacity
                style={[styles.seeCustomersButton, { zIndex: 10 }]} // Add zIndex
                onPress={() => {
                  handleSeeInactiveCustomers();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
              >
                <Text style={styles.seeCustomersButtonText}>See Customers</Text>
                <Text style={styles.seeCustomersButtonIcon}>→</Text>
              </TouchableOpacity>

              <Animated.View
                style={[styles.cardGlow, { opacity: glowOpacity }]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Visual Representation */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📈 Customer Distribution</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartContent}>
              <Animated.View
                style={[styles.pieChart, { transform: [{ scale: scaleAnim }] }]}
              >
                <View
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: "#2563eb",
                      height: (Number(activePercentage) / 100) * 120,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: "#60a5fa",
                      height: (Number(inactivePercentage) / 100) * 120,
                    },
                  ]}
                />
              </Animated.View>

              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: "#2563eb" }]}
                  />
                  <Text style={styles.legendText}>
                    Active ({activePercentage}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: "#60a5fa" }]}
                  />
                  <Text style={styles.legendText}>
                    Inactive ({inactivePercentage}%)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Key Metrics */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🎯 Key Metrics</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View style={styles.metricItemContent}>
                <Text style={styles.metricIcon}>💳</Text>
                <View>
                  <Text style={styles.metricLabel}>Avg Bill Value</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(
                      totalBills > 0 ? totalAmount / totalBills : 0
                    )}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.metricItem}>
              <View style={styles.metricItemContent}>
                <Text style={styles.metricIcon}>👤</Text>
                <View>
                  <Text style={styles.metricLabel}>Revenue per Customer</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(
                      totalCustomers > 0 ? totalAmount / totalCustomers : 0
                    )}
                  </Text>
                </View>
              </View>
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
              <Text style={styles.modalTitle}>Select Store</Text>
              <ScrollView>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedStore(null);
                    setShowStoreDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>🏪 All Stores</Text>
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
                    <Text style={styles.dropdownItemText}>
                      🏬 {store.storeName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Enhanced Date Picker Modal */}
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
                📅 Select {showDatePicker === "from" ? "From" : "To"} Date
              </Text>
              <TextInput
                style={styles.datePickerInput}
                placeholder="YYYY-MM-DD"
                value={showDatePicker === "from" ? fromDate : toDate}
                onChangeText={(text) => {
                  if (showDatePicker === "from") {
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
                  style={[
                    styles.datePickerButton,
                    styles.datePickerButtonPrimary,
                  ]}
                  onPress={() => setShowDatePicker(null)}
                >
                  <Text
                    style={[
                      styles.datePickerButtonText,
                      styles.datePickerButtonTextPrimary,
                    ]}
                  >
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  floatingElement: {
    position: "absolute",
    width: 120,
    height: 120,
    backgroundColor: "#eff6ff",
    borderRadius: 60,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#64748b",
    fontWeight: "500",
  },
  loadingDots: {
    flexDirection: "row",
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: "#2563eb",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  headerIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#2563eb",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 24,
  },
  headerLine: {
    height: 4,
    marginTop: 20,
    borderRadius: 2,
    backgroundColor: "#60a5fa",
  },
  headerLineGradient: {
    position: "absolute",
    right: 0,
    width: "40%",
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 2,
  },
  filtersContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "600",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  dropdownText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#64748b",
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  dateText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  dateIcon: {
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  statCardContent: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalAmountCard: {
    backgroundColor: "#2563eb",
  },
  totalBillsCard: {
    backgroundColor: "#3b82f6",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    fontWeight: "500",
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  statCardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  sectionContainer: {
    margin: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 16,
  },
  customerTotalCard: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
  },
  customerTotalIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#2563eb",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  customerTotalIconText: {
    fontSize: 32,
  },
  customerTotalValue: {
    fontSize: 40,
    fontWeight: "900",
    color: "#2563eb",
    marginBottom: 8,
  },
  customerTotalLabel: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "600",
  },
  customerTotalGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
    borderRadius: 20,
  },
  customerBreakdownContainer: {
    flexDirection: "row",
    gap: 16,
  },
  customerCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  inactiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#60a5fa",
  },
  customerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  customerCardIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  customerCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  customerCardValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 8,
  },
  customerCardPercentage: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  activeProgress: {
    backgroundColor: "#2563eb",
  },
  inactiveProgress: {
    backgroundColor: "#60a5fa",
  },
  seeCustomersButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  seeCustomersButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  seeCustomersButtonIcon: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#2563eb",
    borderRadius: 16,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartContent: {
    alignItems: "center",
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#60a5fa",
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 4,
    borderColor: "#e2e8f0",
  },
  pieSlice: {
    width: "100%",
  },
  legendContainer: {
    alignSelf: "stretch",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  metricsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  metricItem: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  metricItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricIcon: {
    fontSize: 32,
    marginRight: 20,
  },
  metricLabel: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2563eb",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },
  dropdownModal: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: width * 0.85,
    maxHeight: 400,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  datePickerModal: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: width * 0.85,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  datePickerInput: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    fontWeight: "500",
  },
  datePickerButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  datePickerButtonPrimary: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  datePickerButtonTextPrimary: {
    color: "#ffffff",
  },
});

export default Dashboard;
