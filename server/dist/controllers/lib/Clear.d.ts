interface ClearDataParams {
    storeName: string;
    month: number;
    year: number;
}
export declare function clearStoreDataByMonth({ storeName, month, year }: ClearDataParams): Promise<{
    success: boolean;
    message: string;
    deletedCounts?: {
        billDetails: number;
        bills: number;
    };
}>;
export {};
