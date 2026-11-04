// What Standard includes, and what Better and Premium change, in words a
// homeowner can compare. The extra money is still the same percentage of the
// net price. These lines never carry a price of their own.
//
// An older quote has no `changes` list. Leave it that way: the prices still
// show, and the page does not invent a difference.

export const TIER_CHANGES_PROMPT =
  "Also return tierChanges. Standard is what that price includes. Better is what changes compared with Standard. Premium is what changes compared with Better. " +
  "Each list is 3 or 4 short bullets a homeowner understands, in British spelling. " +
  "Name the actual material, the extra preparation, the extra coat, the finish, or the extra item. " +
  "A decorating Better bullet can be 'Trade emulsion swapped for a durable washable paint'. " +
  "If the notes say the customer is supplying the paint, do not swap the paint. Say the extra preparation instead, for example 'Nail holes and small cracks filled and sanded first'. " +
  "Do not use a vague line on its own, such as 'upgraded materials' or 'a neater finish'. " +
  "Better and Premium must list only real differences from the tier below. " +
  "Do not repeat Standard's work there. Do not put dust sheets, masking, a clean-up, or anything described as standard or included as standard on Better or Premium. Those belong on Standard, when they are part of the job. " +
  "Every Better and Premium bullet must name a real upgrade: a different material, extra preparation, an extra coat, a finer finish, or an extra item. " +
  "Do not put prices, percentages, or pound amounts in the bullets. " +
  "Do not claim Gas Safe, NICEIC, or any other registration unless the notes say so.";

export const tierChangesSchema = {
  type: "object",
  description:
    "Plain differences a homeowner can compare. No prices. Better is what changes from Standard. Premium is what changes from Better.",
  properties: {
    standard: {
      type: "array",
      items: { type: "string" },
      description: "Three or four short bullets of what Standard includes.",
    },
    better: {
      type: "array",
      items: { type: "string" },
      description:
        "Three or four short bullets naming only what changes from Standard: a different material, extra preparation, an extra coat, a finer finish, or an extra item. Do not include dust sheets, masking, a clean-up, or anything that is standard or included as standard.",
    },
    premium: {
      type: "array",
      items: { type: "string" },
      description:
        "Three or four short bullets naming only what changes from Better. Do not repeat Standard or Better, and do not include dust sheets, masking, a clean-up, or anything that is standard or included as standard.",
    },
  },
  required: ["standard", "better", "premium"],
};

