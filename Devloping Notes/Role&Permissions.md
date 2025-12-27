# Roles & Permissions Guide

This document outlines the role-based access control (RBAC) system for Invoxa, including each role type and their associated permissions.

---

## Role Overview

Invoxa uses a role-based permission system where users are assigned one or more roles, and each role has specific permissions that define what actions users can perform in the system.

---

## Role Types

### 1. Admin
**Description:** Full system access with no restrictions.

**Permissions:**
- ✅ **All Permissions** - Complete access to all system features
- Can manage users, roles, and permissions
- Can access all customer, vehicle, repair order, service log, invoice, and payment data
- Can modify system settings, templates, and billing rules
- Can perform any action in the system

**Use Cases:**
- System administrators
- Shop owners
- IT managers

**Typical Responsibilities:**
- User management
- System configuration
- Troubleshooting
- Data oversight

---

### 2. Manager
**Description:** Can manage all operations but may have restrictions on system-level settings.

**Permissions:**
- ✅ **Operational Management** - Full access to day-to-day operations
- Can view and manage customers, vehicles, repair orders, service logs
- Can create and manage invoices and payments
- Can view reports and analytics
- Limited or no access to user management and system settings (depending on configuration)

**Use Cases:**
- Shop managers
- Operations managers
- Department heads

**Typical Responsibilities:**
- Oversee daily operations
- Manage staff assignments
- Review and approve work
- Handle customer escalations
- Monitor business metrics

---

### 3. Accountant
**Description:** Specialized role for managing invoices, payments, and financial operations.

**Permissions:**
- ✅ **Invoice Management**
  - Create, read, update invoices
  - Send invoices to customers
- ✅ **Payment Processing**
  - Create and record payments
  - View payment history
- ✅ **Financial Data Access**
  - View invoices and payments
  - Access customer billing information
- ✅ **Service Log Review**
  - Read service logs (to generate invoices)
- ❌ **Limited Operational Access**
  - Typically read-only for repair orders and vehicles
  - Cannot modify service logs or repair orders

**Use Cases:**
- Accountant staff
- Bookkeepers
- Financial administrators

**Typical Responsibilities:**
- Generate invoices from service logs
- Process customer payments
- Manage accounts receivable
- Send invoices and receipts
- Track payment status
- Financial reporting

---

### 4. Mechanic
**Description:** Can create and manage service logs and repair orders for assigned work.

**Permissions:**
- ✅ **Service Logs**
  - Create service logs
  - Read service logs
  - Update service logs (until submitted to accounting)
- ✅ **Repair Orders**
  - Create repair orders
  - Read repair orders
  - Update repair orders (assigned to them)
- ✅ **Vehicle Information**
  - Read vehicle information
  - Update vehicle mileage
- ✅ **Customer Information**
  - Read customer information
- ❌ **No Invoice/Payment Access**
  - Cannot create or modify invoices
  - Cannot process payments
- ❌ **No Settings Access**
  - Cannot modify system settings

**Use Cases:**
- Technicians
- Mechanics
- Service technicians

**Typical Responsibilities:**
- Document work performed
- Create service logs with line items
- Update repair order status
- Record vehicle symptoms and diagnosis
- Submit completed work to accounting

---

### 5. Customer Service
**Description:** Read-only access with ability to update customer information for support purposes.

**Permissions:**
- ✅ **Customer Management**
  - Read customer information
  - Update customer information (contact details, address, etc.)
- ✅ **Read-Only Access**
  - Read vehicles
  - Read repair orders
  - Read service logs
  - Read invoices
  - Read payments
- ❌ **No Creation/Modification**
  - Cannot create new customers, vehicles, repair orders, or service logs
  - Cannot modify invoices or payments
  - Cannot modify repair orders or service logs
  - Cannot access system settings

**Use Cases:**
- Customer service representatives
- Front desk staff
- Receptionists
- Support staff

**Typical Responsibilities:**
- Answer customer inquiries
- Update customer contact information
- View customer history and invoices
- Provide status updates on repair orders
- Assist with scheduling
- Handle basic customer service tasks

---

## Permission Details

### Customer Permissions
- **customers.create** - Create new customer records
- **customers.read** - View customer information
- **customers.update** - Modify customer information
- **customers.delete** - Remove customer records

### Vehicle Permissions
- **vehicles.create** - Add new vehicles to the system
- **vehicles.read** - View vehicle information
- **vehicles.update** - Modify vehicle details
- **vehicles.delete** - Remove vehicle records

### Repair Order Permissions
- **repair-orders.create** - Create new repair orders
- **repair-orders.read** - View repair order details
- **repair-orders.update** - Modify repair orders

### Service Log Permissions
- **service-logs.create** - Create new service log entries
- **service-logs.read** - View service log information
- **service-logs.update** - Modify service logs

### Invoice Permissions
- **invoices.create** - Generate new invoices
- **invoices.read** - View invoice details
- **invoices.update** - Modify invoice information
- **invoices.send** - Send invoices to customers

### Payment Permissions
- **payments.create** - Record new payments
- **payments.read** - View payment history

### System Permissions
- **settings.manage** - Modify system settings, templates, and billing rules
- **users.manage** - Manage users, roles, and permissions

---

## Permission Matrix

| Permission | Admin | Manager | Accountant | Mechanic | Customer Service |
|------------|-------|---------|------------|----------|------------------|
| customers.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| customers.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| customers.update | ✅ | ✅ | ❌ | ❌ | ✅ |
| customers.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| vehicles.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| vehicles.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicles.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| vehicles.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| repair-orders.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| repair-orders.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| repair-orders.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| service-logs.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| service-logs.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| service-logs.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| invoices.create | ✅ | ✅ | ✅ | ❌ | ❌ |
| invoices.read | ✅ | ✅ | ✅ | ❌ | ✅ |
| invoices.update | ✅ | ✅ | ✅ | ❌ | ❌ |
| invoices.send | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.create | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.read | ✅ | ✅ | ✅ | ❌ | ✅ |
| settings.manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| users.manage | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Workflow Integration

### Typical Workflow by Role

1. **Customer Service** → Updates customer information, views history
2. **Mechanic** → Creates service log, documents work performed
3. **Accountant** → Generates invoice from service log, sends to customer
4. **Customer Service** → Views invoice status, answers customer questions
5. **Accountant** → Records payment when received
6. **Manager** → Reviews operations, assigns work, monitors performance
7. **Admin** → Manages users, configures system, handles escalations

---

## Best Practices

1. **Principle of Least Privilege** - Assign only the minimum permissions necessary for a user's role
2. **Role Assignment** - Users can have multiple roles if needed (e.g., Manager + Accountant)
3. **Regular Audits** - Periodically review role assignments and permissions
4. **Documentation** - Keep this document updated as permissions evolve
5. **Training** - Ensure users understand their role's capabilities and limitations

---

## Notes

- Permissions are additive when a user has multiple roles
- Some permissions may have additional business logic restrictions (e.g., mechanics can only update their own service logs)
- System-level permissions (settings.manage, users.manage) are typically restricted to Admin role only
- Customer Service role is designed for front-facing staff who need to help customers but shouldn't modify operational data

---

*Last Updated: December 2024*

