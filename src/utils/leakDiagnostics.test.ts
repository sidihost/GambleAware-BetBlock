import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultStore } from '../data/storage';
import { evaluateShieldLeakAudit } from './leakDiagnostics';

test('scores 100 Fortified when all 5 shield layers including Device Admin uninstall lock are enabled', () => {
  const store = createDefaultStore();
  const audit = evaluateShieldLeakAudit({
    settings: {
      ...store.settings,
      depositGuardEnabled: true,
    },
    isAccessibilityEnabled: true,
    isDeviceAdminEnabled: true,
    nowMs: 1_700_000_000_000,
  });
  assert.equal(audit.score, 100);
  assert.equal(audit.gradeLabel, 'Fortified');
  assert.equal(audit.healthyCount, 5);
});

test('deducts points accurately when Device Admin uninstall lock is off', () => {
  const store = createDefaultStore();
  const audit = evaluateShieldLeakAudit({
    settings: {
      ...store.settings,
      depositGuardEnabled: true,
    },
    isAccessibilityEnabled: true,
    isDeviceAdminEnabled: false,
    nowMs: 1_700_000_000_000,
  });
  assert.equal(audit.score, 75);
  assert.equal(audit.gradeLabel, 'Hardened');
  assert.equal(audit.layers.find((l) => l.id === 'admin_uninstall')?.isHealthy, false);
});