/** @type {Record<string, { standard: string[], better: string[], premium: string[] }>} */
const PACKS = {
  "decorating-customer-paint": {
    standard: [
      "Walls and ceilings in the white emulsion you supply",
      "Woodwork in the white satin you supply",
      "Dust sheets, masking, and a clean-up",
    ],
    better: [
      "Nail holes and small cracks filled and sanded first",
      "An extra coat on the walls",
      "Woodwork rubbed down, then an extra coat of your satin",
      "Edges cut in by hand for a sharper line",
    ],
    premium: [
      "A mist coat first where the old colour shows through",
      "Woodwork filled and sanded, then two coats",
      "Caulk on skirtings and frames before the last coat",
      "A daylight check and touch-ups before we leave",
    ],
  },
  decorating: {
    standard: [
      "Walls and ceilings in trade vinyl matt emulsion",
      "Woodwork in white satin",
      "Dust sheets, masking, and a clean-up",
    ],
    better: [
      "Trade emulsion swapped for a durable washable paint",
      "An extra coat on the walls",
      "Nail holes and small cracks filled and sanded",
      "Woodwork rubbed down, then an extra coat of satin",
    ],
    premium: [
      "A scrubbable paint, the sort used in a kitchen",
      "Ceilings in a stain-blocking paint where marks show",
      "Woodwork filled, then two coats of hard-wearing satin",
      "Caulk on skirtings and frames before the last coat",
    ],
  },
  plumbing: {
    standard: [
      "The leak or the slow waste put right",
      "The small parts the repair needs",
      "A check that it runs and does not drip",
    ],
    better: [
      "A new mixer tap, not only a new washer",
      "A new waste trap, not a clean of the old one",
      "New isolation valves if the old ones will not shut",
      "The joint under the sink wiped and checked",
    ],
    premium: [
      "A chrome mixer tap you agree before we fit it",
      "New flexible tap tails as well as the trap",
      "Both isolation valves replaced",
      "The cupboard under the sink checked for other drips",
    ],
  },
  electrical: {
    standard: [
      "The lights or sockets in the job, isolated and tested",
      "Existing cable reused where it is sound",
      "Covers refitted when we finish",
    ],
    better: [
      "Dimmable LED downlights instead of basic lamps",
      "Fire-rated hoods where a light sits in the ceiling",
      "A USB socket where a new socket is added",
      "The circuit labelled so you know which switch it is",
    ],
    premium: [
      "Low-glare downlights in a warm colour agreed first",
      "Brushed or metal socket plates instead of plain white",
      "Fire hoods and an earth check on the circuit we opened",
      "Paint edges around each new fitting made good",
    ],
  },
  "consumer-unit": {
    standard: [
      "A metal consumer unit fitted in place of the old board",
      "The circuits connected and tested",
      "The cover put back on",
    ],
    better: [
      "A separate RCBO for each circuit, not one shared trip",
      "Each switch labelled with the room it serves",
      "Cable entries closed so no cores are left bare",
    ],
    premium: [
      "Spare ways left for a circuit you might add later",
      "An RCBO on the lights as well as the sockets",
      "The plaster around the board filled",
      "A written list of which breaker does what",
    ],
  },
  "roof-tiles": {
    standard: [
      "Replacement tiles matched to the ones on the roof",
      "The broken tiles taken off and the new ones fixed",
      "Loose bits cleared off the roof",
    ],
    better: [
      "Tiles matched for colour as well as shape",
      "New nails or clips, not the old fixings reused",
      "Nearby loose tiles refixed while we are there",
      "The mortar at the edge of the repair pointed",
    ],
    premium: [
      "A patch of breathable underlay under the new tiles",
      "The nearest flashing resealed",
      "The next course of tiles checked, not only the broken ones",
      "Photos of the finished repair left with you",
    ],
  },
  roofing: {
    standard: [
      "New slates or tiles, with underlay and lead as listed",
      "The damaged area stripped and the covering refixed",
      "Access and the old waste taken away",
    ],
    better: [
      "New breathable membrane, not a patch of the old sheet",
      "New battens where the old ones are soft",
      "Code 4 lead at the wall, not mortar on its own",
      "The ridge pointed, or a dry ridge fitted",
    ],
    premium: [
      "New battens along the repaired slope",
      "Lead soakers plus a cover flashing",
      "The gutter under the repair cleared and reset",
      "The ridge and the eaves checked, not only the hole",
    ],
  },
  fencing: {
    standard: [
      "Treated fence panels, concrete posts, and gravel boards",
      "The old fence taken down and taken away",
      "Posts set in concrete",
    ],
    better: [
      "Closeboard panels instead of ordinary featheredge",
      "A taller gravel board so the timber sits off the soil",
      "Post caps so water does not sit on the posts",
      "The tops of the panels lined up",
    ],
    premium: [
      "Heavier closeboard panels",
      "Stainless fixings instead of ordinary nails",
      "Gravel boards and caps on every bay",
      "The ground along the fence raked level",
    ],
  },
  boiler: {
    standard: [
      "A condensing combi and a horizontal flue",
      "A magnetic filter and inhibitor",
      "The old boiler drained and the new one filled",
    ],
    better: [
      "A higher-output combi, agreed before we order it",
      "The radiators bled and the filter fitted on the return",
      "The flue sealed where it meets the wall",
      "New clips on the pipework we disturb",
    ],
    premium: [
      "A premium combi from a range you pick before we order",
      "The condensate pipe lagged or run indoors",
      "New thermostatic valves on seized radiators",
      "The casing and the pipes left tidy",
    ],
  },
  plastering: {
    standard: [
      "Two-coat skim on the walls or ceiling listed",
      "Beads, scrim, and bonding agent as listed",
      "Floors covered and the room swept",
    ],
    better: [
      "Corner beads on every outside corner",
      "Scrim over cracks before the skim",
      "A tighter finish that is ready for paint",
      "Sockets and skirtings masked",
    ],
    premium: [
      "Board and skim where the old plaster is too far gone",
      "A straight-edge check so the wall is flat",
      "A fine finish left ready for a mist coat",
      "Floors still protected when we leave",
    ],
  },
  carpentry: {
    standard: [
      "Doors hung and skirtings fitted as listed",
      "Hinges and handles included",
      "Offcuts taken away",
    ],
    better: [
      "Solid-core doors instead of hollow ones",
      "Soft-close latches",
      "Skirtings scribed to an uneven floor",
      "The hinge side packed so the door does not drop",
    ],
    premium: [
      "A hardwood or oak-veneer door, agreed first",
      "Hinges and handles in one matching finish",
      "Moisture-resistant skirting in a wet room",
      "Frames filled and left ready to paint",
    ],
  },
  bathroom: {
    standard: [
      "The tiles, tanking, adhesive, and grout listed",
      "Tiles set, grouted, and sealed with silicone",
      "Packaging taken away",
    ],
    better: [
      "Rectified porcelain instead of basic ceramic",
      "Epoxy grout in the shower, which resists mould",
      "Tanking across the shower walls, not only the tray",
      "A metal trim on the outside corners",
    ],
    premium: [
      "Larger porcelain tiles, so there are fewer grout lines",
      "Tanking to the full height of the shower walls",
      "Silicone coloured to match the grout",
      "A later check of the seal once it has cured",
    ],
  },
  brickwork: {
    standard: [
      "Bricks or blocks, sand, and plasticiser as listed",
      "The wall laid and the joints tooled",
      "Spoil cleared",
    ],
    better: [
      "Facing bricks matched to the existing wall",
      "Joints ironed to match the old pointing",
      "Stainless wall ties where the wall is opened",
      "The damp course lapped where we break into it",
    ],
    premium: [
      "A sample of the brick agreed before the rest is laid",
      "The adjoining courses repointed, not only the new work",
      "Mortar splashes cleaned off the face of the wall",
      "The base of the wall left swept",
    ],
  },
  kitchen: {
    standard: [
      "Cabinets assembled and worktops fitted as listed",
      "Joints bolted and the edges sealed",
      "Packaging taken away",
    ],
    better: [
      "A solid-wood or compact worktop, agreed first",
      "End panels scribed to the wall",
      "Worktop joints pulled tight and colour-filled",
      "Doors adjusted so the gaps are even",
    ],
    premium: [
      "An upstand in the same material as the worktop",
      "Soft-close hinges and drawer runners",
      "The sink cut-out sealed",
      "Plinths scribed to the floor",
    ],
  },
  paving: {
    standard: [
      "The slabs, sub-base, and mortar bed listed",
      "Slabs laid and the joints pointed",
      "Spoil taken away",
    ],
    better: [
      "Porcelain slabs instead of ordinary sandstone",
      "A full mortar bed, not dots of mortar",
      "A membrane under the sub-base",
      "Joints filled with a two-part resin",
    ],
    premium: [
      "A thicker porcelain slab",
      "Falls set so water runs away from the house",
      "The edges haunched in concrete",
      "A channel drain at the door, where the levels allow",
    ],
  },
  decking: {
    standard: [
      "A treated subframe and the boards listed",
      "Boards fixed and the offcuts cleared",
    ],
    better: [
      "Composite boards instead of timber boards",
      "Joists closer together so the deck does not bounce",
      "Hidden fixings instead of screws in the face",
      "A weed membrane under the frame",
    ],
    premium: [
      "Grooved composite boards with a non-slip face",
      "A picture-frame border",
      "The edge finished with a fascia board",
      "Posts or pedestals set so the deck stays level",
    ],
  },
  flooring: {
    standard: [
      "The laminate or vinyl listed, with underlay",
      "Doors trimmed where the new floor needs it",
      "Beading fitted and offcuts cleared",
    ],
    better: [
      "A thicker underlay with a damp membrane",
      "A harder-wearing board instead of a basic one",
      "Expansion gaps covered with scotia",
      "Door bars in a finish close to the floor",
    ],
    premium: [
      "The subfloor levelled where it is not flat",
      "A glued vinyl or a laid pattern, agreed first",
      "Metal door bars, screwed down",
      "A cover so no gap shows at the skirting",
    ],
  },
  landscaping: {
    standard: [
      "Turf and topsoil, laid and rolled",
      "One water when we finish",
      "Green waste taken away",
    ],
    better: [
      "Weed-free turf, laid the day it is delivered",
      "A deeper layer of screened topsoil",
      "Stones raked out before the turf goes down",
      "Edges cut to a line you agree",
    ],
    premium: [
      "Fertiliser worked into the soil before the turf",
      "A timber or steel edge so the lawn stays put",
      "Seams top-dressed so the joins do not show",
      "The first watering done before we leave",
    ],
  },
  guttering: {
    standard: [
      "New gutter and brackets as listed",
      "The fall set so water reaches the outlet",
      "The old gutter taken away",
    ],
    better: [
      "A deeper gutter, or square-line if it suits the fascia",
      "Extra brackets so the run does not sag",
      "A new outlet, not only the straight lengths",
      "Joints sealed and checked with water",
    ],
    premium: [
      "A colour you agree, in a square-line profile",
      "The fascia checked where the brackets fix",
      "A leaf guard over the outlet",
      "The downpipe clipped and set over the drain",
    ],
  },
  glazing: {
    standard: [
      "The windows listed, foamed, fixed, and sealed",
      "The old frames taken out",
      "The sill fitted",
    ],
    better: [
      "A-rated glass with a warm-edge spacer",
      "Trickle vents in the head of the frame",
      "The plaster around the frame made good",
      "Silicone inside and outside",
    ],
    premium: [
      "Acoustic or triple glass, agreed before we order",
      "A sill with end caps, in a matching finish",
      "The reveals left ready to paint",
      "Handles in a finish you choose",
    ],
  },
  "strip-out": {
    standard: [
      "A skip and the strip-out listed",
      "Rubble bagged and loaded",
      "The room swept",
    ],
    better: [
      "Doorways sheeted so dust stays in the room",
      "Boards on the floors we walk over, not only a sheet",
      "Nails picked up with a magnet",
      "The skip loaded inside the fill line",
    ],
    premium: [
      "Dust extraction running while we strip",
      "The route to the skip protected",
      "A magnet sweep for nails and screws",
      "The room left empty and ready for the next trade",
    ],
  },
  "small-repair": {
    standard: [
      "The repair described in the notes",
      "A small allowance for the parts we find",
      "The area left tidy",
    ],
    better: [
      "The failed part replaced, not only patched",
      "New seals and fixings, not the old ones reused",
      "The repair checked in use before we leave",
      "The area around it wiped down",
    ],
    premium: [
      "The replacement part agreed with you before it is fitted",
      "The next worn part beside it checked",
      "Paint or seal we had to break made good",
      "A short note of what we replaced",
    ],
  },
  general: {
    standard: [
      "The work in the notes, with the materials on the quote",
      "The area protected while we are there",
      "A clean-up when we finish",
    ],
    better: [
      "A tougher fixing or a harder finish than the basic pack",
      "Gaps filled or sealed, not left open",
      "Trims or beads where the work meets an edge",
      "The area hoovered or raked, not only swept",
    ],
    premium: [
      "The finish material agreed with you before we buy it",
      "Making good the paint, plaster, or ground we open",
      "A look over the finished work with you",
      "Offcuts and packaging taken away the same day",
    ],
  },
};

