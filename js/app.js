const STATUS_LABELS = {
  pending_assignment: 'Awaiting vendor',
  pending_acceptance: 'Pending acceptance',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

let data = loadData();
let pollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initEventListeners();
  startPolling();
});

function initAuth() {
  const user = Auth.getCurrentUser();
  if (user) {
    showView(user.role);
    renderDashboard(user);
  }
}

function showView(role) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewMap = { admin: 'admin-view', client: 'client-view', vendor: 'vendor-view' };
  const el = document.getElementById(viewMap[role]);
  if (el) el.classList.add('active');
}

function setUserName(role, name) {
  const el = document.getElementById(`${role}-user-name`) || document.getElementById('admin-user-name');
  if (el) el.textContent = name;
}

function initEventListeners() {
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Auth.login(btn.dataset.role, btn.dataset.user);
      showView(btn.dataset.role);
      renderDashboard({ role: btn.dataset.role, userId: btn.dataset.user });
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('vendor-logout-btn')?.addEventListener('click', logout);
  document.getElementById('admin-logout-btn')?.addEventListener('click', logout);
  document.getElementById('new-ticket-btn')?.addEventListener('click', () => openModal('new-ticket-modal'));
  document.getElementById('cancel-ticket-btn')?.addEventListener('click', () => closeModal('new-ticket-modal'));
  document.getElementById('new-ticket-form')?.addEventListener('submit', handleNewTicket);

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`admin-${tab.dataset.tab}`).classList.add('active');
    });
  });

  document.querySelector('.modal')?.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) closeModal('new-ticket-modal');
  });

  document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
    localStorage.removeItem('vendor_dispatch_data');
    data = loadData();
    location.reload();
  });

  document.getElementById('client-tickets')?.addEventListener('click', handleTicketAction);
  document.getElementById('vendor-assigned')?.addEventListener('click', handleTicketAction);
  document.getElementById('vendor-active')?.addEventListener('click', handleTicketAction);
}

