# Vendor Dispatch MVP

Multi-tenant service dispatch platform connecting businesses with vendors. Uber-style dispatch, Stripe-inspired dashboard UX.

## Quick Start

```bash
# Serve locally (or open index.html)
npx serve .
# or
python3 -m http.server 8000
```

Open http://localhost:8000 (or 3000 for serve). Click **Client**, **Vendor**, or **Admin** to enter.

## Architecture

### 1. Multi-tenant structure

```
Tenant (business)
├── Users (admins, clients)
├── Tickets (service requests)
└── Vendors (linked via tenantIds)

Vendors can serve multiple tenants (tenantIds: ['t1','t2'])
```

- **Tenant isolation**: Data scoped by `tenantId`. Admins/clients see only their tenant.
- **Shared vendor pool**: Vendors opt into tenants. Dispatch filters by `tenantIds` and category.
- **Scaling**: Add `tenant` table, `user.tenant_id`, `ticket.tenant_id`. Row-level or schema-per-tenant for stricter isolation.

### 2. Real-time dispatch (technical approach)

**MVP (current):** Polling every 3s. Simple, works everywhere.

**Production options:**

| Approach      | Pros                          | Cons                      |
|---------------|--------------------------------|---------------------------|
| WebSockets     | True real-time, low latency    | Server infra, reconnects  |
| Server-Sent Events | One-way, simpler than WS  | Client→server needs REST   |
| Firebase/Supabase | Real-time out of the box   | Vendor lock-in            |
| Long polling   | Works behind most firewalls    | More load than WS         |

**Suggested:** WebSockets (Socket.io or ws) for:
- New ticket → push to eligible vendors
- Vendor accept/reject → push to client/admin
- Status updates → push to all parties

### 3. Anticipated challenges

| Challenge                  | Mitigation                                              |
|---------------------------|---------------------------------------------------------|
| Vendor no-show / rejection | Re-dispatch, escalation, SLA tracking                  |
| Race conditions (accept)   | Optimistic locking, "claimed" flags, short TTL         |
| Multi-location routing     | Geo matching, capacity, preferences                    |
| Payment reconciliation     | Idempotent webhooks, audit logs, retries                |
| Scale per tenant           | Caching, read replicas, tenant sharding                 |

## MVP scope

- ✅ Role selection (Client, Vendor, Admin)
- ✅ Ticket creation + management
- ✅ Auto-assign + accept/reject
- ✅ Job lifecycle (pending → accepted → in_progress → completed)
- ✅ Client dashboard (create, track)
- ✅ Vendor dashboard (assigned, active, status updates)
- ✅ Admin panel (tickets, users, payments)
- ✅ Demo data + localStorage persistence

## Data model (demo)

- `tenants` – businesses
- `users` – admins, clients (per tenant)
- `vendors` – service providers (multi-tenant)
- `tickets` – jobs with status lifecycle
- `payments` – invoice/paid status

## Next steps (post-MVP)

1. Backend API (Node/Express or similar)
2. Real DB (Postgres) + migrations
3. WebSockets for real-time
4. Stripe Connect for vendor payouts
5. Auth (JWT, OAuth)
