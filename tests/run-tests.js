const assert = require('assert');
const app = require('../src/app');

console.log('[TEST] Running automated unit and integration tests...');

async function run() {
  // Test 1: Express App instance sanity
  assert.ok(app, 'Express app should be instantiated');
  console.log('✓ Express application instance verified');

  // Test 2: Validation check on POST /api/audit-logs
  const mockReq = { body: {} };
  let statusResult = 0;
  let jsonResult = {};
  const mockRes = {
    status: (s) => { statusResult = s; return mockRes; },
    json: (j) => { jsonResult = j; return mockRes; }
  };

  const { createManualAuditLog } = require('../src/controllers/auditController');
  await createManualAuditLog(mockReq, mockRes);
  assert.strictEqual(statusResult, 400, 'Should return 400 on missing body fields');
  assert.ok(jsonResult.error, 'Should contain error object');
  console.log('✓ Request payload validation verified (400 Bad Request on empty body)');

  console.log('\n[SUCCESS] All test suites passed cleanly!');
}

run().catch((err) => {
  console.error('[TEST FAILURE]', err);
  process.exit(1);
});
