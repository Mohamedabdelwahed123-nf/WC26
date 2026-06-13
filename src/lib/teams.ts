// Correspondance nom d'équipe (tel que fourni par openfootball) -> code ISO 3166-1 alpha-2.
// Sert à générer le drapeau emoji. Les noms absents de cette table sont considérés
// comme des "placeholders" de phase finale (ex: "2A", "W101") et reçoivent un drapeau neutre.

const NAME_TO_CODE: Record<string, string> = {
  Algeria: "DZ",
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  "Bosnia & Herzegovina": "BA",
  Brazil: "BR",
  Canada: "CA",
  "Cape Verde": "CV",
  Colombia: "CO",
  Croatia: "HR",
  "Curaçao": "CW",
  "Czech Republic": "CZ",
  "DR Congo": "CD",
  Ecuador: "EC",
  Egypt: "EG",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Haiti: "HT",
  Iran: "IR",
  Iraq: "IQ",
  "Ivory Coast": "CI",
  Japan: "JP",
  Jordan: "JO",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Norway: "NO",
  Panama: "PA",
  Paraguay: "PY",
  Portugal: "PT",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Tunisia: "TN",
  Turkey: "TR",
  USA: "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
};

// Drapeaux spéciaux (pas de code ISO alpha-2 — sous-divisions du Royaume-Uni).
const SPECIAL_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

const NEUTRAL_FLAG = "🏳️";

/** Convertit un code ISO alpha-2 (ex: "FR") en drapeau emoji (indicateurs régionaux). */
function codeToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return NEUTRAL_FLAG;
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (code.toUpperCase().charCodeAt(0) - 65),
    base + (code.toUpperCase().charCodeAt(1) - 65),
  );
}

/** Retourne le drapeau emoji d'une équipe, ou un drapeau neutre si inconnue/placeholder. */
export function flagFor(teamName: string): string {
  if (SPECIAL_FLAGS[teamName]) return SPECIAL_FLAGS[teamName];
  const code = NAME_TO_CODE[teamName];
  return code ? codeToFlag(code) : NEUTRAL_FLAG;
}

/**
 * Indique si un nom d'équipe est un placeholder de phase finale (ex: "2A", "W101", "L73")
 * — c.-à-d. une équipe pas encore connue, que l'admin pourra renommer plus tard.
 */
export function isPlaceholderTeam(teamName: string): boolean {
  return !(teamName in NAME_TO_CODE) && !(teamName in SPECIAL_FLAGS);
}
