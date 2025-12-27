# Invoxa UI Blueprint (Front-End First)

Purpose: Define the user-facing surface area (entities, flows, screens, layout patterns) so the front end can be built end-to-end with mocks (no backend yet) without becoming generic.

---

## Non-Negotiables (Locked In)
- App uses a **persistent sidebar navigation**.
- Sidebar includes a **user profile area pinned at the bottom** (avatar/name/role + menu).
- **Repair Orders (RO) exist for every active job** (auto-created when a mechanic starts a Service Log) to match common industry work-order workflows.
- **Service Logs are a first-class entity** (not a subset of Repair Orders).
- **Templates are managed under Settings** (not a top-level nav item).
- App includes **Auth screens** (Login / Signup / Forgot Password) and **User Profile pages**.

---

## Product Summary
Invoxa is a repair shop invoicing system that manages:
- Customers and customer vehicles
- Repair Orders (RO)
- Service Logs (independent entity)
- Invoices and payments
- Settings (includes Blade HTML email/invoice templates + SMTP)
- Users, roles, permissions
- User profile pages

Primary outcomes:
1) Create and manage repair orders efficiently
2) Convert RO → invoice with correct totals
3) Take payments and send invoice/receipt
4) Maintain service history by customer + vehicle (via Service Logs)

---

## Core Entities (UI-first models)

### Customer
Fields: id, name, phone, email, address, notes, tags, status, createdAt  
UI needs:
- customer profile header
- contact actions (call/email)
- vehicles list
- history: repair orders, invoices, payments, service logs

### Vehicle
Fields: id, customerId, year, make, model, trim, VIN, plate, mileage, notes  
UI needs:
- vehicle header + key identifiers
- quick “create RO” and “create Service Log”
- service history timeline (logs + linked docs)

### Repair Order (RO)
Fields: id, customerId, vehicleId, status, priority, complaint, symptoms, requestedWork?, approvedWork?, notes, assignedTo, openedAt, closedAt  
Purpose (industry-aligned): **Intake + dispatch + authorization** (the job container that tracks assignment, status, and approval).  
Line items note: RO may hold **requested/approved work** for quoting/authorization, but **canonical billable items are captured in the Service Log**.

UI needs:
- RO intake (customer/vehicle/symptoms/complaint)
- assignment + acceptance (who’s working it, priority, scheduling signals)
- status workflow (New → Assigned → In Progress → Waiting → Completed → Closed/Cancelled)
- “Create Service Log” / “Open Service Log” primary action
- link to related invoice (if exists)

### Service Log (Independent)
Fields: id, customerId, vehicleId, status, title, category, symptoms, diagnosis, internalNotes, details, mileage, occurredAt, attachments?  
Work + billing source:
- labor: description, hours, rate, total
- parts: part#, description, qty, unit price, total
- fees/discounts/tax flags (as inputs for accounting rules)

Links (optional):
- roId? (if created from/for an RO)
- invoiceId? (if billing was generated)

Purpose: **Mechanic journal + performed work record**. This is the primary source for generating a **draft invoice (~90% complete)** for accounting to finalize.

UI needs:
- dedicated Service Logs list + filters
- create/edit Service Log (journal + line items)
- submit to accounting: Draft → In Progress → Ready for Accounting → Returned → Approved (optional)
- vehicle service timeline view
- linkbacks to related RO/invoice (optional)

### Invoice
Fields: id, roId?, customerId, vehicleId, status, dueDate, terms, number, totals, notes  
UI needs:
- invoice builder + preview
- “send invoice” action
- status: draft/sent/paid/void

### Payment
Fields: id, invoiceId, amount, method, reference, receivedAt, notes  
UI needs:
- capture payment form
- payment history list
- invoice balance indicator (full/partial)

### Settings (Grouped)
#### Email Template (Blade HTML)
Fields: id, name, subject, bodyHtml, variables, updatedAt  
UI: editor + preview + variable inserter

