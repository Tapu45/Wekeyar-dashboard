// Sample test code for postDailyBills controller
const axios = require('axios');

// Updated sample bill data
const sampleBill = `SAM/23180
27-10-2025
002/17:20
GD.MOHANTY
9937739626
CASH BILL
SAMANTARAPUR
BHUBANESWAR
7205959350
KH-38199/R 38200/RC
KH-16115/RX
21AACCW4774G1ZD
1:0 PRAZOPILL  XL  5
3004
1714
6/28
457.50
20.00
2.50
2.50
348.58
457.50
1:0 ZOLPAN DSR CAP 10\`S
30042014
OC-003
5/27
120.00
20.00
2.50
2.50
91.42
120.00
1:0 NATRILIX-SR-1.5MG
3004
142501
4/28
164.58
20.00
2.50
2.50
125.40
164.58
Rs. Five Hundred and Ninety Four only
742.08
148.42
594.00
Import Purchase ONLINE | No Manual Entry | MARG NANO Rs.5400 | Online Purchase Import | Call 9437026823,7978789800`;

// Test function
async function testPostDailyBills() {
  try {
    const response = await axios.post('https://wekeyar-marg-server-7oj85.ondigitalocean.app/api/upload/daily/bill', {
      bill: sampleBill
    });

    console.log('Response:', response.data);

    if (response.data.success) {
      console.log('✅ Test passed! Bill created successfully.');
      const bill = response.data.bills[0];
      console.log('Bill ID:', bill.billId);
      console.log('Parsed Data:', JSON.stringify(bill.parsedData, null, 2));
    } else {
      console.log('❌ Test failed! Could not create bill.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Test failed with error:', error.message);
    } else {
      console.error('❌ Test failed with an unknown error:', error);
    }
  }
}

// Run the test
testPostDailyBills();