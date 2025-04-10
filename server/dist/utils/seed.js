"use strict";
const axios = require('axios');
const sampleBill = `Creating bill RUCH/0183
07-04-2025
001  TIME: 12:42
CASH BILL
RUCHIKA
BHUBANESWAR
7205959341
ODRET00532/R ODRET00533/RC
21AACCW4774G1ZD
1
HAJMOLA REGULAR 160 JAR 30049011
1138
12/26
1.00
5.00
6.00
6.00
0.85
1.00
Rs. One Only
1.00
0.05
1.00
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