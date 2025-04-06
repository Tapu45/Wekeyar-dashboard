"use strict";
const axios = require('axios');
const sampleBill = `Creating bill RUCH/0167
06-04-2025
OMM PRAKASHGHJfgg
001 TIME: 15:30
7205696364
CASH BILL
RUCHIKA
BHUBANESWAR
7205959341
ODRET00532/R ODRET00533/RC
21AACCW4774G1ZD
2:0
PARACETAMOL 500MG
3004
10112
10/26
50.00
10.00
5.00
5.00
35.00
50.00
1:0
IBUPROFEN 400MG TAB
3004
240776
9/26
75.00
15.00
5.00
5.00
50.00
75.00
Rs. Eighty Five Only
125.00
25.00
100.00
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