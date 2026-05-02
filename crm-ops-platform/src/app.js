import { STATUS, buildAuditEvent, buildWeeklyReport, calculateKpis, calculateSlaHoursLeft, createNotificationPayload, exportRequestsToCsv, filterRequests, getSlaState, groupRequestsByStatus, rankRequestsByUrgency, seedAuditLog, seedRequests } from './domain.js';

const state = { requests: JSON.parse(JSON.stringify(seedRequests)), auditLog: JSON.parse(JSON.stringify(seedAuditLog)), filters: { query: '', status: 'all', owner: 'all' }, selectedId: seedRequests[0].id, now: new Date('2026-05-02T10:00:00+05:00') };
const currency = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });
const $ = (id) => document.getElementById(id);
const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };
const cell = (text) => Object.assign(document.createElement('td'), { textContent: text });
function chip(text, tone = 'neutral') { const el = document.createElement('span'); el.className = `status-chip ${tone}`; el.textContent = text; return el; }
function slaText(request) { if (request.status === 'closed') return 'Resolved'; const hours = calculateSlaHoursLeft(request, state.now); return hours <= 0 ? `${Math.abs(hours).toFixed(1)} ч overdue` : `${hours.toFixed(1)} ч left`; }
function selected() { return state.requests.find((request) => request.id === state.selectedId) || state.requests[0]; }
function filtered() { return filterRequests(state.requests, state.filters); }

