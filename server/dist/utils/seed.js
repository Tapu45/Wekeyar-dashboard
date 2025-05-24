"use strict";
const axios = require('axios');
const sampleBill = `Processing bill input
CSP/004
23-05-2024
16:54
CASH
CHANDRASEKHARPUR
BHUBANESWAR
7205959351
KH38045R KH38046RC KH16038RX
21AACCW4774G1ZD
1
WHISPER CHOICE XL 6
3004
D107
12/26
42.00
5.00
0.00
0.00
42.00
1
WHISPER CHOICE ULTRA 6S
3004
80343
2/27
50.00
5.00
0.00
0.00
50.00
1
STAYFREE-SECURE-DRY-WINGS-73004
31226
12/26
35.00
5.00
0.00
0.00
35.00
Rs. One Hundred and Twenty One only
127.00
6.35
121.00
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