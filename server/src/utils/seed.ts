// Sample test code for postDailyBills controller
const axios = require('axios');

// Sample log data from your example
const sampleBill = `Processing bill input
RUCH/06
02-04-2025
001  TIME: 18:36
8447167622
CASH BILL
RUCHIKA
BHUBANESWAR
7205959341
ODRET00532/R ODRET00533/RC
21AACCW4774G1ZD
1
SOLSPRE SPRAY
3004
K0009
12/26
506.93
20.00
6.00
6.00
362.08
506.93
1:0
WYSOLONE DT 20MG TABS
3004
15
9452
3/26
40.10
20.00
6.00
6.00
28.64
40.10
Rs. Four Hundred Thirty Eight Only
547.03
109.41
438.00
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