export const STATUS = Object.freeze({
  backlog: { label: 'Backlog', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'info' },
  review: { label: 'Review', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
});

export const PRIORITY_WEIGHT = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });
export const ROLE_CAPABILITIES = Object.freeze({
  admin: ['create', 'update', 'close', 'export', 'assign', 'notify'],
  manager: ['create', 'update', 'export', 'assign', 'notify'],
  developer: ['update', 'notify'],
  analyst: ['export'],
  viewer: [],
});

export const seedRequests = Object.freeze([
  { id: 'REQ-2401', customer: 'Altyn Logistics', module: 'Billing', owner: 'Dana', priority: 'high', status: 'in_progress', dueAt: '2026-05-02T16:00:00+05:00', createdAt: '2026-04-29T10:30:00+05:00', value: 1240000, tags: ['payments', 'sla', 'postgres'], description: 'Payment reconciliation endpoint returns duplicated records after retry from partner API.', roles: ['manager', 'developer'] },
  { id: 'REQ-2402', customer: 'Komek Retail', module: 'CRM', owner: 'Miras', priority: 'critical', status: 'blocked', dueAt: '2026-05-01T18:00:00+05:00', createdAt: '2026-04-28T15:20:00+05:00', value: 2100000, tags: ['roles', 'permissions', 'security'], description: 'Role matrix must prevent branch managers from approving their own refund requests.', roles: ['admin', 'manager'] },
  { id: 'REQ-2403', customer: 'Nomad Insurance', module: 'Analytics', owner: 'Aigerim', priority: 'medium', status: 'review', dueAt: '2026-05-05T12:00:00+05:00', createdAt: '2026-04-30T09:00:00+05:00', value: 860000, tags: ['reports', 'dashboard', 'export'], description: 'Monthly KPI dashboard needs filters by branch, product line and manager.', roles: ['manager', 'analyst'] },
  { id: 'REQ-2404', customer: 'Kaspi Partner Desk', module: 'Notifications', owner: 'Dana', priority: 'medium', status: 'closed', dueAt: '2026-04-30T18:00:00+05:00', createdAt: '2026-04-29T08:00:00+05:00', resolvedAt: '2026-04-29T21:55:00+05:00', resolvedHours: 18, value: 520000, tags: ['sms', 'retry', 'queue'], description: 'Notification service now retries failed SMS deliveries with exponential backoff.', roles: ['developer'] },
  { id: 'REQ-2405', customer: 'Orda Manufacturing', module: 'ERP', owner: 'Miras', priority: 'low', status: 'backlog', dueAt: '2026-05-08T18:00:00+05:00', createdAt: '2026-05-01T11:45:00+05:00', value: 430000, tags: ['inventory', 'sync'], description: 'Warehouse sync should show delayed import batches in the operations dashboard.', roles: ['manager', 'developer'] },
  { id: 'REQ-2406', customer: 'Barys Fintech', module: 'API', owner: 'Aigerim', priority: 'critical', status: 'in_progress', dueAt: '2026-05-02T12:00:00+05:00', createdAt: '2026-05-01T08:10:00+05:00', value: 1750000, tags: ['oauth', 'integration', 'incident'], description: 'OAuth callback intermittently fails for partner accounts after token refresh.', roles: ['admin', 'developer'] },
  { id: 'REQ-2407', customer: 'Turan Education', module: 'CRM', owner: 'Dana', priority: 'high', status: 'review', dueAt: '2026-05-03T09:00:00+05:00', createdAt: '2026-04-30T14:30:00+05:00', value: 920000, tags: ['leads', 'pipeline', 'ux'], description: 'Admissions team needs better lead stage transitions and audit notes.', roles: ['manager', 'developer'] },
  { id: 'REQ-2408', customer: 'Samruk Service Hub', module: 'ERP', owner: 'Miras', priority: 'high', status: 'closed', dueAt: '2026-05-01T12:00:00+05:00', createdAt: '2026-04-28T09:00:00+05:00', resolvedAt: '2026-04-30T10:20:00+05:00', resolvedHours: 42, value: 1470000, tags: ['approval', 'workflow', 'audit'], description: 'Approval workflow records every state transition and user action in audit log.', roles: ['admin', 'manager'] },
]);

export const seedAuditLog = Object.freeze([
  { id: 'AUD-001', createdAt: '2026-05-02T09:15:00+05:00', actor: 'system', action: 'sla_scan', requestId: 'REQ-2402', details: 'Critical blocked request moved to escalation queue.' },
  { id: 'AUD-002', createdAt: '2026-05-02T09:40:00+05:00', actor: 'manager', action: 'comment_added', requestId: 'REQ-2406', details: 'Partner integration owner notified about OAuth callback errors.' },
  { id: 'AUD-003', createdAt: '2026-05-02T10:05:00+05:00', actor: 'developer', action: 'status_changed', requestId: 'REQ-2407', details: 'Lead transition fix moved to review after QA smoke check.' },
]);

