var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Sample test code for postDailyBills controller
var axios = require('axios');
var sampleBill = "KV/10293\n06-07-2025\nS C PARIDA\n6371523656\nCASH BILL\nV MOHANTY\nKALINGA VIHAR\nBHUBANESWAR\n7205959346\nKH-38101R KH38102RC KH16200RX\n21AACCW4774G1ZD\n2\nFOSFOCIN SACHET 3GM\n3004\n24007\n9/26\n418.50\n20.00\n6.00\n6.00\n597.86\n837.00\nRs. Six Hundred and Seventy only\n837.00\n167.40\n670.00\nOur Software MARG Erp 9437026823,7978789800";
// Test function
function testPostDailyBills() {
    return __awaiter(this, void 0, void 0, function () {
        var response, bill, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios.post('http://localhost:4000/api/upload/daily/bill', {
                            bill: sampleBill
                        })];
                case 1:
                    response = _a.sent();
                    console.log('Response:', response.data);
                    if (response.data.success) {
                        console.log('✅ Test passed! Bill created successfully.');
                        bill = response.data.bills[0];
                        console.log('Bill ID:', bill.billId);
                        console.log('Parsed Data:', JSON.stringify(bill.parsedData, null, 2));
                        console.log('Amount Paid:', bill.parsedData.amountPaid);
                    }
                    else {
                        console.log('❌ Test failed! Could not create bill.');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof Error) {
                        console.error('❌ Test failed with error:', error_1.message);
                    }
                    else {
                        console.error('❌ Test failed with an unknown error:', error_1);
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testPostDailyBills();
