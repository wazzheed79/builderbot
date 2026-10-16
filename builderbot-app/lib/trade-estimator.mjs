// Pure JavaScript trade estimator rules with realistic UK trade rates and itemizations.
// Used as the smart offline/instant engine in app/api/quote/generate/route.ts.

export function estimateTradeJob(notes = "") {
  const lower = notes.toLowerCase();
  const items = [];
  let title = "Trade Works Specification";
  let suggestedDepositPercent = 20;

  if (lower.includes("fence") || lower.includes("panel") || lower.includes("post") || lower.includes("gravel board")) {
    title = "Timber Fencing & Post Installation";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Heavy Duty Pressure-Treated 6ft x 5ft Featheredge Panels",
        quantity: 6,
        unit: "panels",
        rate: 38.5,
      },
      {
        type: "material",
        description: "Slotted Concrete Posts & Postcrete Rapid-Setting Concrete",
        quantity: 7,
        unit: "sets",
        rate: 26.0,
      },
      {
        type: "material",
        description: "Concrete Gravel Boards (6ft x 6inch / 12inch)",
        quantity: 6,
        unit: "boards",
        rate: 18.0,
      },
      {
        type: "labor",
        description: "Post hole excavation, concrete setting, and panel assembly",
        quantity: 14,
        unit: "hrs",
        rate: 45.0,
      },
      {
        type: "service",
        description: "Dismantle and licensed disposal of old damaged fencing",
        quantity: 1,
        unit: "service",
        rate: 120.0,
      }
    );
  } else if (
    lower.includes("boiler") ||
    lower.includes("radiator") ||
    lower.includes("heating") ||
    lower.includes("plumb") ||
    lower.includes("cylinder")
  ) {
    title = "Heating & Plumbing Installation";
    suggestedDepositPercent = 25;
    items.push(
      {
        type: "material",
        description: "High-Efficiency Condensing Combi Boiler & Horizontal Flue Kit",
        quantity: 1,
        unit: "unit",
        rate: 1050.0,
      },
      {
        type: "material",
        description: "System Magnetic Central Heating Filter & Chemical Water Inhibitor",
        quantity: 1,
        unit: "pack",
        rate: 145.0,
      },
      {
        type: "labor",
        description: "Drain down, pipework rerouting, boiler installation and system commission",
        quantity: 12,
        unit: "hrs",
        rate: 60.0,
      },
      {
        type: "service",
        description: "Full chemical powerflush and old appliance eco-disposal",
        quantity: 1,
        unit: "service",
        rate: 180.0,
      }
    );
  } else if (
    lower.includes("fuse") ||
    lower.includes("electric") ||
    lower.includes("socket") ||
    lower.includes("downlight") ||
    lower.includes("consumer unit") ||
    lower.includes("rewire")
  ) {
    title = "Electrical Installation & Upgrades";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Dual RCD / RCBO Metal Consumer Unit with SPD Surge Protection",
        quantity: 1,
        unit: "unit",
        rate: 220.0,
      },
      {
        type: "material",
        description: "Twin & Earth Cable (2.5mm² ring / 1.5mm² lighting) & Backboxes",
        quantity: 1,
        unit: "lot",
        rate: 135.0,
      },
      {
        type: "labor",
        description: "First & second fix wiring, containment, and accessory connections",
        quantity: 8,
        unit: "hrs",
        rate: 55.0,
      },
      {
        type: "service",
        description: "Full electrical circuit testing, inspection, and certification",
        quantity: 1,
        unit: "service",
        rate: 120.0,
      }
    );
  } else if (
    lower.includes("roof") ||
    lower.includes("slate") ||
    lower.includes("roof tile") ||
    lower.includes("ridge") ||
    lower.includes("gutter") ||
    lower.includes("leadwork")
  ) {
    title = "Roofing Repair & Weatherproofing";
    suggestedDepositPercent = 25;
    items.push(
      {
        type: "material",
        description: "Replacement Roof Slates / Interlocking Tiles & Copper Nails",
        quantity: 1,
        unit: "lot",
        rate: 280.0,
      },
      {
        type: "material",
        description: "Breathable Membrane Underlay & Code 4 Milled Lead Flashing",
        quantity: 1,
        unit: "roll/lot",
        rate: 165.0,
      },
      {
        type: "labor",
        description: "Roof stripping, battens inspection, replacement slate fixing, and mortar pointing",
        quantity: 10,
        unit: "hrs",
        rate: 52.0,
      },
      {
        type: "service",
        description: "Safe scaffold/tower access and damaged roof waste disposal",
        quantity: 1,
        unit: "service",
        rate: 150.0,
      }
    );
  } else if (
    lower.includes("plaster") ||
    lower.includes("skim") ||
    lower.includes("render") ||
    lower.includes("stud")
  ) {
    title = "Internal Plastering & Skimming";
    suggestedDepositPercent = 15;
    items.push(
      {
        type: "material",
        description: "Thistle Multi-Finish Plaster Bags (25kg)",
        quantity: 8,
        unit: "bags",
        rate: 12.5,
      },
      {
        type: "material",
        description: "PVA Bonding Agent, Scrim Tape, and Angle Beads",
        quantity: 1,
        unit: "lot",
        rate: 45.0,
      },
      {
        type: "labor",
        description: "Surface preparation, PVA bonding, and two-coat finish skimming to flat surface",
        quantity: 16,
        unit: "hrs",
        rate: 45.0,
      },
      {
        type: "service",
        description: "Floor protection, plastic sheeting, and site cleanup",
        quantity: 1,
        unit: "service",
        rate: 60.0,
      }
    );
  } else if (
    lower.includes("paint") ||
    lower.includes("decorat") ||
    lower.includes("gloss") ||
    lower.includes("wallpaper")
  ) {
    title = "Painting & Decorating Works";
    suggestedDepositPercent = 15;
    items.push(
      {
        type: "material",
        description: "Trade Vinyl Matt Emulsion (Walls & Ceilings) - 10L",
        quantity: 2,
        unit: "tubs",
        rate: 42.0,
      },
      {
        type: "material",
        description: "Durable Undercoat & Satinwood Gloss (Woodwork & Skirtings)",
        quantity: 1,
        unit: "can",
        rate: 34.0,
      },
      {
        type: "material",
        description: "Flexible Decorators Caulk, Fine Surface Filler, and Sanding Abrasives",
        quantity: 1,
        unit: "pack",
        rate: 28.0,
      },
      {
        type: "labor",
        description: "Sanding, filling blemishes, masking, 2 coats emulsion, and gloss application",
        quantity: 14,
        unit: "hrs",
        rate: 38.0,
      }
    );
  } else if (
    lower.includes("door") ||
    lower.includes("skirting") ||
    lower.includes("decking") ||
    lower.includes("carpenter") ||
    lower.includes("joinery")
  ) {
    title = "Carpentry & Joinery Installation";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Internal Oak Veneer / Pre-primed Doors & Hinges/Handle Packs",
        quantity: 4,
        unit: "sets",
        rate: 115.0,
      },
      {
        type: "material",
        description: "Primed Torus/Ogee MDF Skirting Boards & Fixings",
        quantity: 8,
        unit: "lengths",
        rate: 16.5,
      },
      {
        type: "labor",
        description: "Precision door hanging, latch fitting, mitering skirting, and fixing",
        quantity: 10,
        unit: "hrs",
        rate: 48.0,
      },
      {
        type: "service",
        description: "Offcuts removal and site vacuum clean down",
        quantity: 1,
        unit: "service",
        rate: 50.0,
      }
    );
  } else if (
    lower.includes("bathroom") ||
    lower.includes("shower") ||
    lower.includes("tile") ||
    lower.includes("tiling")
  ) {
    title = "Bathroom Fitting & Wall Tiling";
    suggestedDepositPercent = 25;
    items.push(
      {
        type: "material",
        description: "Porcelain / Ceramic Wall & Floor Tiles",
        quantity: 18,
        unit: "m²",
        rate: 28.0,
      },
      {
        type: "material",
        description: "Waterproof Tanking Membrane Kit, Flexible Rapid Adhesive & Antibacterial Grout",
        quantity: 1,
        unit: "lot",
        rate: 140.0,
      },
      {
        type: "labor",
        description: "Wall preparation, tanking application, tile setting, grouting, and sanitary silicone seal",
        quantity: 20,
        unit: "hrs",
        rate: 46.0,
      },
      {
        type: "service",
        description: "Packaging disposal and final acid-free tile buffing",
        quantity: 1,
        unit: "service",
        rate: 70.0,
      }
    );
  } else {
    // General Building & Renovation default
    title = "Specified Trade Works & Labor";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: `Primary trade materials & fixings for: ${notes.slice(0, 45)}...`,
        quantity: 1,
        unit: "lot",
        rate: 340.0,
      },
      {
        type: "labor",
        description: "Skilled trade execution, surface preparation, and structural assembly",
        quantity: 12,
        unit: "hrs",
        rate: 48.0,
      },
      {
        type: "service",
        description: "Full site cleanup and licensed trade waste disposal",
        quantity: 1,
        unit: "service",
        rate: 90.0,
      }
    );
  }

  return {
    title,
    scopeOfWork: `Scope of works: ${notes.trim()}. Includes supply of quality trade materials, professional installation by experienced tradespeople, and complete site clearance upon completion.`,
    suggestedDepositPercent,
    items,
  };
}
