import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWeeklyReport,
  calculateKpis,
  canPerform,
  createNotificationPayload,
  exportRequestsToCsv,
  filterRequests,
  getSlaState,
  rankRequestsByUrgency,
  seedRequests,
} from '../src/domain.js';

const now = new Date('2026-05-02T10:00:00+05:00');

test('filters requests by query and status', () => {
  const result = filterRequests(seedRequests, {
    query: 'oauth',
    status: 'in_progress',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'REQ-2406');
});

test('calculates KPI summary from operational data', () => {
  const kpis = calculateKpis(seedRequests, now);

  assert.equal(kpis.total, 8);
  assert.equal(kpis.active, 6);
  assert.equal(kpis.closed, 2);
  assert.equal(kpis.slaRisk, 4);
  assert.equal(kpis.breached, 1);
  assert.equal(kpis.averageResolutionHours, 30);
});

test('detects SLA state for breached, risk and resolved requests', () => {
  const breached = seedRequests.find((request) => request.id === 'REQ-2402');
  const risk = seedRequests.find((request) => request.id === 'REQ-2406');
  const resolved = seedRequests.find((request) => request.id === 'REQ-2408');

  assert.equal(getSlaState(breached, now), 'breached');
  assert.equal(getSlaState(risk, now), 'risk');
  assert.equal(getSlaState(resolved, now), 'resolved');
});

test('ranks urgent requests before healthy backlog work', () => {
  const ranked = rankRequestsByUrgency(seedRequests, now);

  assert.equal(ranked[0].id, 'REQ-2402');
  assert.equal(ranked.at(-1).status, 'closed');
});

test('checks role capabilities', () => {
  assert.equal(canPerform('manager', 'export'), true);
  assert.equal(canPerform('viewer', 'export'), false);
});

test('builds notification payload with critical retry policy', () => {
  const request = seedRequests.find((item) => item.id === 'REQ-2402');
  const payload = createNotificationPayload(request, 'sms', now);

  assert.equal(payload.channel, 'sms');
  assert.equal(payload.severity, 'critical');
  assert.equal(payload.retryPolicy.maxAttempts, 5);
});

test('exports selected requests to CSV', () => {
  const csv = exportRequestsToCsv(seedRequests.slice(0, 2));

  assert.match(csv, /id,customer,module,owner,priority,status,dueAt,value/);
  assert.match(csv, /REQ-2401/);
  assert.equal(csv.split('\n').length, 3);
});

test('builds weekly report from current board state', () => {
  const report = buildWeeklyReport(seedRequests, now);

  assert.equal(report.title, 'Weekly CRM Operations Report');
  assert.equal(report.kpis.slaRisk, 4);
  assert.equal(report.lines.length, 3);
});
