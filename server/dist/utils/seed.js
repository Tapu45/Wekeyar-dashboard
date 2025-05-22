"use strict";
const axios = require('axios');
const sampleBill = `IRC/9
22-05-2024
001/08:48
B K JENA
9776418563
CASH BILL
IRC VILLAGE
BHUBANESWAR
7205959343
KH-45943/R 45944/RC
KH-19985/RX
21AACCW4774G1ZD
3:0 GLYCOLATE-1MG
3004
01744
7/26
106.50
20.00
6.00
6.00
228.22
319.50
Rs. Two Hundred and Fifty Six only
319.50
63.90
256.00
Our Software MARG Erp 9437026823,7978789800`;
async function testPostDailyBills() {
    try {
        const response = await axios.post('http://localhost:4000/api/upload/daily/bill', {
            bill: sampleBill
        });
        console.log('Response:', response.data);
        if (response.data.success) {
            console.log('✅ Test passed! Bill created successfully.');
            console.log('Bill ID:', response.data.billId);
            console.log('Parsed Data:', JSON.stringify(response.data.parsedData, null, 2));
        }
        else {
            console.log('❌ Test failed! Could not create bill.');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('❌ Test failed with error:', error.message);
        }
        else {
            console.error('❌ Test failed with an unknown error:', error);
        }
    }
}
testPostDailyBills();
//# sourceMappingURL=seed.js.map