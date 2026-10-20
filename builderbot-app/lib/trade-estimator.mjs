// Pure JavaScript trade estimator rules with realistic UK trade rates and itemizations.
// Used as the smart offline/instant engine in app/api/quote/generate/route.ts.

/**
 * Hours the notes actually mention. Half a day is 4 hours. A bare day is 8.
 * @param {string} [notes]
 * @returns {number | null}
 */
export function statedLabourHours(notes = "") {
  const text = String(notes || "").toLowerCase();
  if (/\bhalf\s+(?:a\s+)?day\b/.test(text)) return 4;
  const hours = text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  if (hours) return Math.max(0.5, Math.min(80, Number(hours[1])));
  const days = text.match(/\b(\d+(?:\.\d+)?)\s*days?\b/);
  if (days) return Math.max(0.5, Math.min(80, Number(days[1]) * 8));
  if (/\b(?:a|one)\s+day\b/.test(text)) return 8;
  return null;
}

/**
 * @param {string} [notes]
 * @param {string} [trade]
 * @param {any} [pricingMemory]
 * @param {string[]} [photos]
 */
export function estimateTradeJob(notes = "", trade = "", pricingMemory = null, photos = []) {
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
  } else if (lower.includes("boiler") || lower.includes("combi")) {
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
    lower.includes("consumer unit") ||
    lower.includes("fuse board") ||
    lower.includes("fuseboard") ||
    lower.includes("fuse box") ||
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
    lower.includes("socket") ||
    lower.includes("downlight") ||
    lower.includes("light switch") ||
    lower.includes("electric")
  ) {
    const countMatch = lower.match(
      /(\d+)\s*(?:x\s*)?(?:double\s+|single\s+|twin\s+)?(?:sockets?|downlights?|switches?)/
    );
    const count = countMatch ? Math.max(1, Math.min(100, Number(countMatch[1]))) : 1;
    const sockets = lower.includes("socket");
    title = sockets ? "Socket Replacement" : "Electrical Accessory Works";
    suggestedDepositPercent = 20;
    items.push(
      sockets
        ? {
            type: "material",
            description: "Double switched socket outlets",
            quantity: count,
            unit: "sockets",
            rate: 8.5,
          }
        : {
            type: "material",
            description: "Electrical accessories and back boxes for the fittings described",
            quantity: count,
            unit: "items",
            rate: 12.0,
          },
      {
        type: "labor",
        description: sockets
          ? "Isolate the circuit, replace the sockets, and test them"
          : "Isolate the circuit, fit the accessories described, and test them",
        quantity: Math.max(1, Math.round(count * 0.75 * 10) / 10),
        unit: "hrs",
        rate: 55.0,
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
    /\bdoors?\b/.test(lower) ||
    lower.includes("skirting") ||
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
  } else if (
    lower.includes("tap") ||
    lower.includes("leak") ||
    lower.includes("radiator") ||
    lower.includes("plumb") ||
    lower.includes("cylinder") ||
    lower.includes("heating")
  ) {
    title = "Plumbing Call-Out & Repair";
    suggestedDepositPercent = 0;
    items.push(
      {
        type: "labor",
        description: "Plumber call-out and repair time",
        quantity: 2,
        unit: "hrs",
        rate: 55.0,
      },
      {
        type: "material",
        description: "Small materials allowance (washers, olives, valves) — check on site",
        quantity: 1,
        unit: "allowance",
        rate: 25.0,
      },
      {
        type: "service",
        description: "Local waste and consumables",
        quantity: 1,
        unit: "service",
        rate: 15.0,
      }
    );
  } else if (
    lower.includes("brick") ||
    lower.includes("blockwork") ||
    lower.includes("brickwork") ||
    lower.includes("repoint") ||
    lower.includes("masonry") ||
    lower.includes("mortar") ||
    lower.includes("coping")
  ) {
    title = "Brickwork, Masonry & Wall Construction";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Facing Bricks / Concrete Blocks, Building Sand & Mortar Plasticiser",
        quantity: 1,
        unit: "lot",
        rate: 340.0,
      },
      {
        type: "material",
        description: "Damp Proof Course (DPC) & Stainless Steel Wall Ties",
        quantity: 1,
        unit: "pack",
        rate: 42.0,
      },
      {
        type: "labor",
        description: "Setting out, mortar mixing, precision brick/block laying, and joint tooling",
        quantity: 16,
        unit: "hrs",
        rate: 48.0,
      },
      {
        type: "service",
        description: "Muck-away and site cleanup",
        quantity: 1,
        unit: "service",
        rate: 65.0,
      }
    );
  } else if (
    lower.includes("kitchen") ||
    lower.includes("worktop") ||
    lower.includes("cabinet") ||
    lower.includes("cupboard") ||
    lower.includes("sink unit") ||
    lower.includes("cooker")
  ) {
    title = "Kitchen Fitting & Worktop Installation";
    suggestedDepositPercent = 25;
    items.push(
      {
        type: "material",
        description: "Laminate / Solid Wood Worktops, Colorfill & Heavy Duty Jointing Bolts",
        quantity: 2,
        unit: "lengths",
        rate: 135.0,
      },
      {
        type: "material",
        description: "Cabinet Hanging Brackets, Plinth Clips, Screws & Silicone Sealants",
        quantity: 1,
        unit: "lot",
        rate: 65.0,
      },
      {
        type: "labor",
        description: "Cabinet assembly, level scribing, worktop router mitering, and appliance cutouts",
        quantity: 24,
        unit: "hrs",
        rate: 48.0,
      },
      {
        type: "service",
        description: "Kitchen packaging disposal and safe offcuts clearance",
        quantity: 1,
        unit: "service",
        rate: 80.0,
      }
    );
  } else if (
    lower.includes("patio") ||
    lower.includes("paving") ||
    lower.includes("slab") ||
    lower.includes("sandstone") ||
    lower.includes("driveway") ||
    lower.includes("block paving")
  ) {
    title = "Patio, Paving & Groundworks";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Calibrated Indian Sandstone / Porcelain Outdoor Paving Slabs",
        quantity: 25,
        unit: "m²",
        rate: 32.0,
      },
      {
        type: "material",
        description: "MOT Type 1 Sub-Base Aggregate & Sharp Sand / Cement Mortar Bed",
        quantity: 3,
        unit: "bulk bags",
        rate: 68.0,
      },
      {
        type: "labor",
        description: "Excavation, sub-base compaction, full mortar bed laying, and brush-in resin pointing",
        quantity: 20,
        unit: "hrs",
        rate: 45.0,
      },
      {
        type: "service",
        description: "Excavated spoil clearance and final patio wash down",
        quantity: 1,
        unit: "service",
        rate: 140.0,
      }
    );
  } else if (
    lower.includes("decking") ||
    lower.includes("composite deck") ||
    lower.includes("balustrade")
  ) {
    title = "Decking & Timber Structures";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Heavy Duty Pressure-Treated C16/C24 Subframe Joists & Weed Membrane",
        quantity: 1,
        unit: "lot",
        rate: 220.0,
      },
      {
        type: "material",
        description: "Non-Slip Composite / Grooved Timber Decking Boards & Hidden Fasteners",
        quantity: 20,
        unit: "m²",
        rate: 36.0,
      },
      {
        type: "labor",
        description: "Ground preparation, level post setting, structural framing, and board installation",
        quantity: 16,
        unit: "hrs",
        rate: 46.0,
      },
      {
        type: "service",
        description: "Timber offcuts disposal and site clearance",
        quantity: 1,
        unit: "service",
        rate: 55.0,
      }
    );
  } else if (
    lower.includes("floor") ||
    lower.includes("flooring") ||
    lower.includes("laminate") ||
    lower.includes("lvt") ||
    lower.includes("vinyl")
  ) {
    title = "Flooring Installation & Subfloor Preparation";
    suggestedDepositPercent = 15;
    items.push(
      {
        type: "material",
        description: "High-Durability AC4/AC5 Laminate / LVT Flooring Packs",
        quantity: 30,
        unit: "m²",
        rate: 24.5,
      },
      {
        type: "material",
        description: "Acoustic Gold Underlay with Built-in DPM & Color-Matched Scotia Beading",
        quantity: 1,
        unit: "lot",
        rate: 75.0,
      },
      {
        type: "labor",
        description: "Subfloor check, doorframe undercutting, floor installation, and perimeter beading",
        quantity: 12,
        unit: "hrs",
        rate: 42.0,
      },
      {
        type: "service",
        description: "Offcuts disposal and vacuum clean down",
        quantity: 1,
        unit: "service",
        rate: 40.0,
      }
    );
  } else if (
    lower.includes("turf") ||
    lower.includes("lawn") ||
    lower.includes("grass") ||
    lower.includes("rotovate") ||
    lower.includes("hedge")
  ) {
    title = "Landscaping & Lawn Installation";
    suggestedDepositPercent = 20;
    items.push(
      {
        type: "material",
        description: "Premium Cultivated Weed-Free Lawn Turf Rolls",
        quantity: 50,
        unit: "m²",
        rate: 6.5,
      },
      {
        type: "material",
        description: "Screened Topsoil & Pre-Turf Root Fertilizer",
        quantity: 2,
        unit: "bulk bags",
        rate: 72.0,
      },
      {
        type: "labor",
        description: "Rotovating, stone removal, rake leveling, consolidation, and turf rolling",
        quantity: 14,
        unit: "hrs",
        rate: 42.0,
      },
      {
        type: "service",
        description: "Green waste removal and initial deep watering",
        quantity: 1,
        unit: "service",
        rate: 60.0,
      }
    );
  } else if (
    lower.includes("gutter") ||
    lower.includes("downpipe") ||
    lower.includes("fascia") ||
    lower.includes("soffit")
  ) {
    title = "Guttering, Roofline & Drainage Works";
    suggestedDepositPercent = 15;
    items.push(
      {
        type: "material",
        description: "Heavy Duty Half-Round uPVC Guttering, Fascia Brackets & Downpipe Connectors",
        quantity: 1,
        unit: "lot",
        rate: 110.0,
      },
      {
        type: "labor",
        description: "Removal of defective sections, correct fall alignment, and secure bracket fitting",
        quantity: 6,
        unit: "hrs",
        rate: 48.0,
      },
      {
        type: "service",
        description: "Flow test, debris removal, and old plastic recycling",
        quantity: 1,
        unit: "service",
        rate: 35.0,
      }
    );
  } else if (
    lower.includes("window") ||
    lower.includes("glazing") ||
    lower.includes("upvc") ||
    lower.includes("double glazed")
  ) {
    title = "Window & Door Glazing Installation";
    suggestedDepositPercent = 25;
    items.push(
      {
        type: "material",
        description: "A-Rated Energy Efficient Double Glazed uPVC Windows / Sills",
        quantity: 2,
        unit: "units",
        rate: 380.0,
      },
      {
        type: "material",
        description: "Fixing Straps, Low-Expansion Foam, Packers & Low-Modulus Neutral Silicone",
        quantity: 1,
        unit: "pack",
        rate: 45.0,
      },
      {
        type: "labor",
        description: "Careful removal of existing frames, new window squaring, fixing, and silicone sealing",
        quantity: 8,
        unit: "hrs",
        rate: 52.0,
      },
      {
        type: "service",
        description: "Old window frame and glass recycling disposal",
        quantity: 1,
        unit: "service",
        rate: 60.0,
      }
    );
  } else if (
    lower.includes("demolish") ||
    lower.includes("knock down") ||
    lower.includes("strip out") ||
    lower.includes("clearance") ||
    lower.includes("waste")
  ) {
    title = "Demolition, Strip-Out & Site Clearance";
    suggestedDepositPercent = 15;
    items.push(
      {
        type: "service",
        description: "8-Yard Builders Skip Hire & Council Highway Road Permit",
        quantity: 1,
        unit: "skip",
        rate: 320.0,
      },
      {
        type: "material",
        description: "Heavy Duty Rubble Sacks, Dust Proof Sheeting & Temporary Floor Protection",
        quantity: 1,
        unit: "pack",
        rate: 45.0,
      },
      {
        type: "labor",
        description: "Controlled strip out, non-structural takedown, rubble bagging, and skip loading",
        quantity: 12,
        unit: "hrs",
        rate: 44.0,
      },
      {
        type: "service",
        description: "Dust extraction, magnetic nail sweep, and site clearance",
        quantity: 1,
        unit: "service",
        rate: 50.0,
      }
    );
  } else {
    title = "Specified Trade Works & Labour";
    suggestedDepositPercent = 20;
    const promptSnippet = notes.trim().slice(0, 48);
    items.push(
      {
        type: "material",
        description: `Trade materials, fixings & sundries for: ${promptSnippet}${notes.trim().length > 48 ? "..." : ""}`,
        quantity: 1,
        unit: "lot",
        rate: 185.0,
      },
      {
        type: "labor",
        description: "Skilled trade execution, surface preparation, installation, and inspection",
        quantity: 8,
        unit: "hrs",
        rate: 45.0,
      },
      {
        type: "service",
        description: "Site protection, safety cleanup, and licensed trade waste disposal",
        quantity: 1,
        unit: "service",
        rate: 45.0,
      }
    );
  }

  const statedHours = statedLabourHours(notes);
  if (statedHours != null) {
    for (const it of items) {
      if (it.type === "labor") {
        it.quantity = statedHours;
        it.unit = "hrs";
      }
    }
  }

  // Calibrate with personal pricing memory DNA if provided
  if (pricingMemory && typeof pricingMemory === "object") {
    for (const it of items) {
      if (it.type === "labor") {
        if (pricingMemory.laborHourlyRate && (it.unit === "hrs" || it.unit === "hr")) {
          it.rate = Number(pricingMemory.laborHourlyRate);
        } else if (pricingMemory.laborDayRate && (it.unit === "days" || it.unit === "day")) {
          it.rate = Number(pricingMemory.laborDayRate);
        }
      }
    }
  }

  const photoNote = Array.isArray(photos) && photos.length > 0
    ? ` ${photos.length} site inspection photo(s) saved with this quote. Please check them.`
    : "";
  const tradeNote = String(trade || "").trim() ? ` Trade: ${String(trade).trim()}.` : "";
  const roughPrefix =
    title === "Specified Trade Works & Labour" || title === "Plumbing Call-Out & Repair"
      ? "ROUGH ESTIMATE — edit every price before sending. "
      : "";

  return {
    title,
    scopeOfWork: `${roughPrefix}Scope of works: ${notes.trim()}.${tradeNote}${photoNote} Check materials, hours, and rates before sending this to a customer.`,
    suggestedDepositPercent,
    items,
  };
}
