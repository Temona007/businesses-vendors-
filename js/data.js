/**
 * Demo data for MVP - simulates multi-tenant DB
 * In production: replace with API calls to backend
 */

const DEMO_DATA = {
  tenants: [
    { id: 't1', name: 'Acme Property Management', slug: 'acme' },
    { id: 't2', name: 'Metro Building Co', slug: 'metro' }
  ],
  users: [
    { id: 'u1', tenantId: 't1', role: 'admin', name: 'Sarah Chen', email: 'sarah@acme.com' },
    { id: 'u2', tenantId: 't1', role: 'client', name: 'Mike Johnson', email: 'mike@acme.com' },
    { id: 'u3', tenantId: 't1', role: 'client', name: 'Emily Davis', email: 'emily@acme.com' },
    { id: 'u4', tenantId: 't2', role: 'admin', name: 'David Park', email: 'david@metro.com' },
    { id: 'u5', tenantId: 't2', role: 'client', name: 'Lisa Wong', email: 'lisa@metro.com' },
    { id: 'v1', tenantId: null, role: 'vendor', name: 'Pro Plumbing LLC', email: 'jobs@proplumbing.com' },
    { id: 'v2', tenantId: null, role: 'vendor', name: 'QuickFix HVAC', email: 'dispatch@quickfix.com' },
    { id: 'v3', tenantId: null, role: 'vendor', name: 'Elite Electric', email: 'jobs@eliteelectric.com' }
  ],
  vendors: [
    { id: 'v1', name: 'Pro Plumbing LLC', category: 'plumbing', tenantIds: ['t1', 't2'], available: true },
    { id: 'v2', name: 'QuickFix HVAC', category: 'hvac', tenantIds: ['t1', 't2'], available: true },
    { id: 'v3', name: 'Elite Electric', category: 'electrical', tenantIds: ['t1'], available: true }
  ],
  tickets: [
    { id: 'tk1', tenantId: 't1', clientId: 'u2', vendorId: 'v1', title: 'Leaking faucet - Unit 4B', category: 'plumbing', status: 'in_progress', priority: 'high', createdAt: '2025-03-20T09:00:00Z', assignedAt: '2025-03-20T09:15:00Z', location: '123 Oak St, Apt 4B' },
    { id: 'tk2', tenantId: 't1', clientId: 'u3', vendorId: null, title: 'AC not cooling', category: 'hvac', status: 'pending_assignment', priority: 'urgent', createdAt: '2025-03-21T14:00:00Z', assignedAt: null, location: '456 Pine Ave, Unit 12' },
    { id: 'tk3', tenantId: 't1', clientId: 'u2', vendorId: 'v3', title: 'Outlet not working', category: 'electrical', status: 'completed', priority: 'medium', createdAt: '2025-03-18T11:00:00Z', assignedAt: '2025-03-18T11:30:00Z', location: '123 Oak St, Apt 4B' },
    { id: 'tk4', tenantId: 't2', clientId: 'u5', vendorId: null, title: 'Water heater inspection', category: 'plumbing', status: 'pending_assignment', priority: 'medium', createdAt: '2025-03-22T08:00:00Z', assignedAt: null, location: '789 Main Blvd' },
    { id: 'tk5', tenantId: 't1', clientId: 'u3', vendorId: 'v2', title: 'Furnace maintenance', category: 'hvac', status: 'accepted', priority: 'low', createdAt: '2025-03-21T16:00:00Z', assignedAt: '2025-03-21T16:05:00Z', location: '456 Pine Ave, Unit 12' },
    { id: 'tk6', tenantId: 't2', clientId: 'u5', vendorId: 'v1', title: 'Drain clog - lobby', category: 'plumbing', status: 'pending_acceptance', priority: 'high', createdAt: '2025-03-22T07:30:00Z', assignedAt: '2025-03-22T07:35:00Z', location: '789 Main Blvd, Lobby' }
  ],
  updates: [
    { id: 'up1', ticketId: 'tk1', userId: 'v1', type: 'status', message: 'Arrived on site', createdAt: '2025-03-20T10:00:00Z' },
    { id: 'up2', ticketId: 'tk1', userId: 'v1', type: 'status', message: 'Replaced cartridge, testing', createdAt: '2025-03-20T10:45:00Z' },
    { id: 'up3', ticketId: 'tk3', userId: 'v3', type: 'status', message: 'Completed - loose wire in outlet', createdAt: '2025-03-18T13:00:00Z' }
  ],
  payments: [
    { id: 'p1', ticketId: 'tk3', amount: 150, status: 'paid', createdAt: '2025-03-18T14:00:00Z' },
    { id: 'p2', ticketId: 'tk1', amount: 285, status: 'pending', createdAt: '2025-03-20T11:00:00Z' }
  ]
};

function getData() {
  return JSON.parse(JSON.stringify(DEMO_DATA));
}

function saveData(data) {
  try {
    localStorage.setItem('vendor_dispatch_data', JSON.stringify(data));
  } catch (e) {}
}

function loadData() {
  try {
    const saved = localStorage.getItem('vendor_dispatch_data');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return getData();
}
