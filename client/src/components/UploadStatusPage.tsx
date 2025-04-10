import React, { useState,useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";
import { Calendar, Clock, Store, Filter, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define TypeScript interfaces
interface UploadData {
  date: string;
  isUploaded: boolean;
}

interface WeekData extends Array<UploadData | null> {}

const UploadStatusPage: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [stores, setStores] = useState<{ id: number; storeName: string }[]>([]);
  
  // Query setup but disabled until explicitly triggered
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["uploadStatus", year, month, selectedStore],
    queryFn: async () => {
      const params = {
        year,
        month,
        storeId: selectedStore,
      };
      const response = await api.get(API_ROUTES.UPLOADSTATUS, { params });
      return response.data as UploadData[];
    },
    enabled: false, // Disable automatic fetching
  });

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data } = await api.get(API_ROUTES.STORES);
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      }
    };
  
    fetchStores();
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value, 10));
    setShowResults(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(e.target.value, 10));
    setShowResults(false);
  };

 

  const handleApply = () => {
    if (year && month && selectedStore) {
      refetch();
      setShowResults(true);
    }
  };

  // Group data by week for better visualization
  const groupedByWeek: WeekData[] = data ? groupDataByWeek(data) : [];

  // Calculate stats if data is available
  const stats = React.useMemo(() => {
    if (!data) return { total: 0, uploaded: 0, percentage: 0 };
    
    const total = data.length;
    const uploaded = data.filter(item => item.isUploaded).length;
    const percentage = Math.round((uploaded / total) * 100);
    
    return { total, uploaded, percentage };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-0 m-0 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-6xl p-4 md:p-6 lg:p-8 mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full"
              style={{ top: '-2rem', right: '-2rem' }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.08, 0.05]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full"
              style={{ bottom: '-1rem' }}
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.05, 0.08, 0.05]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Upload Status Dashboard</h2>
                <p className="text-blue-100 text-lg">Track and monitor your store data uploads</p>
              </div>
              {showResults && data && !isLoading && !error && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-4 md:mt-0 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl"
                >
                  <div className="text-sm text-blue-100">Upload completion</div>
                  <div className="text-2xl font-bold">{stats.percentage}%</div>
                  <div className="text-sm text-blue-100">{stats.uploaded} of {stats.total} days</div>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 p-6 rounded-xl mb-8 border border-blue-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-500" />
                Filter Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Year
                  </label>
                  <select 
                    value={year}
                    onChange={handleYearChange}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    Month
                  </label>
                  <select 
                    value={month}
                    onChange={handleMonthChange}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
    <Store className="w-4 h-4 mr-2 text-blue-500" />
    Store
  </label>
  <select
    value={selectedStore || ""}
    onChange={(e) => setSelectedStore(Number(e.target.value))}
    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
  >
    <option value="" disabled>
       Select Store
    </option>
    {stores.map((store) => (
      <option key={store.id} value={store.id}>
        {store.storeName}
      </option>
    ))}
  </select>
</div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                disabled={!year || !month || !selectedStore}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Apply Filters</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
            
            <AnimatePresence mode="wait">
              {!showResults && (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center py-12 px-4 text-center"
                >
                  <EmptyStateIllustration />
                  <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-2">No Data Displayed</h3>
                  <p className="text-gray-500 max-w-md">Select a year, month, and store, then click Apply to view your upload status calendar.</p>
                </motion.div>
              )}
              
              {showResults && (
                <>
                  {isLoading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-gray-500 mt-4">Loading data...</p>
                    </motion.div>
                  ) : error ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-red-50 p-6 rounded-xl text-red-700 text-center border border-red-100"
                    >
                      <div className="flex flex-col items-center">
                        <XCircle className="w-12 h-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
                        <p>Error fetching data. Please check your connection and try again.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
                    >
                      <motion.h3 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-semibold text-gray-800 mb-6 flex items-center"
                      >
                        <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                        Upload Calendar for {new Date(0, month-1).toLocaleString("default", { month: "long" })} {year}
                      </motion.h3>
                      
                      <div className="overflow-hidden rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="grid grid-cols-7 gap-2 mb-2"
                        >
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-medium text-gray-500 p-2">
                              {day}
                            </div>
                          ))}
                        </motion.div>
                        
                        <div className="space-y-2">
                          {groupedByWeek.map((week, weekIndex) => (
                            <motion.div 
                              key={weekIndex} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { delay: 0.3 + (weekIndex * 0.1) }
                              }}
                              className="grid grid-cols-7 gap-2"
                            >
                              {week.map((day, dayIndex) => (
                                <motion.div
                                  key={dayIndex}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ 
                                    scale: 1, 
                                    opacity: day ? 1 : 0.3,
                                    transition: { delay: (weekIndex * 0.1) + (dayIndex * 0.03) + 0.4 }
                                  }}
                                  whileHover={{ scale: day ? 1.05 : 1 }}
                                  className={`
                                    relative rounded-xl p-2 h-24 flex flex-col items-center justify-center
                                    ${day ? (
                                      day.isUploaded 
                                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-800 shadow-sm' 
                                        : 'bg-white border border-gray-200 text-gray-800'
                                    ) : 'bg-transparent'}
                                  `}
                                >
                                  {day && (
                                    <>
                                      <span className="text-sm font-semibold mb-2">{new Date(day.date).getDate()}</span>
                                      {day.isUploaded ? (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ 
                                            delay: (weekIndex * 0.1) + (dayIndex * 0.03) + 0.6,
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20
                                          }}
                                          className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md"
                                        >
                                          <CheckCircle className="w-5 h-5 text-white" />
                                        </motion.div>
                                      ) : (
                                        <motion.div 
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ 
                                            delay: (weekIndex * 0.1) + (dayIndex * 0.03) + 0.6, 
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20
                                          }}
                                          className="w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center"
                                        />
                                      )}
                                    </>
                                  )}
                                </motion.div>
                              ))}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center justify-between mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">Data Uploaded</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">No Data</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {stats.uploaded} of {stats.total} days have data
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Custom EmptyStateIllustration component for better visuals
const EmptyStateIllustration = () => {
  return (
    <motion.svg 
      width="280" 
      height="200" 
      viewBox="0 0 280 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <rect width="280" height="200" fill="white"/>
      
      {/* Calendar base */}
      <motion.rect
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        x="70" 
        y="40" 
        width="140" 
        height="120" 
        rx="8" 
        fill="#F3F7FF" 
        stroke="#D1DEFF" 
        strokeWidth="2"
      />
      
      {/* Calendar header */}
      <motion.rect
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        x="70" 
        y="40" 
        width="140" 
        height="24" 
        rx="6" 
        fill="#4F46E5" 
      />
      
      {/* Calendar grid */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        {/* Row 1 */}
        <rect x="80" y="74" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="110" y="74" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="140" y="74" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="170" y="74" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        
        {/* Row 2 */}
        <rect x="80" y="104" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="110" y="104" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="140" y="104" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="170" y="104" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        
        {/* Row 3 */}
        <rect x="80" y="134" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="110" y="134" width="20" height="20" rx="4" fill="#EBF5FF" stroke="#93C5FD" strokeWidth="1.5"/>
        <rect x="140" y="134" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
        <rect x="170" y="134" width="20" height="20" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
      </motion.g>
      
      {/* Checkmark in blue cell */}
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        d="M115 142L118 146L125 138" 
        stroke="#3B82F6" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Magnifying glass */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 1 
        }}
      >
        <circle cx="180" cy="60" r="30" fill="#EEF2FF" opacity="0.7"/>
        <circle cx="180" cy="60" r="12" fill="white" stroke="#6366F1" strokeWidth="2"/>
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          d="M188 68L198 78" 
          stroke="#6366F1" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </motion.g>
      
      {/* Filter icon */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <circle cx="40" cy="100" r="20" fill="#F0F9FF" />
        <path 
          d="M32 92H48M35 100H45M38 108H42" 
          stroke="#0EA5E9" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </motion.g>
      
      {/* Decorative elements */}
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        cx="230" 
        cy="140" 
        r="15" 
        fill="#F0F9FF"
      />
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
        cx="240" 
        cy="130" 
        r="8" 
        fill="#DBEAFE"
      />
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
        cx="220" 
        cy="150" 
        r="5" 
        fill="#93C5FD"
      />
    </motion.svg>
  );
};

// Helper function to group data by week for the calendar view
const groupDataByWeek = (data: UploadData[]): WeekData[] => {
  const result: WeekData[] = [];
  let currentWeek: (UploadData | null)[] = [];
  
  if (data.length === 0) return [];
  
  // Find the first day of the month
  const firstDate = new Date(data[0].date);
  const firstDay = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Add empty spots for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }
  
  // Add the actual days
  data.forEach((day) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      result.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  // Fill in any remaining days in the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    result.push([...currentWeek]);
  }
  
  return result;
};

export default UploadStatusPage;