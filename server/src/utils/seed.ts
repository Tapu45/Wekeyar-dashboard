// Sample test code for postDailyBills controller
const axios = require('axios');

const sampleBill = `KV/22527
8-10-2025
GANESH PRASAD SAHOO
8895501940
CASH BILL
KALINGA VIHAR
BHUBANESWAR
7205959346
KH-38101R KH38102RC KH16200RX
21AACCW4774G1ZD
1:0
GABANEURON NT 200
30049029
15
A629
2/26
206.25
20.00
2.50
2.50
157.14
206.25
1:0
ZERODOL P TAB
3004
25091
6/27
72.19
20.00
2.50
2.50
54.99
72.19
Rs. Two Hundred and Twenty Three only
278.44
55.69
223.00`;



// Test function
async function testPostDailyBills() {
  try {
    const response = await axios.post('http://localhost:4000/api/upload/daily/bill', {
      bill: sampleBill
    });
    
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Test passed! Bill created successfully.');
      const bill = response.data.bills[0];
      console.log('Bill ID:', bill.billId);
      console.log('Parsed Data:', JSON.stringify(bill.parsedData, null, 2));
      console.log('Amount Paid:', bill.parsedData.amountPaid);
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