#### Invoice Template (Blade HTML)
Fields: id, name, bodyHtml, variables  
UI: editor + preview with invoice mock data

#### SMTP Settings
Fields: host, port, username, passwordRef, encryption, fromName, fromEmail  
UI: config form + test send (phase 2)

#### Shop Profile / Billing Rules
Fields: shop name, address, taxes, fees, invoice numbering rules, terms defaults  
UI: forms + previews (where relevant)

### User / Role / Permission
User: id, name, email, status, roleIds  
Role: id, name  
Permission: key (scoped actions)
UI needs:
- users list + invite
- role editor (permission matrix)
- user detail page

### User Profile (Self)
Fields: name, email, password reset, 2FA later, preferences (theme), sessions (later)  
UI needs:
- profile page
- security page (password change, sessions later)
- notification preferences (optional)

---

## Navigation Map (Locked Sidebar)
Top-level sidebar items:
1) Dashboard
2) Customers
3) Vehicles
4) Repair Orders
5) Service Logs
6) Invoices
7) Payments
8) Settings

Sidebar bottom (pinned):
- User profile block (avatar, name, role)
- Dropdown menu:
  - Profile
  - Account/Security
  - Switch theme (optional)
  - Sign out

Settings sub-navigation:
- Shop Profile
- Billing Rules (tax/fees/numbering/terms)
- Templates
  - Email Templates
  - Invoice Templates
- SMTP / Email
- Users
- Roles & Permissions

---

## Auth Screens (Required)
Routes/pages:
- Login
- Sign Up
- Forgot Password
- Reset Password (token-based later)

UX requirements:
- Minimal, clean layout
- Strong validation, clear errors
- Password visibility toggle
- “Remember me” optional
- Links between auth screens

---

## Core Flows (Happy Paths)

### Flow A: Customer Online Request → RO → Service Log → Draft Invoice → Final Invoice
1) Customer submits service request online (customer/vehicle/symptoms)  
2) System creates RO (New)  
3) Mechanic accepts/assigned → RO (Assigned/In Progress)  
4) Mechanic creates Service Log linked to RO (diagnosis + performed work + line items)  
5) Mechanic submits Service Log → Ready for Accounting  
6) System generates Draft Invoice from Service Log (90% complete)  
7) Accounting reviews/finalizes and sends invoice (mock for now)  
8) Payment recorded → invoice status updates → RO can be Closed

### Flow B: Mechanic-First → Service Log → Auto-RO → Draft Invoice → Final Invoice
1) Mechanic creates Service Log (select/create customer + vehicle, capture symptoms/diagnosis, add line items)  
2) System auto-creates a linked RO in the background (In Progress) if one doesn’t exist  
3) Mechanic submits Service Log → Ready for Accounting  
4) System generates Draft Invoice from Service Log  
5) Accounting finalizes and sends invoice (mock for now)

### Flow C: Service Logs (History-Only)
1) Mechanic or office creates a Service Log entry for a vehicle (no RO/invoice required)  
2) Entry appears in Vehicle + Customer service timeline  
3) Filter by category/date/mileage

### Flow D: Settings (Templates + SMTP + Users/Roles)
1) Configure shop profile & billing rules  
2) Configure SMTP  
3) Manage templates (email + invoice) with preview using mock invoice/customer data  
4) Manage users/roles

### Flow E: User Profile
1) Open user menu  
2) Profile: update name/email (mock)  
3) Security: change password (mock)

---

## Page Templates (Reusable Layouts)

### Template 1: Index/List + Filters + Bulk Actions
Used by: Customers, Vehicles, ROs, Service Logs, Invoices, Payments, Users, Roles  
Parts:
- PageHeader (title + primary CTA)
- FilterBar (search + filters)
- DataTable (sortable, selectable)
- EmptyState
- Pagination/footer

