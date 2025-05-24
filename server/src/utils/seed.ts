// Sample test code for postDailyBills controller
const axios = require('axios');

// Sample log data from your example
const sampleBill = `Processing bill input
CSP/000
23-05-2024
13:41
PRADEEP DAS
9437498183
CASH
99
CHANDRASEKHARPUR
BHUBANESWAR
7205959351
KH38045R KH38046RC KH16038RX
21AACCW4774G1ZD
1:0 LIPAGLYN 4 TAB
3004
15995
5/27
485.95
20.00
6.00
6.00
347.10
485.95
2:0 SITARA M  50/500 TAB 10'S
30049099
10
500303
12/26
119.25
20.00
6.00
6.00
170.36
238.50
Rs. Five Hundred and Eighty only
724.45
144.89
580.00
Our Software MARG Erp 9437026823,7978789800`;

// Test function
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
    } else {
      console.log('❌ Test failed! Could not create bill.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Test failed with error:',  error.message);
    } else {
      console.error('❌ Test failed with an unknown error:', error);
    }
  }
}

// Run the test
testPostDailyBills();