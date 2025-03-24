import { Request } from "express";
export interface SummaryReport {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalRevenue: number;
    avgMonthlyRevenue: number;
}
export interface NonBuyingCustomer {
    id: number;
    name: string;
    phone: string;
    lastPurchaseDate: Date | null;
    totalPurchaseValue: number;
}
export interface MonthlyNonBuyingCustomer {
    id: number;
    name: string;
    phone: string;
    monthlyAvgPurchase: number;
    lastPurchaseDate: Date | null;
}
export interface CustomRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
        role: string;
    };
}