function renderKpis() {
  const kpis = calculateKpis(state.requests, state.now);
  $('activeRequests').textContent = kpis.active;
  $('activeRequestsMeta').textContent = `${kpis.total} всего, ${kpis.closed} закрыто`;
  $('slaRisk').textContent = kpis.slaRisk;
  $('slaRiskMeta').textContent = `${kpis.breached} просрочено`;
  $('pipelineValue').textContent = currency.format(kpis.pipelineValue);
  $('avgResolution').textContent = `${kpis.averageResolutionHours} ч`;
}
function renderOwners() {
  const select = $('ownerFilter');
  const value = select.value || 'all';
  const owners = [...new Set(state.requests.map((request) => request.owner))].sort();
  clear(select);
  select.append(new Option('Все', 'all'));
  owners.forEach((owner) => select.append(new Option(owner, owner)));
  select.value = owners.includes(value) ? value : 'all';
}
function renderRequests() {
  const tbody = $('requestRows');
  const rows = rankRequestsByUrgency(filtered(), state.now);
  clear(tbody);
  $('visibleCount').textContent = `${rows.length} записей`;
  rows.forEach((request) => {
    const row = document.createElement('tr');
    row.className = request.id === state.selectedId ? 'selected' : '';
    row.addEventListener('click', () => { state.selectedId = request.id; render(); });
    row.append(cell(request.id), cell(request.customer), cell(request.module), cell(request.priority));
    const status = document.createElement('td'); status.append(chip(STATUS[request.status].label, STATUS[request.status].tone)); row.append(status);
    const sla = document.createElement('td'); sla.append(chip(slaText(request), getSlaState(request, state.now))); row.append(sla);
    row.append(cell(currency.format(request.value)));
    tbody.append(row);
  });
}
function renderDetail() {
  const request = selected();
  state.selectedId = request.id;
  $('detailTitle').textContent = request.id;
  $('detailCustomer').textContent = `${request.customer} / ${request.module}`;
  $('detailOwner').textContent = request.owner;
  $('detailRoles').textContent = request.roles.join(', ');
  $('detailDescription').textContent = request.description;
  $('detailSla').className = `status-chip ${getSlaState(request, state.now)}`;
  $('detailSla').textContent = slaText(request);
}
function renderStatusChart() {
  const chart = $('statusChart');
  const grouped = groupRequestsByStatus(state.requests);
  const max = Math.max(...Object.values(grouped), 1);
  clear(chart);
  Object.entries(grouped).forEach(([status, count]) => {
    const row = document.createElement('div'); row.className = 'chart-row';
    row.innerHTML = `<span>${STATUS[status].label}</span><div class="chart-track"><div class="chart-bar ${STATUS[status].tone}" style="width:${Math.max((count / max) * 100, count ? 12 : 0)}%"></div></div><strong>${count}</strong>`;
    chart.append(row);
  });
}
function renderWorkload() {
  const list = $('workloadList');
  clear(list);
  [...new Set(state.requests.map((request) => request.owner))].sort().forEach((owner) => {
    const active = state.requests.filter((request) => request.owner === owner && request.status !== 'closed');
    const risk = active.filter((request) => ['risk', 'breached'].includes(getSlaState(request, state.now))).length;
    const item = document.createElement('div'); item.className = 'workload-item'; item.innerHTML = `<span>${owner}</span><strong>${active.length} active / ${risk} SLA</strong>`; list.append(item);
  });
}
function renderAudit() {
  const list = $('auditList');
  clear(list);
  state.auditLog.slice(0, 7).forEach((event) => { const item = document.createElement('li'); item.innerHTML = `<strong>${event.requestId} · ${event.action}</strong><span>${event.details}</span>`; list.append(item); });
}
function downloadCsv() {
  const blob = new Blob([exportRequestsToCsv(filtered())], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'crm-requests.csv'; link.click(); URL.revokeObjectURL(url);
}
function showWeeklyReport() { $('notificationPreview').textContent = JSON.stringify(buildWeeklyReport(state.requests, state.now), null, 2); }
function notifySelected() {
  const request = selected(); const payload = createNotificationPayload(request, 'email', state.now);
  $('notificationPreview').textContent = JSON.stringify(payload, null, 2);
  state.auditLog.unshift(buildAuditEvent({ actor: 'manager', action: 'notification_created', requestId: request.id, details: `Prepared ${payload.severity} notification for ${request.customer}.` }, state.now));
  renderAudit();
}
function markReview() {
  const request = selected(); if (request.status === 'closed') return;
  request.status = 'review';
  state.auditLog.unshift(buildAuditEvent({ actor: 'developer', action: 'status_changed', requestId: request.id, details: `${request.id} moved to review after implementation check.` }, state.now));
  render();
}
function addRequest(form) {
  const data = new FormData(form);
  const request = { id: `REQ-${2400 + state.requests.length + 1}`, customer: String(data.get('customer')).trim(), module: String(data.get('module')), owner: 'Dana', priority: String(data.get('priority')), status: 'backlog', dueAt: new Date(state.now.getTime() + 48 * 60 * 60 * 1000).toISOString(), createdAt: state.now.toISOString(), value: Number(data.get('value') || 0), tags: ['new', 'triage'], description: String(data.get('description')).trim(), roles: ['manager', 'developer'] };
  state.requests.unshift(request); state.selectedId = request.id; state.auditLog.unshift(buildAuditEvent({ actor: 'manager', action: 'request_created', requestId: request.id, details: `${request.customer} request created in ${request.module}.` }, state.now));
  form.reset(); renderOwners(); render();
}
async function checkApi() { try { const res = await fetch('/health', { cache: 'no-store' }); const data = await res.json(); $('apiStatus').textContent = data.status === 'ok' ? 'Mock API online' : 'Static demo'; } catch { $('apiStatus').textContent = 'Static demo'; } }
function render() { renderKpis(); renderRequests(); renderDetail(); renderStatusChart(); renderWorkload(); renderAudit(); }
$('searchInput').addEventListener('input', (event) => { state.filters.query = event.target.value; renderRequests(); });
$('statusFilter').addEventListener('change', (event) => { state.filters.status = event.target.value; renderRequests(); });
$('ownerFilter').addEventListener('change', (event) => { state.filters.owner = event.target.value; renderRequests(); });
$('exportCsvBtn').addEventListener('click', downloadCsv);
$('weeklyReportBtn').addEventListener('click', showWeeklyReport);
$('notifyBtn').addEventListener('click', notifySelected);
$('markReviewBtn').addEventListener('click', markReview);
$('requestForm').addEventListener('submit', (event) => { event.preventDefault(); addRequest(event.currentTarget); });
renderOwners(); render(); checkApi();
