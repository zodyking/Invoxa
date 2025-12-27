// Auto-categorization utility for Parts and Services
// Maps keywords to category names for default categories

interface CategoryKeywords {
  [categoryName: string]: string[]
}

// Part category keywords
export const partCategoryKeywords: CategoryKeywords = {
  "Engine": [
    "engine", "motor", "piston", "cylinder", "crankshaft", "camshaft", "valve", "head gasket",
    "timing belt", "timing chain", "oil pump", "water pump", "gasket", "seal"
  ],
  "Cooling System": [
    "radiator", "coolant", "thermostat", "hose", "cooling", "overheat", "temperature",
    "heater core", "cooling fan", "water pump", "antifreeze"
  ],
  "Fuel System": [
    "fuel", "gas", "tank", "pump", "filter", "injector", "carburetor", "fuel line",
    "pressure regulator", "fuel rail", "gas cap"
  ],
  "Ignition & Electrical": [
    "spark plug", "ignition", "coil", "wire", "distributor", "battery", "alternator",
    "starter", "fuse", "relay", "switch", "sensor", "harness", "wiring"
  ],
  "Charging & Starting": [
    "alternator", "starter", "battery", "charging", "cable", "terminal", "solenoid"
  ],
  "Belts & Hoses": [
    "belt", "serpentine", "timing belt", "hose", "radiator hose", "heater hose",
    "vacuum hose", "drive belt"
  ],
  "Exhaust & Emissions": [
    "exhaust", "muffler", "catalytic converter", "pipe", "emission", "oxygen sensor",
    "o2 sensor", "egr", "smog", "tailpipe"
  ],
  "Transmission & Drivetrain": [
    "transmission", "clutch", "flywheel", "drive shaft", "axle", "differential",
    "transfer case", "cv joint", "u-joint", "gearbox", "torque converter"
  ],
  "Suspension & Steering": [
    "shock", "strut", "spring", "control arm", "ball joint", "tie rod", "steering",
    "rack", "pinion", "bushing", "stabilizer", "sway bar", "alignment"
  ],
  "Brakes": [
    "brake", "pad", "rotor", "disc", "drum", "caliper", "line", "fluid", "master cylinder",
    "wheel cylinder", "abs", "sensor"
  ],
  "Tires & Wheels": [
    "tire", "wheel", "rim", "lug nut", "valve stem", "tpms", "pressure sensor",
    "balance", "rotation"
  ],
  "HVAC (A/C & Heat)": [
    "ac", "air conditioning", "heater", "compressor", "condenser", "evaporator",
    "blower", "vent", "climate control", "refrigerant", "freon"
  ],
  "Body & Exterior": [
    "door", "hood", "trunk", "bumper", "fender", "mirror", "window", "glass",
    "molding", "trim", "panel", "grille"
  ],
  "Interior & Trim": [
    "seat", "carpet", "dashboard", "console", "headliner", "visor", "handle",
    "knob", "switch", "panel", "trim"
  ],
  "Lighting": [
    "light", "bulb", "headlight", "taillight", "turn signal", "fog light",
    "led", "halogen", "hazard", "brake light"
  ],
  "Filters (Oil/Air/Cabin/Fuel)": [
    "filter", "oil filter", "air filter", "cabin filter", "fuel filter",
    "pollen filter", "intake filter"
  ],
  "Fluids (Oil/Coolant/Brake/Trans/PS)": [
    "oil", "coolant", "brake fluid", "transmission fluid", "power steering",
    "antifreeze", "washer fluid", "lubricant", "grease"
  ],
  "Wiper & Washer": [
    "wiper", "blade", "washer", "nozzle", "pump", "fluid", "arm"
  ],
  "Batteries": [
    "battery", "cell", "terminal", "cable", "charger"
  ],
  "Diagnostics & Sensors": [
    "sensor", "diagnostic", "code", "scanner", "o2", "oxygen", "map", "maf",
    "throttle position", "crank position", "cam position", "knock", "temperature sensor"
  ],
  "Hardware & Fasteners (Bolts/Clips/Gaskets/O-rings)": [
    "bolt", "nut", "screw", "clip", "gasket", "o-ring", "washer", "pin",
    "rivet", "fastener", "hardware"
  ],
  "Chemicals & Cleaners (Brake clean, degreaser, sealants)": [
    "cleaner", "degreaser", "brake clean", "sealant", "adhesive", "lubricant",
    "penetrant", "chemical"
  ],
  "Hybrid/EV Components": [
    "hybrid", "electric", "ev", "battery pack", "inverter", "charger",
    "motor controller", "regenerative"
  ],
  "Towing/Accessories": [
    "tow", "hitch", "trailer", "accessory", "rack", "carrier", "mount"
  ],
}

// Service category keywords (same as parts)
export const serviceCategoryKeywords: CategoryKeywords = partCategoryKeywords

/**
 * Analyzes description text and returns the best matching category ID
 * @param description - The description text to analyze
 * @param categories - Array of available categories with id and name
 * @param keywordMap - Map of category names to keywords
 * @returns Category ID or null if no match found
 */
export function autoCategorize(
  description: string,
  categories: Array<{ id: string; name: string }>,
  keywordMap: CategoryKeywords
): string | null {
  if (!description || !description.trim()) {
    return null
  }

  const descriptionLower = description.toLowerCase()
  const categoryScores: { [categoryId: string]: number } = {}

  // Score each category based on keyword matches
  for (const category of categories) {
    const keywords = keywordMap[category.name] || []
    let score = 0

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      // Exact word match (higher score)
      const wordRegex = new RegExp(`\\b${keywordLower}\\b`, 'gi')
      const exactMatches = (descriptionLower.match(wordRegex) || []).length
      score += exactMatches * 2

      // Partial match (lower score)
      if (descriptionLower.includes(keywordLower)) {
        score += 1
      }
    }

    if (score > 0) {
      categoryScores[category.id] = score
    }
  }

  // Return the category with the highest score
  if (Object.keys(categoryScores).length === 0) {
    return null
  }

  const bestMatch = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]
  return bestMatch[0]
}







