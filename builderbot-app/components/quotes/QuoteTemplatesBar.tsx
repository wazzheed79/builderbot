"use client";

import { Sparkles } from "lucide-react";
import { LineItem } from "@/lib/storage";

export interface QuoteTemplate {
  name: string;
  category: string;
  title: string;
  notes: string;
  items: LineItem[];
}

export const DEFAULT_QUOTE_TEMPLATES: QuoteTemplate[] = [
  {
    name: "Bathroom Installation",
    category: "Plumbing",
    title: "En-suite Bathroom Renovation",
    notes:
      "Strip existing bathroom suite. Supply and fit thermostatic bar shower, 1200x500mm heated towel rail, low-profile resin tray, and modern vanity basin. Full pipework rerouting and pressure test.",
    items: [
      {
        id: "t1-1",
        type: "material",
        description: "Thermostatic Bar Shower Kit & Riser Rail",
        quantity: 1,
        unit: "unit",
        rate: 245.0,
      },
      {
        id: "t1-2",
        type: "material",
        description: "Chrome Heated Towel Rail (1200x500mm) + Valves",
        quantity: 1,
        unit: "unit",
        rate: 165.0,
      },
      {
        id: "t1-3",
        type: "material",
        description: "Low Profile Stone Resin Shower Tray (1200x800mm)",
        quantity: 1,
        unit: "unit",
        rate: 195.0,
      },
      {
        id: "t1-4",
        type: "labor",
        description: "Plumbing installation, sanitaryware fitment & pressure testing",
        quantity: 16,
        unit: "hrs",
        rate: 55.0,
      },
      {
        id: "t1-5",
        type: "service",
        description: "Rip-out, tile removal & licensed trade waste disposal",
        quantity: 1,
        unit: "job",
        rate: 180.0,
      },
    ],
  },
  {
    name: "Kitchen Renovation",
    category: "Building & Joinery",
    title: "Fitted Kitchen & Appliance Installation",
    notes:
      "Remove old kitchen cabinetry. Assemble and install 10 base & wall units, template and fit solid oak worktops, install ceramic Belfast sink with mixer tap, connect integrated dishwasher and induction hob.",
    items: [
      {
        id: "t2-1",
        type: "material",
        description: "Solid Oak 40mm Stave Worktops (3x 3m lengths) + Sealant",
        quantity: 3,
        unit: "lengths",
        rate: 220.0,
      },
      {
        id: "t2-2",
        type: "material",
        description: "Worktop jig joinery bolts, colour-fill sealant & fixing packs",
        quantity: 1,
        unit: "pack",
        rate: 75.0,
      },
      {
        id: "t2-3",
        type: "labor",
        description: "Kitchen cabinet assembly, scribing end panels & worktop jointing",
        quantity: 24,
        unit: "hrs",
        rate: 52.0,
      },
      {
        id: "t2-4",
        type: "labor",
        description: "Plumbing sink wastes, trap and appliance inlet feeds",
        quantity: 4,
        unit: "hrs",
        rate: 55.0,
      },
      {
        id: "t2-5",
        type: "service",
        description: "4-yard midi skip hire for old kitchen disposal",
        quantity: 1,
        unit: "skip",
        rate: 240.0,
      },
    ],
  },
  {
    name: "Roof Repair",
    category: "Roofing",
    title: "Slate Roof Overhaul & Ridge Re-pointing",
    notes:
      "Erect tower scaffold. Strip back 15 cracked natural slates, inspect batten timber, install breathable waterproof membrane patch, replace with matching Spanish slates using copper nails, and re-bed 6 ridge tiles in mortar.",
    items: [
      {
        id: "t3-1",
        type: "material",
        description: "Natural Roofing Slates (500x250mm) + Copper Disc Rivets",
        quantity: 20,
        unit: "slates",
        rate: 6.5,
      },
      {
        id: "t3-2",
        type: "material",
        description: "Class A sand and cement mortar + plasticiser + breathable membrane",
        quantity: 1,
        unit: "set",
        rate: 85.0,
      },
      {
        id: "t3-3",
        type: "labor",
        description: "Roofing repairs, slate fixing, and re-pointing ridge crests",
        quantity: 10,
        unit: "hrs",
        rate: 60.0,
      },
      {
        id: "t3-4",
        type: "service",
        description: "Safety tower scaffolding hire and delivery",
        quantity: 1,
        unit: "hire",
        rate: 220.0,
      },
    ],
  },
  {
    name: "Driveway Installation",
    category: "Groundworks",
    title: "Block Paved Driveway (45m²)",
    notes:
      "Excavate existing ground to 200mm depth. Lay and mechanically compact MOT Type 1 aggregate sub-base, sharp sand screed bed, lay 50mm charcoal block paving with herringbone pattern, and brush in kiln-dried sand.",
    items: [
      {
        id: "t4-1",
        type: "material",
        description: "Standard 50mm Charcoal Block Paving (45 square metres)",
        quantity: 45,
        unit: "m²",
        rate: 24.0,
      },
      {
        id: "t4-2",
        type: "material",
        description: "MOT Type 1 Roadstone Sub-base (6 Bulk Bags) + Heavy Geotextile Membrane",
        quantity: 6,
        unit: "bags",
        rate: 68.0,
      },
      {
        id: "t4-3",
        type: "labor",
        description: "Groundworks team excavation, sub-base compaction & block laying",
        quantity: 32,
        unit: "hrs",
        rate: 48.0,
      },
      {
        id: "t4-4",
        type: "service",
        description: "Grab wagon soil removal & compactor plate machinery hire",
        quantity: 1,
        unit: "hire",
        rate: 360.0,
      },
    ],
  },
  {
    name: "Boiler Replacement",
    category: "Heating",
    title: "Combi Boiler Upgrade & Power Flush",
    notes:
      "Decommission existing inefficient boiler. Supply and fit high-efficiency 30kW combi boiler with horizontal flue, inline magnetic filter, full chemical powerflush of radiators, and wireless room thermostat.",
    items: [
      {
        id: "t5-1",
        type: "material",
        description: "A-rated 30kW Condensing Combi Boiler + Telescopic Flue Kit",
        quantity: 1,
        unit: "unit",
        rate: 1150.0,
      },
      {
        id: "t5-2",
        type: "material",
        description: "22mm Central Heating Magnetic System Filter + Scale Reducer",
        quantity: 1,
        unit: "set",
        rate: 140.0,
      },
      {
        id: "t5-3",
        type: "labor",
        description: "Certified boiler replacement, pipe alterations & heating powerflush",
        quantity: 14,
        unit: "hrs",
        rate: 65.0,
      },
      {
        id: "t5-4",
        type: "service",
        description: "Building control notification & benchmark commissioning registration",
        quantity: 1,
        unit: "cert",
        rate: 60.0,
      },
    ],
  },
];

interface QuoteTemplatesBarProps {
  templates?: QuoteTemplate[];
  onSelectTemplate: (template: QuoteTemplate) => void;
}

export default function QuoteTemplatesBar({
  templates = DEFAULT_QUOTE_TEMPLATES,
  onSelectTemplate,
}: QuoteTemplatesBarProps) {
  return (
    <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          1-Click Job Templates
        </span>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Loads pre-itemized trade materials & labor
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl.name}
            type="button"
            onClick={() => onSelectTemplate(tpl)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition shadow-2xs active:scale-[0.98]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{tpl.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
