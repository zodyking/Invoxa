// Shared demo data for email and invoice templates
// Uses current date and current user, mock data for everything else

export interface DemoData {
  customer: {
    id: string
    type: string
    firstName: string
    lastName: string
    name: string
    companyName: string
    contactFirstName: string
    contactLastName: string
    phone: string
    fax: string
    email: string
    streetAddress: string
    city: string
    state: string
    zip: string
    address: string
    taxExempt: string
    status: string
    tags: string
  }
  vehicle: {
    id: string
    type: string
    isFleetVehicle: string
    vehicleTag: string
    year: string
    make: string
    model: string
    trim: string
    vin: string
    licensePlate: string
    engine: string
    displacement: string
    brakeSystemType: string
    fuelTypePrimary: string
    fullDescription: string
  }
  serviceLog: {
    id: string
    title: string
    category: string
    status: string
    symptoms: string
    diagnosis: string
    details: string
    internalNotes: string
    mileage: string
    occurredAt: string
    submittedAt: string
    returnedAt: string
    returnReason: string
    createdBy: string
    createdAt: string
  }
  invoice: {
    id: string
    number: string
    status: string
    subtotal: string
    tax: string
    fees: string
    discount: string
    total: string
    dueDate: string
    terms: string
    notes: string
    sentAt: string
    createdAt: string
    createdBy: string
  }
  payment: {
    id: string
    amount: string
    method: string
    reference: string
    notes: string
    receivedAt: string
    processedBy: string
    createdAt: string
  }
  shop: {
    name: string
    streetAddress: string
    city: string
    state: string
    zip: string
    address: string
    phone: string
    fax: string
    email: string
    website: string
    taxId: string
  }
  user: {
    firstName: string
    lastName: string
    name: string
    email: string
    status: string
  }
  date: {
    today: string
    now: string
    year: string
    month: string
    day: string
  }
}

export function generateDemoData(currentUser?: { firstName?: string; lastName?: string; email?: string; name?: string }): DemoData {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 15) // 15 days from today

  const userFirstName = currentUser?.firstName || "John"
  const userLastName = currentUser?.lastName || "Doe"
  const userName = currentUser?.name || `${userFirstName} ${userLastName}`
  const userEmail = currentUser?.email || "user@invoxa.com"

  return {
    customer: {
      id: "cust_123",
      type: "person",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      companyName: "",
      contactFirstName: "",
      contactLastName: "",
      phone: "(555) 123-4567",
      fax: "(555) 123-4568",
      email: "john.doe@example.com",
      streetAddress: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      address: "123 Main Street, Springfield, IL 62701",
      taxExempt: "false",
      status: "active",
      tags: "VIP, Regular",
    },
    vehicle: {
      id: "veh_456",
      type: "car",
      isFleetVehicle: "false",
      vehicleTag: "",
      year: "2020",
      make: "Toyota",
      model: "Camry",
      trim: "LE",
      vin: "1HGBH41JXMN109186",
      licensePlate: "ABC-1234",
      engine: "2.5L I4",
      displacement: "2.50",
      brakeSystemType: "Hydraulic",
      fuelTypePrimary: "Gasoline",
      fullDescription: "2020 Toyota Camry LE",
    },
    serviceLog: {
      id: "sl_321",
      title: "Oil Change Service",
      category: "Maintenance",
      status: "approved",
      symptoms: "Regular maintenance",
      diagnosis: "No issues found",
      details: "Changed engine oil and filter",
      internalNotes: "Customer requested premium oil",
      mileage: "45,000",
      occurredAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      submittedAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      returnedAt: "",
      returnReason: "",
      createdBy: userName,
      createdAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    },
    invoice: {
      id: "inv_654",
      number: `INV-${now.getFullYear()}-001`,
      status: "sent",
      subtotal: "$1,000.00",
      tax: "$80.00",
      fees: "$25.00",
      discount: "$0.00",
      total: "$1,105.00",
      dueDate: dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      terms: "Net 15",
      notes: "Thank you for your business",
      sentAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      createdAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      createdBy: userName,
    },
    payment: {
      id: "pay_987",
      amount: "$1,105.00",
      method: "credit_card",
      reference: "TXN-123456789",
      notes: "Payment received via card",
      receivedAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      processedBy: userName,
      createdAt: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    },
    shop: {
      name: "Invoxa Auto Repair",
      streetAddress: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      address: "123 Main Street, Springfield, IL 62701",
      phone: "(555) 987-6543",
      fax: "(555) 987-6544",
      email: "info@invoxa.com",
      website: "https://invoxa.com",
      taxId: "12-3456789",
    },
    user: {
      firstName: userFirstName,
      lastName: userLastName,
      name: userName,
      email: userEmail,
      status: "active",
    },
    date: {
      today: today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      now: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString(),
      day: now.getDate().toString(),
    },
  }
}

export function getVariableValue(demoData: DemoData, variable: string): string {
  // Remove {{ and }} from variable
  const cleanVar = variable.replace(/[{}]/g, "")
  const parts = cleanVar.split(".")
  
  if (parts.length < 2) return variable
  
  const [entity, ...fieldParts] = parts
  const field = fieldParts.join(".")
  
  const entityData = demoData[entity as keyof DemoData] as any
  if (!entityData) return variable
  
  return entityData[field] || variable
}

export function replaceVariables(html: string, demoData: DemoData): string {
  let result = html
  const variableRegex = /\{\{[\w.]+}\}/g
  const matches = html.match(variableRegex) || []
  
  matches.forEach((variable) => {
    const value = getVariableValue(demoData, variable)
    result = result.replace(new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"), value)
  })
  
  return result
}