export function normalizeText(value) { return String(value || '').trim().toLowerCase(); }
export function calculateSlaHoursLeft(request, now = new Date()) {
  if (request.status === 'closed') return null;
  return Math.round((new Date(request.dueAt).getTime() - new Date(now).getTime()) / 36_000) / 100;
}
export function getSlaState(request, now = new Date()) {
  if (request.status === 'closed') return 'resolved';
  const hoursLeft = calculateSlaHoursLeft(request, now);
  if (hoursLeft <= 0) return 'breached';
  if (hoursLeft <= 24) return 'risk';
  return 'healthy';
}
export function filterRequests(requests, filters = {}) {
  const query = normalizeText(filters.query);
  const status = filters.status || 'all';
  const owner = filters.owner || 'all';
  const priority = filters.priority || 'all';
  return requests.filter((request) => {
    const searchTarget = [request.id, request.customer, request.module, request.owner, request.description, ...(request.tags || [])].map(normalizeText).join(' ');
    return (!query || searchTarget.includes(query)) && (status === 'all' || request.status === status) && (owner === 'all' || request.owner === owner) && (priority === 'all' || request.priority === priority);
  });
}
export function groupRequestsByStatus(requests) {
  const grouped = Object.keys(STATUS).reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  for (const request of requests) grouped[request.status] = (grouped[request.status] || 0) + 1;
  return grouped;
}
export function calculateKpis(requests, now = new Date()) {
  const active = requests.filter((request) => request.status !== 'closed');
  const closed = requests.filter((request) => request.status === 'closed');
  const states = active.map((request) => getSlaState(request, now));
  const resolvedHours = closed.map((request) => Number(request.resolvedHours || 0)).filter(Boolean);
  return {
    total: requests.length,
    active: active.length,
    closed: closed.length,
    blocked: active.filter((request) => request.status === 'blocked').length,
    slaRisk: states.filter((state) => state === 'risk' || state === 'breached').length,
    breached: states.filter((state) => state === 'breached').length,
    pipelineValue: active.reduce((sum, request) => sum + Number(request.value || 0), 0),
    averageResolutionHours: resolvedHours.length ? Math.round(resolvedHours.reduce((sum, hours) => sum + hours, 0) / resolvedHours.length) : 0,
  };
}
export function rankRequestsByUrgency(requests, now = new Date()) {
  const stateWeight = { breached: 40, risk: 30, healthy: 10, resolved: 0 };
  return [...requests].sort((a, b) => stateWeight[getSlaState(b, now)] - stateWeight[getSlaState(a, now)] || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || new Date(a.dueAt) - new Date(b.dueAt));
}
export function getRoleCapabilities(role) { return ROLE_CAPABILITIES[role] || []; }
export function canPerform(role, action) { return getRoleCapabilities(role).includes(action); }
export function buildAuditEvent({ actor, action, requestId, details }, now = new Date()) {
  return { id: `AUD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, createdAt: new Date(now).toISOString(), actor: String(actor || 'system'), action: String(action || 'event'), requestId: String(requestId || 'unknown'), details: String(details || 'No details provided.') };
}
export function createNotificationPayload(request, channel = 'email', now = new Date()) {
  const slaState = getSlaState(request, now);
  const severity = slaState === 'breached' || request.priority === 'critical' ? 'critical' : slaState === 'risk' || request.priority === 'high' ? 'high' : 'normal';
  return { channel, severity, requestId: request.id, customer: request.customer, recipientRole: request.roles?.[0] || 'manager', subject: `[${severity.toUpperCase()}] ${request.id} ${request.module}`, message: `${request.customer}: ${request.description}`, retryPolicy: { maxAttempts: severity === 'critical' ? 5 : 3, retryAfterMinutes: severity === 'critical' ? 5 : 15 } };
}
export function exportRequestsToCsv(requests) {
  const headers = ['id', 'customer', 'module', 'owner', 'priority', 'status', 'dueAt', 'value'];
  const escapeCell = (value) => /[",\n]/.test(String(value ?? '')) ? `"${String(value ?? '').replace(/"/g, '""')}"` : String(value ?? '');
  return [headers.join(','), ...requests.map((request) => headers.map((header) => escapeCell(request[header])).join(','))].join('\n');
}
export function buildWeeklyReport(requests, now = new Date()) {
  const kpis = calculateKpis(requests, now);
  const grouped = groupRequestsByStatus(requests);
  return { generatedAt: new Date(now).toISOString(), title: 'Weekly CRM Operations Report', kpis, lines: [`${kpis.active} active requests from ${kpis.total} total.`, `${kpis.slaRisk} requests require SLA attention, including ${kpis.breached} breached.`, `${grouped.review} requests are ready for review and ${grouped.blocked} are blocked.`] };
}
