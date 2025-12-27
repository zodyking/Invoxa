# Invoxa Workflows (Front-End First)

Purpose: Explicitly document how Service Logs, Invoices, and Payments move through the system, including who owns each step, what gets created automatically, and which screens/actions support each transition. This is front-end focused (mock-backed), but structured to match real shop operations.

---

## Roles and Ownership

### Customer
- Submits service request through customer portal (creates blank Service Log)
- Receives invoices/receipts
- Pays invoices

### Mechanic (Technician)
- Creates Service Logs directly or uploads work documentation
- Documents work in **Service Logs** (journal + performed work + line items)
- Marks Service Logs as **Complete** when work is finished
- Can upload attachments/documents to Service Logs

### Accounting (Office)
- Reviews completed Service Logs
- Generates/finalizes **Invoices** from completed Service Logs
- Sends invoices using Templates + SMTP settings
- Records payments and manages invoice status

### Admin/Manager
- Manages users/roles/permissions
- Manages settings, templates, billing rules

---

## Core Principles

- **Service Log is the primary work container**:
  - Created by mechanics directly OR by customers through portal (blank service log with customer/vehicle info)
  - Service Log is the canonical source of performed work + billable line items
- **Invoice is accounting-owned**:
  - Accounting controls numbering, terms, taxes/fees/discounts, sending, and payment application
  - Invoices are generated from completed Service Logs
- **Service Log can be "history-only"**:
  - No invoice required when the entry is informational or non-billable

---

## Entity Definitions (Operational Meaning)

### Service Log — Mechanic Work Journal + Billable Work Source
What it answers:
- Who is the customer? Which vehicle?
- What did we find? What did we do? What parts/labor were used?
- What internal notes/diagnosis exist?
- What should accounting bill?
- Is the work complete and ready for billing?

Service Log contains:
- customer and vehicle information
- symptoms (customer-reported, can be pre-filled from customer portal request)
- diagnosis (mechanic findings)
- internal notes (not customer-facing)
- work performed narrative
- canonical labor/parts line items
- attachments/documents
- status for mechanic → accounting handoff
- links to Invoice (optional, created after completion)

### Invoice — Billing Artifact
What it answers:
- What are we charging? What is owed? What terms apply?
- Was it sent? Paid? Partially paid? Void?

Invoice contains:
- customer-facing line items (from Service Log)
- taxes/fees/discounts/terms/invoice number
- send history (later)
- payment application (payments are separate records)

### Payment — Money Movement Record
What it answers:
- What amount was received, when, by what method?
- Which invoice balance did it reduce?

---

## Status Models (UI + Workflow)

### Service Log Status (Mechanic → Accounting Lifecycle)
- **Draft**: started, incomplete (can be blank if created from customer portal)
- **In Progress**: actively being updated by mechanic
- **Complete**: work finished, ready for accounting to generate invoice
- **Returned**: accounting requested changes/clarification (can be returned from invoice generation step)
- **Invoiced**: invoice has been generated from this service log

### Invoice Status (Billing Lifecycle)
- **Draft**
- **Sent**
- **Partially Paid**
- **Paid**
- **Void**

---

## Workflow A: Customer Portal Request → Service Log → Complete → Draft Invoice → Send → Payment

### A1. Customer Submits Request (Customer Portal)
Creates:
- Service Log: **Draft** (blank service log with customer/vehicle information pre-filled)

Intake data:
- Customer: name + phone/email (if new customer, creates customer record)
- Vehicle: year/make/model + optional VIN/plate (if new vehicle, creates vehicle record)
- Symptoms/complaint (free text) - pre-fills Service Log symptoms field
- Preferred contact method (optional)

UI surfaces:
- Customer portal login/registration
- Service request form
- Customer can view their service logs and invoices

### A2. Mechanic Works on Service Log
Updates:
- Service Log: Draft → In Progress
- Adds diagnosis, internal notes, work performed
- Adds labor/parts line items
- Uploads attachments if needed

