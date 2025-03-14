"use client"

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import api, { API_ROUTES } from "../utils/api"
import { ArrowUpDown, Calendar, IndianRupee, Phone, User } from "lucide-react"

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

const NonBuyingMonthlyCustomer: React.FC = () => {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data, isLoading, error } = useQuery<MonthlyNonBuyingCustomer[]>({
    queryKey: ["non-buying-monthly-customers"],
    queryFn: getMonthlyNonBuyingCustomers,
  })

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
        cell: ({ row }) => <div className="font-medium text-gray-800">{row.original.name}</div>,
      }),
      columnHelper.accessor("phone", {
        header: () => (
          <div className="flex items-center gap-1 font-semibold text-gray-700">
            <Phone className="w-4 h-4 text-gray-500" />
            Phone Number
          </div>
        ),
        cell: ({ row }) => <div className="font-mono text-sm text-gray-600">{row.original.phone}</div>,
      }),
      columnHelper.accessor("monthlyAvgPurchase", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-blue-600 transition-all hover:text-blue-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <IndianRupee className="w-4 h-4 text-blue-500" />
            Monthly Avg
            <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-right text-green-600">₹{row.original.monthlyAvgPurchase}</div>
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
    data: data || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="p-8 text-gray-800 bg-white border rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-gray-600 animate-spin"></div>
            <p className="text-sm text-gray-500">Loading customer data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 bg-red-100 border rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-32">
          <p>Error loading customer data. Please try again later.</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-gray-800 bg-white border rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No non-buying customers found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Non-Buying Monthly Customers</h2>
          <div className="text-sm text-gray-600">
            {data.length} customer{data.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-700">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-100 border-b">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NonBuyingMonthlyCustomer
