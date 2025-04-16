// Sample test code for postDailyBills controller
const axios = require('axios');

// Sample log data from your example
const sampleBill = `RUCH/0789
16-04-2025
MANOJ KU GUPTA
001  TIME: 11:43
6294868602
CASH BILL
RUCHIKA
BHUBANESWAR
7205959341
ODRET00532/R ODRET00533/RC
21AACCW4774G1ZD
1
OLESOFT MAX CREAM 150GM3004
AD204
9/25
478.00
20.00
6.00
6.00
341.42
478.00
1:0
APREZO-30MG-TAB
3004
400355
2/27
325.00
20.00
6.00
6.00
232.14
325.00
Rs. Six Hundred Forty Two Only
803.00
160.60
642.00
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