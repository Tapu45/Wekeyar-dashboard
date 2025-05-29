import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShoppingBag,
  FaCalendarDay,
  FaReceipt,
  FaPills,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

const CustomerPurchaseHistory = ({
  purchaseHistory,
}: {
  purchaseHistory: any;
}) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  const toggleMonth = useCallback((month: string) => {
    setExpandedMonth((prev) => (prev === month ? null : month));
    setExpandedDate(null);
    setExpandedBill(null);
  }, []);

  const toggleDate = useCallback((date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
    setExpandedBill(null);
  }, []);

  const toggleBill = useCallback((bill: string) => {
    setExpandedBill((prev) => (prev === bill ? null : bill));
  }, []);

  if (!purchaseHistory || Object.keys(purchaseHistory).length === 0) {
    return (
      <div className="py-4 sm:py-6 text-center text-gray-500 text-sm sm:text-base">
        No purchase history available
      </div>
    );
  }

  return (
    <div className="mt-2 bg-blue-50 rounded-lg p-2 sm:p-3 text-sm">
      {Object.entries(purchaseHistory).map(([month, data]: [string, any]) => (
        <div
          key={month}
          className="mb-2 sm:mb-3 border border-blue-200 rounded-lg overflow-hidden shadow-sm"
        >
          {/* Month Header - Responsive */}
          <button
            className="w-full text-left p-2 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-t-lg font-medium flex justify-between items-center transition-colors"
            onClick={() => toggleMonth(month)}
          >
            <div className="flex items-center min-w-0 flex-1">
              <FaShoppingBag className="mr-2 flex-shrink-0 text-sm sm:text-base" />
              <span className="text-sm sm:text-base font-medium truncate">{month}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Mobile: Stack info vertically */}
              <div className="text-right">
                <div className="text-blue-100 text-xs sm:text-sm">
                  <span className="block sm:inline">Bills: {data.totalBills}</span>
                  <span className="block sm:inline sm:ml-2">₹{data.totalAmount}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {expandedMonth === month ? (
                  <FaChevronDown className="text-sm sm:text-base" />
                ) : (
                  <FaChevronRight className="text-sm sm:text-base" />
                )}
              </div>
            </div>
          </button>

          {/* Month Content */}
          <AnimatePresence>
            {expandedMonth === month && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white p-1 sm:p-2">
                  {Object.entries(data.dailyData).map(
                    ([day, dayData]: [string, any]) => (
                      <div
                        key={day}
                        className="my-1 sm:my-2 border border-blue-100 rounded-lg overflow-hidden"
                      >
                        {/* Day Header - Responsive */}
                        <button
                          className="w-full text-left p-2 sm:p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-t-lg font-medium flex justify-between items-center transition-colors"
                          onClick={() => toggleDate(day)}
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <FaCalendarDay className="mr-2 flex-shrink-0 text-sm sm:text-base" />
                            <span className="text-sm sm:text-base truncate">{day}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <span className="text-sm sm:text-base font-medium">
                              ₹{dayData.totalAmount}
                            </span>
                            {expandedDate === day ? (
                              <FaChevronDown className="text-sm" />
                            ) : (
                              <FaChevronRight className="text-sm" />
                            )}
                          </div>
                        </button>

                        {/* Day Content */}
                        <AnimatePresence>
                          {expandedDate === day && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white p-1 sm:p-2 space-y-1 sm:space-y-2">
                                {dayData.bills.map((bill: any) => (
                                  <div
                                    key={bill.billNo}
                                    className="border border-blue-50 rounded-lg overflow-hidden"
                                  >
                                    {/* Bill Header - Responsive */}
                                    <button
                                      className="w-full text-left p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-t-lg flex justify-between items-center transition-colors"
                                      onClick={() => toggleBill(bill.billNo)}
                                    >
                                      <div className="flex items-center min-w-0 flex-1">
                                        <FaReceipt className="mr-2 text-blue-500 flex-shrink-0 text-sm" />
                                        <span className="text-sm font-medium truncate">
                                          Bill #{bill.billNo}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-medium text-sm sm:text-base">
                                          ₹{bill.amount}
                                        </span>
                                        {expandedBill === bill.billNo ? (
                                          <FaChevronDown className="text-blue-500 text-xs" />
                                        ) : (
                                          <FaChevronRight className="text-blue-500 text-xs" />
                                        )}
                                      </div>
                                    </button>

                                    {/* Bill Details */}
                                    <AnimatePresence>
                                      {expandedBill === bill.billNo && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.1 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-2 sm:p-3 bg-white">
                                            <div className="text-gray-500 mb-2 text-xs sm:text-sm font-medium">
                                              Medicines purchased:
                                            </div>
                                            
                                            {/* Mobile: Card layout for medicines */}
                                            <div className="block sm:hidden space-y-2">
                                              {bill.medicines.map(
                                                (medicine: any, index: number) => (
                                                  <div
                                                    key={index}
                                                    className="bg-gray-50 rounded-lg p-2 flex items-center justify-between"
                                                  >
                                                    <div className="flex items-center min-w-0 flex-1">
                                                      <FaPills className="mr-2 text-blue-400 flex-shrink-0 text-xs" />
                                                      <span className="text-xs truncate">
                                                        {medicine.name}
                                                      </span>
                                                    </div>
                                                    <div className="text-xs font-medium text-gray-600 ml-2">
                                                      Qty: {medicine.quantity}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>

                                            {/* Desktop: Table layout for medicines */}
                                            <div className="hidden sm:block overflow-x-auto">
                                              <table className="min-w-full divide-y divide-gray-100 text-xs sm:text-sm">
                                                <thead>
                                                  <tr className="bg-gray-50">
                                                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-gray-500 font-medium">
                                                      Medicine
                                                    </th>
                                                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-right text-gray-500 font-medium">
                                                      Quantity
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                  {bill.medicines.map(
                                                    (medicine: any, index: number) => (
                                                      <tr
                                                        key={index}
                                                        className="hover:bg-gray-50 transition-colors"
                                                      >
                                                        <td className="px-2 sm:px-3 py-1 sm:py-2">
                                                          <div className="flex items-center">
                                                            <FaPills className="mr-2 text-blue-400 flex-shrink-0 text-xs" />
                                                            <span className="text-xs sm:text-sm">
                                                              {medicine.name}
                                                            </span>
                                                          </div>
                                                        </td>
                                                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-right text-xs sm:text-sm">
                                                          {medicine.quantity}
                                                        </td>
                                                      </tr>
                                                    )
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default CustomerPurchaseHistory;