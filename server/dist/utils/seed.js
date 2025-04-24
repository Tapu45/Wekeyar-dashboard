"use strict";
const axios = require('axios');
const sampleBill = `Processing bill input
RUCH/058
02-04-2025
S sdf
001  TIME: 21:47
7894011006
CASH BILL
RUCHIKA
BHUBANESWAR
7205959341
ODRET00532/R ODRET00533/RC
21AACCW4774G1ZD
1
LIV 52 TAB 100
3004
241214
8/27
195.00
10.00
6.00
6.00
156.70
195.00
Rs. One Hundred Seventy Six Only
195.00
19.50
176.00
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