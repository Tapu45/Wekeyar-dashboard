"use strict";
const axios = require('axios');
const sampleBill = `Processing bill input
MM/0001
01-07-2023
RAJASHREE SAHOO
002  TIME: 16:11
80936639087
CASH BILL
AMITAVsh RATH
MOUSIMAA
BHUBANESWAR
7205959344
KH-38197/RKH-38198/RCKH-16114/RX
21AACCW4774G1ZD
4:0
ZOLSOMA-10MG
3004
2174D
9/26
130.50
20.00
6.00
6.00
372.86
522.00
Rs. Four Hundred Eighteen Only
522.00
104.40
418.00
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