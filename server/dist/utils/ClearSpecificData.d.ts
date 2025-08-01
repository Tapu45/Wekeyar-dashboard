export interface ClearStoreResult {
    storeName: string;
    billsDeleted: number;
    billDetailsDeleted: number;
    customersDeleted: number;
}
export declare function clearStoreDataByName(storeName: string): Promise<ClearStoreResult>;
