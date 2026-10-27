/**
 * A saved quote template is a name, the lines, and the notes.
 * It belongs to one tradesperson. Starter templates in the app are separate.
 */

/**
 * @param {unknown} value
 */
function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {unknown} item
 * @param {number} index
 */
function copyLine(item, index) {
  const row = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
  const type = row.type === "labor" || row.type === "service" ? row.type : "material";
  return {
    id: clean(row.id) || `line-${index + 1}`,
    type,
    description: clean(row.description) || "Item",
    quantity: Math.max(0, Number(row.quantity) || 0),
    unit: clean(row.unit) || "unit",
    rate: Math.max(0, Number(row.rate) || 0),
    ...(row.usualPrice ? { usualPrice: true } : {}),
    ...(row.rateSource === "list" || row.rateSource === "settings" ? { rateSource: row.rateSource } : {}),
  };
}

/**
 * @param {{ title?: unknown, notes?: unknown, items?: unknown[], vatEnabled?: unknown }} quote
 * @param {unknown} name
 * @returns {{ ok: true, template: { name: string, title: string, notes: string, items: Array<{ id: string, type: "labor" | "material" | "service", description: string, quantity: number, unit: string, rate: number }>, vatEnabled: boolean } } | { ok: false, error: string }}
 */
export function templateFromQuote(quote, name) {
  const templateName = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!templateName) return { ok: false, error: "Name the template first." };
  if (templateName.length > 80) return { ok: false, error: "Use a shorter template name." };
  const items = (Array.isArray(quote?.items) ? quote.items : []).map(copyLine).filter((item) => item.description);
  if (items.length === 0) return { ok: false, error: "Add at least one line before saving a template." };
  return {
    ok: true,
    template: {
      name: templateName,
      title: clean(quote?.title) || templateName,
      notes: String(quote?.notes ?? "").trim(),
      items,
      vatEnabled: Boolean(quote?.vatEnabled),
    },
  };
}

/**
 * @param {object} raw
 */
export function normalizeStoredTemplate(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const built = templateFromQuote(
    {
      title: source.title,
      notes: source.notes,
      items: source.items,
      vatEnabled: source.vatEnabled !== false && source.vat_enabled !== false,
    },
    source.name || "Template"
  );
  const template = built.ok ? built.template : { name: "Template", title: "Template", notes: "", items: [], vatEnabled: true };
  return {
    id: clean(source.id) || "tpl-unsaved",
    name: template.name,
    title: template.title,
    notes: template.notes,
    items: template.items,
    vatEnabled: template.vatEnabled,
    createdAt: clean(source.createdAt || source.created_at).slice(0, 10),
  };
}