const PRICE_TEXT = /£|\bgbp\b|\bpounds?\b|\bpence\b|\b\d+(?:\.\d+)?\s*%/i;
const VAGUE_LINE =
  /^(?:upgraded materials(?: and a neater finish)?|a neater finish|neater finish|premium materials(?:, more time on site, and a longer guarantee)?|better quality|higher quality|higher spec|upgraded finish)\.?$/i;
const ACCREDITATION = /\b(?:gas safe|niceic|napit)\b/i;
const MIN_BULLET = 12;
const MAX_BULLET = 140;
// Ordinary site protection. It can sit on Standard. It is not a change.
const ORDINARY_WORK = /\b(?:dust sheets?|masking|clean-?up|clean up)\b|\bincluded as standard\b|\bas standard\b/i;
const UPGRADE_AWAY_FROM_BASIC = /\b(?:instead of|rather than|swapped for|than the standard|not the standard)\b/i;

/**
 * A Better or Premium point that describes the basic job, not a difference.
 * "Standard dust sheets and masking included" is ordinary. "Closeboard panels
 * instead of ordinary featheredge" is a real change.
 * @param {string} text
 */
export function ordinaryChangePoint(text) {
  const value = String(text || "").toLowerCase();
  if (!value) return false;
  if (ORDINARY_WORK.test(value)) return true;
  if (/\bstandard\b/.test(value) && !UPGRADE_AWAY_FROM_BASIC.test(value)) return true;
  return false;
}

