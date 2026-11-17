import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_SPEND_OPTIONS_NGN,
  DEFAULT_DAILY_SPEND_NGN,
  formatNaira,
} from './currency';

test('formatNaira formats Nigerian Naira with ₦ symbol and thousand separators', () => {
  assert.equal(formatNaira(0), '₦0');
  assert.equal(formatNaira(1000), '₦1,000');
  assert.equal(formatNaira(5000), '₦5,000');
  assert.equal(formatNaira(25000), '₦25,000');
  assert.equal(formatNaira(150000.6), '₦150,001');
  assert.equal(formatNaira(-500), '₦0');
});

test('Naira spend presets include realistic Nigerian daily baselines', () => {
  assert.deepEqual([...DAILY_SPEND_OPTIONS_NGN], [1000, 2500, 5000, 10000, 25000]);
  assert.equal(DEFAULT_DAILY_SPEND_NGN, 5000);
});
