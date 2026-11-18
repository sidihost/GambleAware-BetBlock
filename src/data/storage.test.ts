import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPinSync, verifyPinHashSync } from './storage.ts';

test('salted SHA-256 PIN hashing produces unique hashes within Firestore size bounds', () => {
  const hashA = hashPinSync('4829');
  const hashB = hashPinSync('4829');

  assert.ok(hashA.startsWith('v2$'), 'Should use v2 salted SHA-256 format');
  assert.notEqual(hashA, hashB, 'Same PIN must produce distinct salted hashes');
  assert.ok(hashA.length <= 64, 'Hash must fit within Firestore pinHash 64-char limit');

  assert.equal(verifyPinHashSync('4829', hashA), true);
  assert.equal(verifyPinHashSync('4829', hashB), true);
  assert.equal(verifyPinHashSync('0000', hashA), false);
});

test('verifyPinHashSync preserves backward compatibility with legacy v1 hashes', () => {
  // Compute v1 legacy format independently to verify migration compatibility
  const input = 'gambleaware_salt_v1:1234';
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const legacyHash = `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;

  assert.equal(verifyPinHashSync('1234', legacyHash), true);
  assert.equal(verifyPinHashSync('9999', legacyHash), false);
});