/**
 * @param {unknown} value
 */
function cleanBullet(value) {
  if (typeof value !== "string") return "";
  let text = value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  text = text.replace(/^[-*•]\s+/, "").replace(/[.]+$/g, "").trim();
  if (text.length < MIN_BULLET || text.length > MAX_BULLET) return "";
  if (PRICE_TEXT.test(text) || VAGUE_LINE.test(text) || ACCREDITATION.test(text)) return "";
  return text;
}

/**
 * @param {unknown} value
 * @param {boolean} [changesOnly] Better and Premium. Ordinary work is dropped.
 * @returns {string[] | null}
 */
function cleanList(value, changesOnly = false) {
  if (!Array.isArray(value)) return null;
  const lines = [];
  const seen = new Set();
  for (const entry of value) {
    const text = cleanBullet(entry);
    if (!text) continue;
    if (changesOnly && ordinaryChangePoint(text)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(text);
    if (lines.length === 4) break;
  }
  if (lines.length < 2) return null;
  return lines;
}

/**
 * @param {string} line
 * @param {string[]} earlier
 */
function repeatsEarlier(line, earlier) {
  const value = line.toLowerCase();
  return earlier.some((other) => {
    const previous = other.toLowerCase();
    if (value === previous) return true;
    const shorter = value.length < previous.length ? value : previous;
    const longer = value.length < previous.length ? previous : value;
    return shorter.length >= 20 && longer.includes(shorter);
  });
}

/**
 * @param {string} left
 * @param {string} right
 */
function sameList(left, right) {
  return left.join("|").toLowerCase() === right.join("|").toLowerCase();
}

/**
 * A model reply is used only when every tier has real bullets and none of
 * them state a price. Anything else falls back to the trade pack.
 * @param {unknown} raw
 * @returns {{ standard: string[], better: string[], premium: string[] } | null}
 */
export function sanitizeTierChanges(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = /** @type {Record<string, unknown>} */ (raw);
  const standard = cleanList(row.standard, false);
  const better = cleanList(row.better, true);
  const premium = cleanList(row.premium, true);
  if (!standard || !better || !premium) return null;
  const betterOnly = better.filter((line) => !repeatsEarlier(line, standard));
  const premiumOnly = premium.filter((line) => !repeatsEarlier(line, [...standard, ...betterOnly]));
  if (betterOnly.length < 2 || premiumOnly.length < 2) return null;
  if (sameList(standard, betterOnly) || sameList(betterOnly, premiumOnly)) return null;
  return { standard, better: betterOnly, premium: premiumOnly };
}

/**
 * @param {string} text
 */
function customerSuppliesPaint(text) {
  const notes = String(text || "").toLowerCase();
  return (
    /\b(?:customer|client)\b[^.]{0,60}\bsuppl(?:y|ies|ying)\b[^.]{0,30}\bpaint\b/.test(notes) ||
    /\bpaint\b[^.]{0,60}\bsupplied by (?:the )?(?:customer|client)\b/.test(notes)
  );
}

/**
 * A consumer-unit quote, not a note that says the board is being left alone.
 * @param {string} text
 */
function isConsumerUnitJob(text) {
  if (!/consumer unit|fuse board|fuseboard|fuse box/.test(text)) return false;
  if (/metal consumer unit|rcbo|spd surge|rewire/.test(text)) return true;
  if (/consumer unit stays|leave the consumer unit|stays as it is|left as it is/.test(text)) return false;
  return true;
}

/**
 * @param {string} text
 */
function matchPack(text) {
  const value = String(text || "").toLowerCase();
  if (!value.trim()) return "";
  if (isConsumerUnitJob(value)) return "consumer-unit";
  if (/\b(?:combis?|boilers?)\b/.test(value)) return "boiler";
  if (/emulsion|satinwood|decorators caulk|vinyl matt|painting & decorating/.test(value)) return "decorating";
  if (/featheredge|gravel board/.test(value)) return "fencing";
  if (/sandstone|block paving|paving slab|sub-base|outdoor paving/.test(value)) return "paving";
  if (/tanking|wall & floor tiles|antibacterial grout|ceramic wall/.test(value)) return "bathroom";
  if (/decking|subframe joist/.test(value)) return "decking";
  if (/\blvt\b|laminate|underlay|scotia beading/.test(value)) return "flooring";
  if (/\bturf\b|topsoil/.test(value)) return "landscaping";
  if (/guttering|downpipe|fascia bracket|half-round/.test(value)) return "guttering";
  if (/double glazed|upvc window|\bglazing\b/.test(value)) return "glazing";
  if (/multi-finish|thistle|skimming/.test(value)) return "plastering";
  if (/door hanging|internal oak|joinery installation|oak veneer/.test(value)) return "carpentry";
  if (/worktop|kitchen fitting|cabinet hanging/.test(value)) return "kitchen";
  if (/facing brick|wall tie|brickwork|repoint/.test(value)) return "brickwork";
  if (/breathable membrane|lead flashing|roof slate|interlocking tile/.test(value)) return "roofing";
  if (/replacement roof tile/.test(value)) return "roof-tiles";
  if (/downlight|socket outlet|ceiling light/.test(value)) return "electrical";
  if (/waste trap|isolation valve|mixer tap|plumber call-out|washers, olives/.test(value)) return "plumbing";
  if (/strip-out|strip out|builders skip|rubble sack/.test(value)) return "strip-out";
  if (/call-out and repair|small materials allowance/.test(value)) return "small-repair";
  if (/\bpaint|\bdecorat|wallpaper|\bgloss\b/.test(value)) return "decorating";
  if (/\broofs?|slates?|ridges?\b/.test(value)) return "roofing";
  if (/\bplumb|\btaps?\b|\bleaks?\b|\bradiators?\b|\btraps?\b/.test(value)) return "plumbing";
  if (/\belectri|\bsockets?\b|\brewire\b|\blighting\b/.test(value)) return "electrical";
  if (/\bfenc|\bpanels?\b/.test(value) && /\bposts?\b|\bfenc/.test(value)) return "fencing";
  if (/\bplaster|\brender\b|\bskim\b/.test(value)) return "plastering";
  if (/\bdoors?\b|\bskirting\b|\bjoiner|\bcarpent/.test(value)) return "carpentry";
  if (/\bbathrooms?\b|\bshowers?\b|\btiling\b|\btiles?\b/.test(value)) return "bathroom";
  if (/\bbrick|\bblockwork\b|\bmortar\b/.test(value)) return "brickwork";
  if (/\bkitchen\b|\bworktops?\b|\bcabinets?\b/.test(value)) return "kitchen";
  if (/\bpatios?\b|\bpaving\b|\bslabs?\b|\bdriveways?\b/.test(value)) return "paving";
  if (/\bdeck/.test(value)) return "decking";
  if (/\bfloor|\bflooring\b|\blaminate\b/.test(value)) return "flooring";
  if (/\blawn\b|\bgrass\b|\bhedge\b/.test(value)) return "landscaping";
  if (/\bgutters?\b|\bfascia\b|\bsoffit\b/.test(value)) return "guttering";
  if (/\bwindows?\b|\bglazing\b/.test(value)) return "glazing";
  if (/\bstrip out\b|\bclearance\b|\bdemolish/.test(value)) return "strip-out";
  return "";
}

/**
 * @param {string} trade
 */
function matchTrade(trade) {
  const text = String(trade || "").toLowerCase();
  if (!text) return "";
  if (text.includes("roof")) return "roofing";
  if (text.includes("plumb") || text.includes("heat") || text.includes("gas")) return "plumbing";
  if (text.includes("electri")) return "electrical";
  if (text.includes("paint") || text.includes("decor")) return "decorating";
  if (text.includes("plaster") || text.includes("render")) return "plastering";
  if (text.includes("joiner") || text.includes("carpent")) return "carpentry";
  if (text.includes("brick") || text.includes("mason")) return "brickwork";
  if (text.includes("landscap") || text.includes("fenc")) return text.includes("fenc") ? "fencing" : "landscaping";
  if (text.includes("floor")) return "flooring";
  if (text.includes("kitchen")) return "kitchen";
  if (text.includes("bath") || text.includes("til")) return "bathroom";
  return "";
}

/**
 * @param {{ notes?: unknown, trade?: unknown, title?: unknown, items?: unknown }} [context]
 */
export function selectTierPack(context = {}) {
  const items = Array.isArray(context.items) ? context.items : [];
  const quoted = [context.title, ...items.map((item) => (item && item.description) || "")].filter(Boolean).join("\n");
  const notes = String(context.notes || "");
  const trade = String(context.trade || "");
  let pack = matchPack(quoted) || matchPack(`${notes}\n${trade}`) || matchTrade(trade) || "general";
  if (pack === "decorating" && customerSuppliesPaint(`${notes}\n${quoted}`)) {
    pack = "decorating-customer-paint";
  }
  return pack;
}

/**
 * @param {{ notes?: unknown, trade?: unknown, title?: unknown, items?: unknown }} [context]
 */
export function fallbackTierChanges(context = {}) {
  const pack = PACKS[selectTierPack(context)] || PACKS.general;
  return {
    standard: pack.standard.slice(),
    better: pack.better.slice(),
    premium: pack.premium.slice(),
  };
}

/**
 * Model text wins when it is usable. Otherwise the trade pack is used.
 * No notes, title, trade, or lines means no invented differences.
 * @param {{ notes?: unknown, trade?: unknown, title?: unknown, items?: unknown, tierChanges?: unknown } | null | undefined} context
 * @returns {{ standard: string[], better: string[], premium: string[] } | null}
 */
export function resolveTierChanges(context) {
  if (!context || typeof context !== "object") return null;
  const fromModel = sanitizeTierChanges(context.tierChanges);
  if (fromModel) return fromModel;
  const items = Array.isArray(context.items) ? context.items : [];
  const hasHint = Boolean(
    String(context.notes || "").trim() ||
      String(context.trade || "").trim() ||
      String(context.title || "").trim() ||
      items.length > 0
  );
  if (!hasHint) return null;
  return fallbackTierChanges(context);
}

/**
 * Bullets already stored on a quote. Empty when the quote was saved before
 * this list existed, or when a line is not safe to show.
 * @param {{ label?: string, changes?: unknown } | null | undefined} option
 */
export function visibleTierChanges(option) {
  const raw = option?.changes;
  if (!Array.isArray(raw)) return [];
  const isChange = /^(?:better|premium)$/i.test(String(option?.label || "").trim());
  const lines = [];
  for (const entry of raw) {
    const text = cleanBullet(entry);
    if (!text) continue;
    if (isChange && ordinaryChangePoint(text)) continue;
    lines.push(text);
    if (lines.length === 4) break;
  }
  return lines;
}

/**
 * @param {unknown} options
 * @returns {{ standard: string[], better: string[], premium: string[] } | null}
 */
export function tierChangesFromOptions(options) {
  if (!Array.isArray(options)) return null;
  /** @type {Record<string, string[]>} */
  const by = {};
  for (const option of options) {
    const key = String(option?.label || "").trim().toLowerCase();
    const lines = visibleTierChanges(option);
    if (key && lines.length >= 2) by[key] = lines;
  }
  if (!by.standard || !by.better || !by.premium) return null;
  return { standard: by.standard, better: by.better, premium: by.premium };
}

/**
 * @param {string} label
 */
export function tierChangeHeading(label) {
  const name = String(label || "").trim().toLowerCase();
  if (name === "better") return "What changes from Standard";
  if (name === "premium") return "What changes from Better";
  return "What's included";
}

/**
 * The priced upgrade line, in whole bullets, with no price added.
 * @param {string[]} lines
 */
export function tierUpgradeSummary(lines) {
  const parts = (Array.isArray(lines) ? lines : [])
    .map((line) => String(line || "").replace(/[.]+$/g, "").trim())
    .filter(Boolean);
  let text = "";
  for (const part of parts) {
    const next = text ? `${text}; ${part}` : part;
    if (next.length > 180) break;
    text = next;
  }
  return text || (parts[0] || "").slice(0, 180);
}

/**
 * @param {Array<{ label?: string, changes?: unknown }>} options
 */
export function choiceHelp(options) {
  const hasPoints = (Array.isArray(options) ? options : []).some(
    (option) => visibleTierChanges(option).length > 0
  );
  if (!hasPoints) return "Pick one. The lines below match that choice.";
  return "Pick one. The points under each price say what is included, or what changes. The lines below match that choice.";
}
