// Sample test code for postDailyBills controller
const axios = require('axios');

// Sample log data from your example
// ...existing code...
// ...existing code...
const sampleBill = `IRC/15970
17-10-2025
001/14:59
9692353739
CASH BILL
IRC VILLAGE
BHUBANESWAR
7205959343
KH-45943/R 45944/RC
KH-19985/RX
21AACCW4774G1ZD
1:0 BIO D3 FEM
3004
1683A
3/27
392.81
20.00
2.50
2.50
299.29
392.81
1:0 LOPAMIDE TAB
3004
2M006
12/27
23.89
20.00
2.50
2.50
18.19
23.89
1:0 NEXPRO L
3004
M009
3/27
315.28
20.00
2.50
2.50
240.20
315.28
Rs. Five Hundred and Eighty Six only
731.98
146.40
586.00
Import Purchase ONLINE | No Manual Entry | MARG NANO Rs.5400 | Online Purchase Import | Call 9437026823,7978789800`;
// ...existing code...


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
      console.error('❌ Test failed with error:',  error.message);
    } else {
      console.error('❌ Test failed with an unknown error:', error);
    }
  }
}

// Run the test
testPostDailyBills();