### Template 2: Master–Detail
Used by: Customers, Vehicles, ROs, Invoices  
Parts:
- Left list; right detail
- Mobile: list → detail route OR segmented navigation

### Template 3: Create/Edit Form
Used by: Customer, Vehicle, Service Log, Settings pages, User  
Parts:
- Form sections
- Inline validation
- Sticky actions (desktop) / bottom action bar (mobile)

### Template 4: Builder + Live Preview
Used by: Invoice builder, Template editor  
Parts:
- Left: editor panels
- Right: preview
- Mobile: Editor/Preview segmented control

### Template 5: Settings Hub
Used by: Settings  
Parts:
- Sub-nav + content panel
- Mobile: nested routes

---

## Key Screens (Front-End Milestone Order)

### Milestone 1: App Shell + Auth
- Login / Signup / Forgot Password / Reset Password
- Sidebar layout (locked) + bottom user profile menu
- Skeleton routes for all app pages

### Milestone 2: Customers + Vehicles
- Customer list/create/edit
- Customer profile (vehicles + history tabs)
- Vehicle list/create/edit
- Vehicle profile + service timeline

### Milestone 3: Service Logs (Independent + Billing Source)
- Service Logs list + filters
- Create/edit Service Log (journal + line items)
- Submit to accounting (Ready for Accounting + Returned loop)
- Generate Draft Invoice from Service Log (mock)
- Link log to vehicle/customer and optionally RO/invoice

### Milestone 4: Repair Orders (Dispatch + Authorization)
- RO list + status filters
- RO intake: complaint/symptoms/notes + assignment/acceptance
- RO status workflow (New → Assigned → In Progress → Waiting → Completed → Closed/Cancelled)
- Create/Open Service Log CTA (mechanic work happens in Service Log)
- Link to related invoice (if exists)

### Milestone 5: Invoices + Payments
- Invoice list + detail/builder + preview
- Send invoice modal (mock)
- Payments list + capture payment modal

### Milestone 6: Settings + Users/Roles + Templates
- Settings pages scaffold
- Templates under Settings (email + invoice)
- SMTP form
- Users list + roles matrix
- User profile pages (self) + user detail pages (admin)

---

## Route Map (Proposed)

Auth:
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

App:
- `/dashboard`
- `/customers`
- `/customers/new`
- `/customers/[id]`
- `/vehicles`
- `/vehicles/new`
- `/vehicles/[id]`
- `/repair-orders`
- `/repair-orders/new`
- `/repair-orders/[id]`
- `/service-logs`
- `/service-logs/new`
- `/service-logs/[id]`
- `/invoices`
- `/invoices/new`
- `/invoices/[id]`
- `/payments`

Settings:
- `/settings`
- `/settings/shop`
- `/settings/billing`
- `/settings/templates/email`
- `/settings/templates/invoice`
- `/settings/smtp`
- `/settings/users`
- `/settings/roles`

User (self):
- `/profile`
- `/profile/security`

---

## Front-End Mocking Plan (No Backend Yet)
- MSW handlers mirroring the route map:
  - list + detail + create/update endpoints
- Worst-case mock data:
  - long customer names/emails/VINs
  - many line items
  - very large totals
  - varied statuses
- Include error fixtures:
  - validation errors, permission denied, network errors

---

## Responsiveness Rules (Acceptance Criteria)
Required checks before any screen is “done”:
- widths: 360, 390, 768, 1024+
- no horizontal scroll
- long strings do not break layout (truncate/wrap rules)
- tables have a mobile strategy (stacked rows or condensed rows)
- action bars usable on mobile (stack/bottom bar)
- tap targets >= 44px

---

## Definition of Done (UI Feature)
A UI feature is complete when:
- Uses shared templates/components (no one-off layout)
- Responsive acceptance criteria passes
- Has loading/empty/error states
- Works end-to-end against mocks (create → view → edit)
- Copy is specific and task-oriented (no generic filler)
