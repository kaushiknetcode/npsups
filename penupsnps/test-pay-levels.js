// Test script to verify payLevels array
import { payLevels, getIndicesForLevel, getBasicPay } from './data/pay-matrix-7th-cpc.js';

console.log('Pay Levels:');
console.log(payLevels);

// Test if 13A is in the correct position
const indexOf13A = payLevels.indexOf('13A');
const indexOf13 = payLevels.indexOf('13');
const indexOf14 = payLevels.indexOf('14');

console.log('\nVerification:');
console.log(`'13' is at index: ${indexOf13}`);
console.log(`'13A' is at index: ${indexOf13A}`);
console.log(`'14' is at index: ${indexOf14}`);

// Test if 13A is between 13 and 14
if (indexOf13 < indexOf13A && indexOf13A < indexOf14) {
    console.log('✅ 13A is correctly placed between 13 and 14');
} else {
    console.log('❌ 13A is NOT correctly placed between 13 and 14');
}

// Test getIndicesForLevel with 13A
console.log('\nIndices for level 13A:');
console.log(getIndicesForLevel('13A'));

// Test getBasicPay with 13A
console.log('\nBasic pay for level 13A, index 1:');
console.log(getBasicPay('13A', 1));
