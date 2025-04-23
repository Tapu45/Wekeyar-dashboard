// Sample test code for postDailyBills controller
const axios = require('axios');

// Sample log data from your example
const sampleBill = `Processing bill input
RUCH/0007
15-04-2025
ASHISH KU MOHANTY
001  TIME: 18:03
8658992282
CASH BILL
ASHISH KU MOHANTY
RUCHIKA
BHUBANESWAR
7205959341
ODRET00532/R ODRET00533/RC
21AACCW4774G1ZD
1:0
ISTAMET 50/500MG
3004
1687A
6/26
156.00
20.00
6.00
6.00
111.42
156.00
2:0
ISTAMET 50/500MG
3004
2701
11/26
171.00
20.00
6.00
6.00
244.28
342.00
Rs. Three Hundred Ninety Eight Only
498.00
99.60
398.00
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