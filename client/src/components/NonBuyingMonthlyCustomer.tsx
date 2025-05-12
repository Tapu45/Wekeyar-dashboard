"use client"

import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { motion, AnimatePresence } from "framer-motion"
import api, { API_ROUTES } from "../utils/api"
import { 
  ArrowUpDown, 
  Calendar, 
  Phone, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Search
} from "lucide-react"
import { exportNonBuyingToExcel } from "../utils/Exportutils"

export interface MonthlyNonBuyingCustomer {
  id: number
  name: string
  phone: string
  monthlyAvgPurchase: number
  lastPurchaseDate: Date | null
}

const getMonthlyNonBuyingCustomers = async (): Promise<MonthlyNonBuyingCustomer[]> => {
  const { data } = await api.get(API_ROUTES.NON_BUYING_CUSTOMERS)
  return data
}

const getUserRole = () => {
  const token = localStorage.getItem("token")
  if (!token) return null

  try {
    const decoded = JSON.parse(atob(token.split(".")[1]))
    return decoded.role
  } catch (error) {
    console.error("Failed to decode token:", error)
    return null
  }
}

const NonBuyingMonthlyCustomer: React.FC = () => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, error } = useQuery<MonthlyNonBuyingCustomer[]>({
    queryKey: ["non-buying-monthly-customers"],
    queryFn: getMonthlyNonBuyingCustomers,
  })

  const filteredData = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data
    
    return data.filter(customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      customer.phone.includes(searchQuery)
    )
  }, [data, searchQuery])

  const columnHelper = createColumnHelper<MonthlyNonBuyingCustomer>()

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-blue-600 transition-all hover:text-blue-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <User className="w-4 h-4 text-blue-500" />
            Customer Name
            <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-800">
            {row.original.name}
          </div>
        ),
      }),
      columnHelper.accessor("phone", {
        header: () => (
          <div className="flex items-center gap-1 font-semibold text-gray-700">
            <Phone className="w-4 h-4 text-gray-500" />
            Phone Number
          </div>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm text-gray-600">
            {row.original.phone}
          </div>
        ),
      }),

      columnHelper.accessor("lastPurchaseDate", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-blue-600 transition-all hover:text-blue-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            Last Purchase
            <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-700">
            {row.original.lastPurchaseDate ? (
              new Date(row.original.lastPurchaseDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            ) : (
              <span className="italic text-gray-400">Never</span>
            )}
          </div>
        ),
      }),
    ],
    [columnHelper],
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const handleExport = () => {
    const input = window.prompt("Enter export format: 'excel' or 'pdf'");
    const format = input ? input.toLowerCase() : "";

    if (format === "excel") {
      exportNonBuyingToExcel(
        filteredData.map(customer => ({
          ...customer,
          totalPurchaseValue: 0, // Default value or calculate if available
        }))
      ); // Export to Excel
    
    } else {
      alert("Invalid format. Please enter 'excel' or 'pdf'.");
    }
  };

  const userRole = getUserRole()

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden bg-white shadow-xl rounded-xl"
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold text-white">Non-Buying Monthly Customers</h2>
          <p className="text-blue-100">Loading customer data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
            <p className="font-medium text-blue-600">Loading customer data...</p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden bg-white shadow-xl rounded-xl"
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold text-white">Non-Buying Monthly Customers</h2>
          <p className="text-blue-100">Error loading data</p>
        </div>
        <div className="p-8">
          <div className="flex items-center justify-center p-6 text-red-600 rounded-lg bg-red-50">
            <AlertCircle className="w-6 h-6 mr-2" />
            <p className="font-medium">Error loading customer data. Please try again later.</p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden bg-white shadow-xl rounded-xl"
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold text-white">Non-Buying Monthly Customers</h2>
          <p className="text-blue-100">No customers found</p>
        </div>
        <div className="p-8">
          <div className="flex flex-col items-center justify-center p-10 rounded-lg bg-blue-50">
            <p className="mb-2 text-xl font-medium text-blue-700">No non-buying customers found</p>
            <p className="text-blue-600">All customers have made recent purchases</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
  }

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.97 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden bg-white shadow-xl rounded-xl"
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-2xl font-bold text-white">Non-Buying Monthly Customers</h2>
        <p className="text-blue-100">Customers with regular spending patterns who haven't made recent purchases</p>
      </div>

      <div className="p-6">
        <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full px-10 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                table.setPageSize(Number(e.target.value))
              }}
              className="px-2 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          {userRole === "admin" && (
          <div className="flex justify-end mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Export Data
            </motion.button>
          </div>
        )}
        </div>

        <div className="overflow-hidden border border-gray-200 rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-700">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-200 bg-blue-50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      variants={rowVariants}
                      className="transition-colors duration-200 border-b border-gray-100 hover:bg-blue-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 px-2 mt-4 sm:flex-row">
          <div className="text-sm text-gray-600">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length} entries
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={`flex items-center px-3 py-1 rounded-md ${
                !table.getCanPreviousPage()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </motion.button>

            {Array.from({ length: table.getPageCount() }, (_, i) => (
              <motion.button
                key={i}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => table.setPageIndex(i)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  table.getState().pagination.pageIndex === i
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-blue-50"
                }`}
              >
                {i + 1}
              </motion.button>
            ))}

            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={`flex items-center px-3 py-1 rounded-md ${
                !table.getCanNextPage()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default NonBuyingMonthlyCustomer