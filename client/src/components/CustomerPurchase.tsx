import  { useState, useCallback } from "react";
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
      <div className="py-4 text-center text-gray-500">
        No purchase history available
      </div>
    );
  }

  return (
    <div className="mt-2 bg-blue-50 rounded-lg p-2 text-sm">
      {Object.entries(purchaseHistory).map(([month, data]: [string, any]) => (
        <div
          key={month}
          className="mb-2 border border-blue-200 rounded-lg overflow-hidden"
        >
          <button
            className="w-full text-left p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-t-lg font-medium flex justify-between items-center"
            onClick={() => toggleMonth(month)}
          >
            <div className="flex items-center">
              <FaShoppingBag className="mr-2" />
              <span>{month}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-blue-100">
                Bills: {data.totalBills} | ₹{data.totalAmount}
              </span>
              {expandedMonth === month ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </button>

          <AnimatePresence>
            {expandedMonth === month && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white px-2">
                  {Object.entries(data.dailyData).map(
                    ([day, dayData]: [string, any]) => (
                      <div
                        key={day}
                        className="my-2 border border-blue-100 rounded-lg overflow-hidden"
                      >
                        <button
                          className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-t-lg font-medium flex justify-between items-center"
                          onClick={() => toggleDate(day)}
                        >
                          <div className="flex items-center">
                            <FaCalendarDay className="mr-2" />
                            <span>{day}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-4">₹{dayData.totalAmount}</span>
                            {expandedDate === day ? (
                              <FaChevronDown />
                            ) : (
                              <FaChevronRight />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {expandedDate === day && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white p-1">
                                {dayData.bills.map((bill: any) => (
                                  <div
                                    key={bill.billNo}
                                    className="my-1 border border-blue-50 rounded-lg overflow-hidden"
                                  >
                                    <button
                                      className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-t-lg flex justify-between items-center"
                                      onClick={() => toggleBill(bill.billNo)}
                                    >
                                      <div className="flex items-center">
                                        <FaReceipt className="mr-2 text-blue-500" />
                                        <span>Bill #{bill.billNo}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="mr-4 font-medium">
                                          ₹{bill.amount}
                                        </span>
                                        {expandedBill === bill.billNo ? (
                                          <FaChevronDown className="text-blue-500" />
                                        ) : (
                                          <FaChevronRight className="text-blue-500" />
                                        )}
                                      </div>
                                    </button>

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
                                          <div className="p-2 bg-white">
                                            <div className="text-gray-500 mb-1 ml-2 text-xs">
                                              Medicines purchased:
                                            </div>
                                            <div className="overflow-x-auto">
                                              <table className="min-w-full divide-y divide-gray-100 text-xs">
                                                <thead>
                                                  <tr className="bg-gray-50">
                                                    <th className="px-2 py-1 text-left text-gray-500">
                                                      Medicine
                                                    </th>
                                                    <th className="px-2 py-1 text-right text-gray-500">
                                                      Qty
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {bill.medicines.map(
                                                    (
                                                      medicine: any,
                                                      index: number
                                                    ) => (
                                                      <tr
                                                        key={index}
                                                        className="hover:bg-gray-50"
                                                      >
                                                        <td className="px-2 py-1 flex items-center">
                                                          <FaPills className="mr-2 text-blue-400" />
                                                          {medicine.name}
                                                        </td>
                                                        <td className="px-2 py-1 text-right">
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