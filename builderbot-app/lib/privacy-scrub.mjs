const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+\d{1,3}[\s().-]*)?(?:\(?0?\d{2,5}\)?[\s().-]*)?\d(?:[\s().-]*\d){8,13}/g;
const POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;
const SENSITIVE_KEY =
  /^(name|fullname|firstname|lastname|email|phone|mobile|telephone|address|postcode|zip|zipcode|notes|note|scope|scopeofwork|description|items|lineitems|signature|signaturename|acceptedsignaturename|rejectedreason|customer|customername|client|clientname|clientemail|clientphone|clientaddress|clientcompany|company|password|secret|token|iban|sortcode|accountnumber|bankaccountnumber)$/i;

export function scrubUrl(value) {
  return String(value)
    .replace(/(\/q\/)[^/?#\s]+/gi, "$1[id]")
    .replace(/(\/i\/)[^/?#\s]+/gi, "$1[token]")
    .replace(/(https?:\/\/[^\s?#]+)\?[^\s#]*/gi, "$1");
}

export function scrubText(value) {
  if (typeof value !== "string" || !value) return value;
  return scrubUrl(value)
    .replace(EMAIL, "[redacted-email]")
    .replace(PHONE, "[redacted-phone]")
    .replace(POSTCODE, "[redacted-postcode]")
    .replace(
      /("(?:clientName|clientEmail|clientPhone|clientAddress|clientCompany|signatureName|acceptedSignatureName|notes|email|phone|address|name)"\s*:\s*")([^"]*)(")/gi,
      "$1[redacted]$3"
    );
}

export function isSensitiveKey(key) {
  return SENSITIVE_KEY.test(String(key).toLowerCase().replace(/[^a-z0-9]/g, ""));
}

export function scrubValue(value, depth = 0) {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") return scrubText(value);
  if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (typeof value === "object") {
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      next[key] = isSensitiveKey(key) ? "[redacted]" : scrubValue(child, depth + 1);
    }
    return next;
  }
  return undefined;
}
