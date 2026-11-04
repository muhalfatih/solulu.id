// Pure rules behind `npm run lint:ui` (ADR-0012). No I/O here so they can be unit tested.

const CARD_TAG = /<(Card(?:Header|Title|Description|Content|Footer|Action)?)(?=[\s>/])/g

// Utility classes that restyle a Card instead of laying it out. Variant prefixes
// (sm:, dark:, [&>div]:, group-data-[x]/y: ...) are stripped before matching.
const STYLE_OVERRIDE_PATTERNS = [
  /^-?(p|px|py|pt|pb|pl|pr|ps|pe)-/,
  /^border($|-)/,
  /^rounded($|-)/,
  /^shadow($|-)/,
  /^ring($|-)/,
  /^outline($|-)/,
  /^bg-/,
  /^(from|via|to)-/,
  /^text-(?!(xs|sm|base|lg|xl|\dxl|left|right|center|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$)/,
]

function stripVariants(token) {
  let depth = 0
  let last = -1
  for (let i = 0; i < token.length; i++) {
    const ch = token[i]
    if (ch === "[" || ch === "(") depth++
    else if (ch === "]" || ch === ")") depth--
    else if (ch === ":" && depth === 0) last = i
  }
  return token.slice(last + 1).replace(/^!/, "")
}

/** True when a single Tailwind token restyles a card (padding/border/radius/shadow/color). */
export function isCardStyleOverride(token) {
  const base = stripVariants(token)
  return STYLE_OVERRIDE_PATTERNS.some((pattern) => pattern.test(base))
}

function readOpeningTag(source, start) {
  let depth = 0
  let quote = null
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch
    } else if (ch === "{") depth++
    else if (ch === "}") depth--
    else if (ch === ">" && depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

function classNameExpression(tag) {
  const match = /\bclassName\s*=\s*/.exec(tag)
  if (!match) return ""
  const rest = tag.slice(match.index + match[0].length)
  if (rest[0] === '"' || rest[0] === "'") {
    const end = rest.indexOf(rest[0], 1)
    return end === -1 ? rest : rest.slice(0, end + 1)
  }
  if (rest[0] === "{") {
    let depth = 0
    let quote = null
    for (let i = 0; i < rest.length; i++) {
      const ch = rest[i]
      if (quote) {
        if (ch === "\\") i++
        else if (ch === quote) quote = null
        continue
      }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch
      else if (ch === "{") depth++
      else if (ch === "}" && --depth === 0) return rest.slice(0, i + 1)
    }
  }
  return ""
}

function stringLiterals(expression) {
  const out = []
  const re = /"([^"]*)"|'([^']*)'|`([^`]*)`/g
  let m
  while ((m = re.exec(expression))) out.push(m[1] ?? m[2] ?? m[3] ?? "")
  return out
}

/** Number of Card* usages whose className restyles the card. */
export function countCardOverrides(source) {
  let count = 0
  CARD_TAG.lastIndex = 0
  let match
  while ((match = CARD_TAG.exec(source))) {
    const tag = readOpeningTag(source, match.index)
    const tokens = stringLiterals(classNameExpression(tag))
      .join(" ")
      .split(/\s+/)
      .filter(Boolean)
    if (tokens.some(isCardStyleOverride)) count++
  }
  return count
}

/** Number of hand-written `animate-pulse` usages (use the real Skeleton instead). */
export function countAnimatePulse(source) {
  return (source.match(/(^|[\s"'`:])animate-pulse(?![\w-])/g) ?? []).length
}

export function countViolations(source) {
  return {
    "animate-pulse": countAnimatePulse(source),
    "card-override": countCardOverrides(source),
  }
}

/**
 * Zero tolerance: every violation found in a portal file is a failure.
 * Returns one entry per file and rule with the number of occurrences.
 */
export function findViolations(current) {
  const failures = []
  for (const file of Object.keys(current).sort()) {
    for (const [rule, have] of Object.entries(current[file])) {
      if (have > 0) failures.push({ file, rule, have })
    }
  }
  return failures
}