Required sections:
- Symptoms (customer-reported, pre-filled from portal)
- Diagnosis (mechanic findings)
- Internal notes (not customer-facing)
- Work performed summary
- Line items:
  - Labor (description, hours, rate)
  - Parts (part#, description, qty, unit price)
- Mileage at service

UI actions:
- Add/edit/remove line items
- Upload attachments
- Save as Draft/In Progress

### A3. Mechanic Marks Service Log Complete
Transitions:
- Service Log: In Progress → Complete

Locking rule:
- When Complete, mechanic edits are restricted unless accounting returns it.

UI actions:
- Mark Complete (required confirmation)
- Service Log becomes read-only for mechanic

### A4. Accounting Generates Draft Invoice (from Complete Service Log)
Creates:
- Invoice: Draft
- Invoice line items copied from Service Log
- Totals computed (tax/fees applied from Billing Rules)

Accounting edits (allowed):
- invoice number (manual or auto rule)
- terms/due date
- tax/fees/discount adjustments
- customer-facing notes
- template selection for send

Transitions:
- Service Log: Complete → Invoiced

UI actions:
- Generate Draft Invoice from Service Log
- Review invoice preview
- Edit invoice details

### A5. Accounting Finalizes + Sends
Transitions:
- Invoice: Draft → Sent

UI actions:
- Send invoice (Template + SMTP settings)
- Preview email body with invoice data

### A6. Record Payment(s)
Transitions:
- Invoice: Sent → Partially Paid → Paid

UI actions:
- Capture payment (amount, method, reference, date)
- Show payment history and remaining balance

---

## Workflow B: Mechanic Creates Service Log Directly

### B1. Mechanic Creates Service Log
Creates:
- Service Log: Draft/In Progress
- Selects existing customer/vehicle OR creates new

UI actions:
- "New Service Log"
- Customer/Vehicle selector with "Create new" options
- Upload attachments/documents

### B2. Complete → Invoice
Same as A3–A6.

---

## Workflow C: Service Log (History-Only, No Billing)

Use cases:
- inspections
- customer declined work
- warranty/internal/no-charge work
- maintenance notes

Creates:
- Service Log linked to Customer + Vehicle
- No invoice generated (mechanic marks complete but accounting skips invoice generation)

UI actions:
- Create service log (history-only)
- Mark complete (no invoice needed)
- Appears in customer/vehicle timelines

---

## Workflow D: Accounting Returns Service Log (Correction Loop)

### D1. Return for Edits
When:
- unclear descriptions
- missing qty/hours/rate
- mismatch between diagnosis and line items
- pricing/authorization ambiguity
- invoice generation reveals issues

Transitions:
- Service Log: Complete/Invoiced → Returned

UI requirements:
- Return reason comment is required
- Mechanic sees returned queue + badge
- Service Log becomes editable again

### D2. Mechanic Updates and Resubmits
Transitions:
- Service Log: Returned → In Progress → Complete

UI requirements:
- Highlight changed fields since last submit (optional)
- Mark Complete again after corrections

---

## Screen-to-Workflow Mapping (Front-End Build Order)

### Customer Portal
- Login/Registration
- Service Request Form (creates blank Service Log)
- View Service Logs (read-only, customer's own)
- View Invoices (customer's own)
- Payment history

### Service Logs
- Service Log List: status/category/date filters
- Service Log Editor:
  - customer/vehicle selection
  - journal + line items
  - attachment upload
  - complete/returned loop
  - read-only mode when complete (except returned)

### Invoices
- Invoice List: status/customer/date filters
- Invoice Detail/Builder:
  - generated from Complete Service Log
  - finalize totals/terms/number
  - preview + send flow

### Payments
- Capture payment modal
- Invoice payment history + balance

### Settings
- Templates (email/invoice)
- SMTP settings
- Billing rules (tax/fees/numbering/terms)
- Users/Roles
- Open Router API settings

---

## Data Rules (UI Contract)

- Service Log must have:
  - customerId, vehicleId, occurredAt
  - and at least one: symptoms/diagnosis/details OR at least one line item
- Invoice generation requires:
  - Service Log status is Complete
  - at least one line item (or explicit "no-charge" invoice policy later)
- Customer portal requests create:
  - Service Log with status Draft
  - Customer record if new
  - Vehicle record if new
  - Symptoms field pre-filled from request

---

## Edge Cases (Must Be Supported in UI)

- Customer creates service request with incomplete vehicle data → mechanic can complete it
- Mechanic creates service log with new customer/vehicle → UI should warn about potential duplicates (backend will enforce later)
- Invoice voided after sending → Service Log remains Invoiced; no auto-status change
- Returned Service Log while an invoice draft exists → invoice shows "stale" warning and requires re-sync (front-end can show warning badge)
- Multiple invoices from one service log → not supported initially; one service log = one invoice

---

## Acceptance Criteria (Workflow UI Done)

- Every transition has a visible action and results in an unambiguous state
- Lists support loading/empty/error states
- Responsive checks pass at 360/390/768/1024+
- Long strings and large line-item counts do not break layout
- No horizontal scroll; mobile actions usable (stacked buttons or bottom bar)
- Customer portal is accessible and functional
- Service Log attachments upload and display correctly
