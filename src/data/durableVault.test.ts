import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeRecoveryKey,
  encodeRecoveryKey,
  parseBackupInput,
  scoreStoreRichness,
  serializeBackupFile,
} from './durableVault.ts';
import { createDefaultStore } from './storage.ts';
import { ThemeMode } from './types.ts';

test('encodeRecoveryKey and decodeRecoveryKey round-trip full state and reject tampering', () => {
  const store = createDefaultStore();
  store.preferredName = 'Tunde';
  store.settings.themeMode = ThemeMode.DARK;
  store.settings.dailyBetSpendEstimate = 10000;
  store.goals = [
    {
      goalId: 'goal_1',
      title: 'Save for Laptop',
      category: 'savings',
      targetDays: 30,
      targetAmountNgn: 300000,
      whyNote: 'Focus on career',
      isPrimary: true,
      isCompleted: false,
      lockDurationDays: 7,
      createdAtMs: 1_700_000_000_000,
    },
  ];
  store.domains = [
    {
      domain: 'mybetmirror.ng',
      isAllowlisted: false,
      categoryName: 'CUSTOM',
      addedAt: 1_700_000_000_000,
    },
  ];

  const key = encodeRecoveryKey(store);
  assert.ok(key.startsWith('GA1.'), 'Key must use GA1 version prefix');

  const decoded = decodeRecoveryKey(key);
  assert.ok(decoded !== null, 'Valid key must decode');
  assert.equal(decoded.preferredName, 'Tunde');
  assert.equal(decoded.settings.themeMode, ThemeMode.DARK);
  assert.equal(decoded.goals.length, 1);
  assert.equal(decoded.goals[0].title, 'Save for Laptop');
  assert.equal(decoded.domains[0].domain, 'mybetmirror.ng');

  // Tamper checksum
  const tampered = `${key.slice(0, -1)}${key.endsWith('0') ? '1' : '0'}`;
  assert.equal(decodeRecoveryKey(tampered), null, 'Tampered key must fail checksum');
});

test('serializeBackupFile and parseBackupInput support both JSON backup files and GA1 keys', () => {
  const store = createDefaultStore();
  store.preferredName = 'Amaka';
  const jsonBackup = serializeBackupFile(store);

  const parsedFromJson = parseBackupInput(jsonBackup);
  assert.ok(parsedFromJson !== null);
  assert.equal(parsedFromJson.preferredName, 'Amaka');

  const parsedFromKey = parseBackupInput(encodeRecoveryKey(store));
  assert.ok(parsedFromKey !== null);
  assert.equal(parsedFromKey.preferredName, 'Amaka');

  assert.equal(parseBackupInput('not-valid-backup'), null);
});

test('scoreStoreRichness prefers populated backups over fresh empty defaults', () => {
  const empty = createDefaultStore();
  empty.updatedAtMs = Date.now();

  const populated = createDefaultStore();
  populated.updatedAtMs = empty.updatedAtMs - 60_000;
  populated.goals = [
    {
      goalId: 'g1',
      title: 'Emergency Rent Fund',
      category: 'savings',
      targetDays: 30,
      targetAmountNgn: 150000,
      whyNote: 'Peace of mind',
      isPrimary: true,
      isCompleted: false,
      lockDurationDays: 0,
      createdAtMs: 1_700_000_000_000,
    },
  ];

  assert.ok(scoreStoreRichness(populated) > scoreStoreRichness(empty));
});
