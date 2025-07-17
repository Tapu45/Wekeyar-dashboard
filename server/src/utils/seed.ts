// Sample test code for postDailyBills controller
const axios = require('axios');

// Sample log data from your example
// ...existing code...
const sampleBill = `Processing bill input
VSS/11133
09-01-2024
001,12:48
CASH BILL
VSS NAGAR
BHUBANESWAR
7205959349
KH38883R KH38884RC KH16457RX
21AACCW4774G1ZD
1
REBALANZ ORS ORANGE 200ML
200980
H046
11/25
40.00
5.00
6.00
6.00
33.92
40.00
Rs. Thirty Eight Only
40.00
2.00
38.00
Our Software MARG Erp 9437026823,7978789800`;
// ...existing code...

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