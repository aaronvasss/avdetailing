// Service checklist definitions by package name
export const SERVICE_CHECKLISTS: Record<string, string[]> = {
  "Exterior Only": [
    "Hand wash & dry completed",
    "Wheels & tires cleaned",
    "Tire shine applied",
    "Exterior windows cleaned",
    "Spray wax applied",
  ],
  "Basic Package": [
    "Light vacuum completed",
    "Hand wash & dry completed",
    "Windows cleaned",
    "Dashboard wiped",
  ],
  "Silver Package": [
    "Full interior vacuum",
    "Dashboard & console cleaned",
    "Door panels wiped",
    "Interior windows cleaned",
    "Exterior hand wash & dry",
    "Wheels & tires cleaned",
    "Tire shine applied",
  ],
  "Gold Package": [
    "Everything in Silver completed",
    "Shampoo carpets & seats",
    "Paint sealant applied",
    "Engine bay wiped",
    "Full exterior detail",
  ],
};

export const ADD_ON_CHECKLISTS: Record<string, string> = {
  "Engine Bay Cleaning": "Engine Bay Cleaning completed",
  "Headlight Restoration": "Headlight Restoration completed",
  "Odor Elimination": "Odor Elimination treatment applied",
  "Pet Hair Removal": "Pet Hair Removal completed",
  "Clay Bar Treatment": "Clay Bar Treatment completed",
};

export function getChecklistItems(
  serviceName: string,
  addOns: string[] = []
): string[] {
  // Find matching package
  const items: string[] = [];
  
  for (const [key, checklist] of Object.entries(SERVICE_CHECKLISTS)) {
    if (serviceName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(serviceName.toLowerCase())) {
      items.push(...checklist);
      break;
    }
  }

  // If no match found, use a generic checklist
  if (items.length === 0) {
    items.push("Service completed as specified");
  }

  // Add add-on checklist items
  for (const addOn of addOns) {
    for (const [key, item] of Object.entries(ADD_ON_CHECKLISTS)) {
      if (addOn.toLowerCase().includes(key.toLowerCase())) {
        items.push(item);
        break;
      }
    }
  }

  return items;
}