function logout() {
  Auth.logout();
  stopPolling();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('login-view').classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function handleNewTicket(e) {
  e.preventDefault();
  const form = e.target;
  const user = Auth.getCurrentUser();
  if (user?.role !== 'client') return;
  const client = data.users.find(u => u.id === user.userId);
  if (!client?.tenantId) return;

  const ticket = {
    id: 'tk' + Date.now(),
    tenantId: client.tenantId,
    clientId: user.userId,
    vendorId: null,
    title: form.title.value,
    category: form.category.value,
    status: 'pending_assignment',
    priority: form.priority.value,
    createdAt: new Date().toISOString(),
    assignedAt: null,
    location: form.location.value
  };

  const vendorId = autoAssignTicket(ticket, data.vendors);
  if (vendorId) {
    ticket.vendorId = vendorId;
    ticket.assignedAt = new Date().toISOString();
    ticket.status = 'pending_acceptance';
  }

  data.tickets.push(ticket);
  saveData(data);
  closeModal('new-ticket-modal');
  form.reset();
  renderClientTickets();
}

function renderDashboard(user) {
  const u = data.users.find(x => x.id === user.userId);
  const v = data.vendors.find(x => x.id === user.userId);
  setUserName(user.role, u?.name || v?.name || 'User');
  if (user.role === 'client') renderClientTickets();
  if (user.role === 'vendor') renderVendorDashboard();
  if (user.role === 'admin') {
    renderAdminTickets();
    renderAdminUsers();
    renderAdminPayments();
  }
}

function renderClientTickets() {
  const user = Auth.getCurrentUser();
  if (!user || user.role !== 'client') return;
  const tickets = data.tickets.filter(t => t.clientId === user.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const container = document.getElementById('client-tickets');
  container.innerHTML = tickets.length ? tickets.map(t => ticketRow(t, 'client')).join('') : '<div class="empty-state"><div class="empty-state-icon">📋</div>No service requests yet. Create one to get started.</div>';
}

function renderVendorDashboard() {
  const user = Auth.getCurrentUser();
  if (!user || user.role !== 'vendor') return;
  const assigned = data.tickets.filter(t => t.vendorId === user.userId && t.status === 'pending_acceptance');
  const active = data.tickets.filter(t => t.vendorId === user.userId && !['pending_acceptance', 'completed', 'cancelled'].includes(t.status));
  document.getElementById('vendor-assigned').innerHTML = assigned.length ? assigned.map(t => ticketRow(t, 'vendor')).join('') : '<div class="empty-state"><div class="empty-state-icon">✓</div>No pending assignments.</div>';
  document.getElementById('vendor-active').innerHTML = active.length ? active.map(t => ticketRow(t, 'vendor')).join('') : '<div class="empty-state"><div class="empty-state-icon">🔧</div>No active jobs.</div>';
}

function ticketRow(ticket, context) {
  const tenant = data.tenants.find(t => t.id === ticket.tenantId);
  const client = data.users.find(u => u.id === ticket.clientId);
  const vendor = data.vendors.find(v => v.id === ticket.vendorId);
  const priorityClass = ticket.priority === 'urgent' ? 'priority-urgent' : ticket.priority === 'high' ? 'priority-high' : '';
  let actions = '';
  if (context === 'vendor') {
    if (ticket.status === 'pending_acceptance') {
      actions = `<button class="btn btn-success btn-sm" data-action="accept" data-id="${ticket.id}">Accept</button><button class="btn btn-danger btn-sm" data-action="reject" data-id="${ticket.id}">Reject</button>`;
    } else if (['accepted', 'in_progress'].includes(ticket.status)) {
      const nextStatus = ticket.status === 'accepted' ? 'in_progress' : 'completed';
      actions = `<button class="btn btn-primary btn-sm" data-action="status" data-id="${ticket.id}" data-status="${nextStatus}">${ticket.status === 'accepted' ? 'Start job' : 'Mark complete'}</button>`;
    }
  }
  const meta = context === 'vendor' ? `${tenant?.name || ''} · ${client?.name || ''} · ${ticket.location}` : `${ticket.location} · ${vendor?.name || '—'} · ${new Date(ticket.createdAt).toLocaleDateString()}`;
  return `<div class="ticket-item" data-id="${ticket.id}"><div class="ticket-info"><h4 class="${priorityClass}">${escapeHtml(ticket.title)}</h4><div class="ticket-meta">${escapeHtml(meta)}</div></div><div class="ticket-actions"><span class="status-badge status-${ticket.status}">${STATUS_LABELS[ticket.status] || ticket.status}</span>${actions}</div></div>`;
}

function handleTicketAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  e.preventDefault();
  const action = btn.dataset.action;
  const ticketId = btn.dataset.id;
  const user = Auth.getCurrentUser();
  if (!user || user.role !== 'vendor') return;
  data = loadData();
  if (action === 'accept' && vendorAcceptTicket(data, ticketId, user.userId)) { saveData(data); renderVendorDashboard(); }
  else if (action === 'reject' && vendorRejectTicket(data, ticketId, user.userId)) {
    saveData(data);
    const ticket = data.tickets.find(t => t.id === ticketId);
    const vendorId = autoAssignTicket(ticket, data.vendors);
    if (vendorId) assignTicketToVendor(data, ticketId, vendorId);
    saveData(data);
    renderVendorDashboard();
  } else if (action === 'status') {
    const newStatus = btn.dataset.status;
    if (updateTicketStatus(data, ticketId, newStatus, user.userId)) {
      if (newStatus === 'completed') data.payments.push({ id: 'p' + Date.now(), ticketId, amount: Math.round(80 + Math.random() * 200), status: 'pending', createdAt: new Date().toISOString() });
      saveData(data);
      renderVendorDashboard();
    }
  }
}

function renderAdminTickets() {
  const tickets = [...data.tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const container = document.getElementById('admin-ticket-list');
  container.innerHTML = tickets.map(t => {
    const tenant = data.tenants.find(x => x.id === t.tenantId);
    const client = data.users.find(u => u.id === t.clientId);
    const vendor = data.vendors.find(v => v.id === t.vendorId);
    return `<div class="ticket-item"><div class="ticket-info"><h4>${escapeHtml(t.title)}</h4><div class="ticket-meta">${tenant?.name} · ${client?.name} · ${vendor?.name || '—'}</div></div><span class="status-badge status-${t.status}">${STATUS_LABELS[t.status] || t.status}</span></div>`;
  }).join('') || '<div class="empty-state">No tickets.</div>';
}

function renderAdminUsers() {
  document.getElementById('admin-user-list').innerHTML = data.users.map(u => `<div class="user-item"><span>${escapeHtml(u.name)} · ${escapeHtml(u.email)}</span><span class="role-badge role-${u.role}">${u.role}</span></div>`).join('');
}

function renderAdminPayments() {
  document.getElementById('admin-payment-list').innerHTML = data.payments.map(p => {
    const ticket = data.tickets.find(t => t.id === p.ticketId);
    return `<div class="payment-item"><span>${ticket?.title || '—'} · $${p.amount}</span><span class="status-badge status-${p.status === 'paid' ? 'completed' : 'pending_acceptance'}">${p.status}</span></div>`;
  }).join('') || '<div class="empty-state">No payments.</div>';
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(() => {
    const user = Auth.getCurrentUser();
    if (!user) return;
    data = loadData();
    renderDashboard(user);
  }, 3000);
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}
