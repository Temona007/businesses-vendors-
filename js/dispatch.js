/**
 * Uber-style dispatch logic
 * - Auto-assign: match ticket category to vendor, round-robin among available
 * - Accept/reject flow
 */

function getEligibleVendors(ticket, vendors) {
  return vendors.filter(v =>
    v.category === ticket.category &&
    v.available &&
    (v.tenantIds.includes(ticket.tenantId) || v.tenantIds.length === 0)
  );
}

function autoAssignTicket(ticket, vendors) {
  const eligible = getEligibleVendors(ticket, vendors);
  if (eligible.length === 0) return null;
  return eligible[0].id;
}

function assignTicketToVendor(data, ticketId, vendorId) {
  const ticket = data.tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.status !== 'pending_assignment') return false;
  ticket.vendorId = vendorId;
  ticket.assignedAt = new Date().toISOString();
  ticket.status = 'pending_acceptance';
  return true;
}

function vendorAcceptTicket(data, ticketId, vendorId) {
  const ticket = data.tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.vendorId !== vendorId || ticket.status !== 'pending_acceptance') return false;
  ticket.status = 'accepted';
  return true;
}

function vendorRejectTicket(data, ticketId, vendorId) {
  const ticket = data.tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.vendorId !== vendorId || ticket.status !== 'pending_acceptance') return false;
  ticket.vendorId = null;
  ticket.assignedAt = null;
  ticket.status = 'pending_assignment';
  return true;
}

function updateTicketStatus(data, ticketId, newStatus, vendorId) {
  const ticket = data.tickets.find(t => t.id === ticketId);
  if (!ticket) return false;
  if (ticket.vendorId !== vendorId && ticket.clientId !== vendorId) return false;
  const valid = ['accepted', 'in_progress', 'completed', 'cancelled'];
  if (!valid.includes(newStatus)) return false;
  ticket.status = newStatus;
  return true;
}
