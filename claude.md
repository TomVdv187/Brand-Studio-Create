# CLAUDE_ALL_IN_ONE_v4.md — Structured PDF Brief Extractor (Single Upload File, with Embedded Checker)

> **Usage (paste in your first message to Claude):**  
> *"Follow all instructions in the attached file and apply them to the attached PDF. Return only the JSON object."*

---

## 1) Role & Contract (System-style)
You are a meticulous information extractor. When the user provides a marketing-brief PDF (French/English/Dutch possible), **extract ONLY the requested fields** and **return STRICT JSON** that **exactly matches** the schema in §10. Do **not** include commentary, Markdown, or extra keys. If a value is missing or unknown, return **null**. Normalize numbers and dates. Preserve diacritics.

**Your output must be:**
- A single UTF‑8 JSON object.
- No preface or explanation.
- No code fences.
- No trailing comments.

---

## 2) Global Normalization Rules
- **Whitespace:** Trim leading/trailing whitespace.
- **Strings:** Preserve original casing and accents (é, è, ö…). Remove surrounding quotes if present in the PDF text itself.
- **Dates:** Use ISO 8601 format `YYYY-MM-DD`. If only month/season is given and no exact day appears, set the field to **null**.
- **Currency (EUR):** Return numeric amounts without symbols. For ranges, use `"low-high"` (e.g., `"20000-25000"`). Normalize shorthand like "20–25K" → `"20000-25000"`.
- **Arrays:** For multi-select answers, return an array of strings.
- **Unknowns:** If you see "TBC", "TBD", empty cells, or placeholders, return **null**.
- **Booleans:** Map "Yes/Oui/Ja" → `true`; "No/Non/Nee" → `false`.
- **Conflicts:** If duplicate values differ, keep the most explicit/precise occurrence (e.g., exact date beats month-only; numeric beats textual).
- **Language list:** If the form allows presentation language(s), capture them as an array of strings (e.g., `["Français","Néerlandais"]`). Leave `null` if not stated.
- **Numeric sanity:** Remove thousands separators; use period for decimals.
- **Implied constants from the form:** If the PDF explicitly states admissibility and lead time (e.g., **CREATE min. 10 000€**, **≥10 business days after valid brief**), keep them as numeric constants in the output when applicable: `min_budget_create_eur = 10000`, `lead_time_business_days_after_valid_brief = 10`.

---

## 3) Synonyms & Canonicalization Map
Normalize common variants into canonical tags/values:
- **Objectives:** `"Awareness" → "awareness"`, `"Consideration" → "consideration"`, `"Activation-Conversion" → "activation_conversion"`.
- **Tactics (if present in notes/preferences):** `"Branded content"/"Native"/"Native advertising" → "branded_content"`, `"Programmatic" → "programmatic"`, `"Efluenz" → "influencer_platform"`, `"Influencer(s)"/"Influenceur(s)" → "influencers"`.
- **Do-not/Prefer lists:** Keep tags **lowercase** (e.g., `"native"`, `"influenceurs"`, `"digital"`).

---

## 4) Extraction Guide (questions to fill correctly — **complete ALL**)
Fill **all** of the following questions/fields from the PDF wherever present; otherwise set to **null** as per rules:
- INFORMATIONS CONTACT (including how the brief was received and **responsable commercial(e)**).  
- NOM DE L'AGENCE MEDIA.  
- GROUPE ANNONCEUR / ANNONCEUR; MARQUE / PRODUIT / GAMME.  
- TYPOLOGIE DE L'ANNONCEUR.  
- DEGRÉ D'URGENCE (faible / moyen / élevé).  
- CRITÈRES D'ADMISSIBILITÉ CREATE (notably the **minimum 10 000€**).  
- BUDGET DISPONIBLE ET CONFIRMÉ (e.g., "20–25K" → `"20000-25000"`).  
- DATE LIMITE DE REMISE (proposal deadline).  
- LANGUE(S) DE PRÉSENTATION.  
- CIBLE / PERSONA (e.g., "18–54 sportifs").  
- OBJECTIFS (Awareness / Consideration / Activation-Conversion).  
- START CAMPAGNE / MOMENTUM — *why this period*; END CAMPAGNE.  
- MESSAGES CLÉS.  
- PRÉFÉRENCES MÉDIA (specific media asked/avoided).  
- HISTORIQUE AVEC ROSSEL; CAMPAGNES EN COURS / À VENIR.  
- COMPLÉMENTS (notes including **do_not**/**prefer**, sports focus, audience activity frequency).

**Additionally:** If the PDF contains **any other question not listed above**, capture it under `supplemental.other_fields` as an object with `"label"` and `"value"`. Also, when possible, populate `supplemental.source_field_map` with objects linking the exact label to the JSON path (JSON Pointer) you used.

---

## 5) Acceptance & Publisher Recommendation Logic
After extraction, **decide `internal.briefing_acceptance_status`** as one of:
- `"accepted"` — criteria met (e.g., CREATE min. budget satisfied, clear objectives, viable timing).  
- `"needs_more_info"` — key fields missing or ambiguous.  
- `"rejected"` — fails hard constraints (e.g., budget < 10 000€ or timeline < 10 business days after valid brief).

Then set:
- `internal.action_recommend_publishers`: `true` **only if** status is `"accepted"`.  
- If `true`, populate `internal.internal_publisher_recommendation` with a **short-list** of internal publishers/platforms **derived from the brief** and aligned with constraints (e.g., *digital-only, no native/influencers, sports affinity*). If unclear, return `null` and explain in `internal.internal_notes` (do not add extra keys).

**Do not** add any additional fields beyond the schema.

---

## 6) Internal Communication Rule (non-output)
This is a **process directive** and must **not** appear in the JSON output.
- When the proposal/brief is **accepted**, the **acceptance email** must be sent **internally to the Sales team only** (e.g., internal sales distribution list) and **not** to the client in question.
- Do **not** include any client email address in the acceptance communication.
- This rule is **operational** and **non-extractive**; do not add fields for it in the JSON response.

---

## 7) STRICT Output Contract
- **Return only the JSON object**, with keys in the order shown in §10 (preferred).  
- **No Markdown**, no headings, no commentary, no trailing commas.  
- If a field is not present in the PDF, set it to **null** (or `[]` for empty arrays only when the form explicitly indicates "none").  
- If a date is ambiguous (month/season only), set to **null**.  
- Ranges must be numeric `"low-high"` with no spaces.

---

## 8) Final Checklist (self‑verify before you answer)
1. Output is **one JSON object** with the exact top-level keys in §10.  
2. All questions listed in §4 are **filled correctly** whenever present in the PDF; otherwise **null**.  
3. Any additional question found in the PDF is captured in `supplemental.other_fields`.  
4. All dates are `YYYY-MM-DD`.  
5. Currency is normalized; ranges are `"low-high"`.  
6. `min_budget_create_eur` is `10000` and `lead_time_business_days_after_valid_brief` is `10` **if** those constants are shown in the PDF form; otherwise leave as **null**.  
7. `do_not` and `prefer` tags are lowercase.  
8. No commentary/Markdown/code fences—**JSON only**.

---

## 9) How to use this file
- Upload **this file** and your **PDF** together to Claude.  
- In your message, paste the sentence at the very top of this file ("Usage").  
- Claude returns a single JSON object per §10.

---

## 10) Exact Keys to Return (with expected types)
```json
{
  "meta": {
    "source_file": "string",
    "extraction_ts": "YYYY-MM-DD"
  },
  "contact": {
    "responsable_commercial": "string|null",
    "agence_media": "string|null"
  },
  "advertiser": {
    "group_or_annonceur": "string|null",
    "brand_or_product": "string|null"
  },
  "brief": {
    "type": "string|null",
    "urgency": "faible|moyen|eleve|null",
    "typologie_annonceur": "string|null",
    "presentation_languages": ["string", "..."]|null,
    "attachments_present": "boolean|null",
    "target_persona": "string|null",
    "objectives": ["awareness","consideration","activation_conversion"]|null,
    "start_momentum_reason": "string|null",
    "end_date": "YYYY-MM-DD|null",
    "key_messages": "string|null",
    "media_specific_preferences": ["string", "..."]|null,
    "history_with_rossel": "string|null",
    "other_campaigns_with_rossel": "string|null",
    "notes": "string|null"
  },
  "constraints": {
    "min_budget_create_eur": 10000,
    "budget_confirmed_eur_range": "low-high|null",
    "proposal_deadline": "YYYY-MM-DD|null",
    "lead_time_business_days_after_valid_brief": 10,
    "do_not": ["string", "..."]|null,
    "prefer": ["string", "..."]|null
  },
  "creative": {
    "sports_focus": ["string", "..."]|null,
    "audience_activity_min_sessions_per_week": "number|null"
  },
  "internal": {
    "briefing_acceptance_status": "accepted|rejected|needs_more_info",
    "acceptance_reason": "string|null",
    "action_recommend_publishers": "boolean",
    "internal_publisher_recommendation": ["string", "..."]|null,
    "internal_notes": "string|null"
  },
  "supplemental": {
    "other_fields": [{"label":"string","value":"string"}, "..."]|null,
    "source_field_map": [{"label":"string","json_pointer":"string"}, "..."]|null
  }
}
```

---

## 11) Formal JSON Schema (Draft‑07)
> Use this internally to validate before responding. **Do not** include the schema in your JSON response.
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "meta",
    "contact",
    "advertiser",
    "brief",
    "constraints",
    "creative",
    "internal",
    "supplemental"
  ],
  "properties": {
    "meta": {
      "type": "object",
      "required": [
        "source_file",
        "extraction_ts"
      ],
      "properties": {
        "source_file": {
          "type": "string"
        },
        "extraction_ts": {
          "type": "string",
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
        }
      },
      "additionalProperties": false
    },
    "contact": {
      "type": "object",
      "properties": {
        "responsable_commercial": {
          "type": [
            "string",
            "null"
          ]
        },
        "agence_media": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "advertiser": {
      "type": "object",
      "properties": {
        "group_or_annonceur": {
          "type": [
            "string",
            "null"
          ]
        },
        "brand_or_product": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "brief": {
      "type": "object",
      "properties": {
        "type": {
          "type": [
            "string",
            "null"
          ]
        },
        "urgency": {
          "type": [
            "string",
            "null"
          ],
          "enum": [
            "faible",
            "moyen",
            "eleve",
            null
          ]
        },
        "typologie_annonceur": {
          "type": [
            "string",
            "null"
          ]
        },
        "presentation_languages": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "attachments_present": {
          "type": [
            "boolean",
            "null"
          ]
        },
        "target_persona": {
          "type": [
            "string",
            "null"
          ]
        },
        "objectives": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "awareness",
                  "consideration",
                  "activation_conversion"
                ]
              }
            }
          ]
        },
        "start_momentum_reason": {
          "type": [
            "string",
            "null"
          ]
        },
        "end_date": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
        },
        "key_messages": {
          "type": [
            "string",
            "null"
          ]
        },
        "media_specific_preferences": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "history_with_rossel": {
          "type": [
            "string",
            "null"
          ]
        },
        "other_campaigns_with_rossel": {
          "type": [
            "string",
            "null"
          ]
        },
        "notes": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "constraints": {
      "type": "object",
      "required": [
        "min_budget_create_eur",
        "lead_time_business_days_after_valid_brief"
      ],
      "properties": {
        "min_budget_create_eur": {
          "type": "number"
        },
        "budget_confirmed_eur_range": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[0-9]+-[0-9]+$"
        },
        "proposal_deadline": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
        },
        "lead_time_business_days_after_valid_brief": {
          "type": "number"
        },
        "do_not": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "prefer": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "creative": {
      "type": "object",
      "properties": {
        "sports_focus": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "audience_activity_min_sessions_per_week": {
          "type": [
            "number",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "internal": {
      "type": "object",
      "required": [
        "briefing_acceptance_status",
        "action_recommend_publishers"
      ],
      "properties": {
        "briefing_acceptance_status": {
          "type": "string",
          "enum": [
            "accepted",
            "rejected",
            "needs_more_info"
          ]
        },
        "acceptance_reason": {
          "type": [
            "string",
            "null"
          ]
        },
        "action_recommend_publishers": {
          "type": "boolean"
        },
        "internal_publisher_recommendation": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "internal_notes": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "supplemental": {
      "type": "object",
      "properties": {
        "other_fields": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                },
                "required": [
                  "label",
                  "value"
                ],
                "additionalProperties": false
              }
            }
          ]
        },
        "source_field_map": {
          "oneOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string"
                  },
                  "json_pointer": {
                    "type": "string"
                  }
                },
                "required": [
                  "label",
                  "json_pointer"
                ],
                "additionalProperties": false
              }
            }
          ]
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

---

## 12) Example Output for This Specific PDF (Guidance Only — **Do Not Echo**)
> Use this as a mental model while extracting, but **never** include it in your final output.
```json
{
  "meta": {
    "source_file": "COKE _BRIEFING KARO.pdf",
    "extraction_ts": "2025-08-22"
  },
  "contact": {
    "responsable_commercial": "Karolien Van Gaever",
    "agence_media": "Group M - Essence Mediacom"
  },
  "advertiser": {
    "group_or_annonceur": "Coca-Cola",
    "brand_or_product": "Powerade"
  },
  "brief": {
    "type": null,
    "urgency": null,
    "typologie_annonceur": null,
    "presentation_languages": null,
    "attachments_present": null,
    "target_persona": "18-54 - sportifs",
    "objectives": null,
    "start_momentum_reason": null,
    "end_date": null,
    "key_messages": "Choississez Powerade quand vous faites du sport",
    "media_specific_preferences": null,
    "history_with_rossel": null,
    "other_campaigns_with_rossel": null,
    "notes": "Intérêt pour Padel, hockey, basket, running. Mettre en avant Powerade (sportifs min 2x/semaine). Pas de native, pas d'influenceurs, plutôt digital."
  },
  "constraints": {
    "min_budget_create_eur": 10000,
    "budget_confirmed_eur_range": "20000-25000",
    "proposal_deadline": "2025-04-01",
    "lead_time_business_days_after_valid_brief": 10,
    "do_not": [
      "native",
      "influenceurs"
    ],
    "prefer": [
      "digital"
    ]
  },
  "creative": {
    "sports_focus": [
      "padel",
      "hockey",
      "basket",
      "running"
    ],
    "audience_activity_min_sessions_per_week": 2
  },
  "internal": {
    "briefing_acceptance_status": "needs_more_info",
    "acceptance_reason": null,
    "action_recommend_publishers": false,
    "internal_publisher_recommendation": null,
    "internal_notes": "If accepted, prepare internal publisher short-list aligned with digital-only constraint; avoid native and influencer formats; anchor around sports audience."
  },
  "supplemental": {
    "other_fields": [
      {
        "label": "Example additional question not in schema",
        "value": "Example answer"
      }
    ],
    "source_field_map": [
      {
        "label": "RESPONSABLE COMMERCIAL(E)",
        "json_pointer": "/contact/responsable_commercial"
      }
    ]
  }
}
```

---

## Appendix A — Local JSON Checker (copy/paste)
> Optional helper for humans. **Do not echo or run this in Claude.**  
> Save the following into `claude_output_checker.py` and run:  
> `python claude_output_checker.py --input output.json --report report.json`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
claude_output_checker.py
Validate Claude's JSON output for marketing-brief extraction against a strict schema and business rules.
Usage:
  python claude_output_checker.py --input OUTPUT.json [--report report.json]
Exit codes:
  0 = valid (no errors; warnings may be present)
  1 = invalid (errors found)
"""

import json, re, sys, argparse
from datetime import datetime

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RANGE_RE = re.compile(r"^\d+-\d+$")

ALLOWED_OBJECTIVES = {"awareness","consideration","activation_conversion"}
ALLOWED_URGENCY = {"faible","moyen","eleve"}
ALLOWED_STATUS = {"accepted","rejected","needs_more_info"}

# Allowed keys per object (additionalProperties = False behavior)
KEYS = {
    "root": {"meta","contact","advertiser","brief","constraints","creative","internal","supplemental"},
    "meta": {"source_file","extraction_ts"},
    "contact": {"responsable_commercial","agence_media"},
    "advertiser": {"group_or_annonceur","brand_or_product"},
    "brief": {
        "type","urgency","typologie_annonceur","presentation_languages","attachments_present",
        "target_persona","objectives","start_momentum_reason","end_date","key_messages",
        "media_specific_preferences","history_with_rossel","other_campaigns_with_rossel","notes"
    },
    "constraints": {
        "min_budget_create_eur","budget_confirmed_eur_range","proposal_deadline",
        "lead_time_business_days_after_valid_brief","do_not","prefer"
    },
    "creative": {"sports_focus","audience_activity_min_sessions_per_week"},
    "internal": {
        "briefing_acceptance_status","acceptance_reason","action_recommend_publishers",
        "internal_publisher_recommendation","internal_notes"
    },
    "supplemental": {"other_fields","source_field_map"},
    # items
    "other_fields_item": {"label","value"},
    "source_field_map_item": {"label","json_pointer"},
}

def is_date(s):
    if s is None: return True
    if not isinstance(s, str): return False
    if not DATE_RE.match(s): return False
    try:
        datetime.strptime(s, "%Y-%m-%d")
        return True
    except ValueError:
        return False

def is_range(s):
    if s is None: return True
    if not isinstance(s, str): return False
    if not RANGE_RE.match(s): return False
    low, high = map(int, s.split("-"))
    return low <= high

def ensure_keys(obj, allowed, path, errors):
    extra = set(obj.keys()) - allowed
    if extra:
        errors.append(f"{path}: unexpected keys {sorted(extra)}")
    missing = set()  # root doesn't strictly require all keys here (some may be optional); handled elsewhere if needed
    return

def check_lowercase_list(lst, path, errors):
    if lst is None:
        return
    if not isinstance(lst, list):
        errors.append(f"{path}: expected array or null")
        return
    for i, v in enumerate(lst):
        if not isinstance(v, str):
            errors.append(f"{path}[{i}]: expected string, got {type(v).__name__}")
        elif v != v.lower():
            errors.append(f"{path}[{i}]: must be lowercase tag (got '{v}')")

def check():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Path to Claude JSON output")
    ap.add_argument("--report", default=None, help="Optional path to write a JSON report")
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print("INVALID ❌  Not valid JSON:", e, file=sys.stderr)
            sys.exit(1)

    errors = []
    warnings = []

    # root
    if not isinstance(data, dict):
        print("INVALID ❌  Top-level must be an object.", file=sys.stderr)
        sys.exit(1)
    ensure_keys(data, KEYS["root"], "root", errors)

    # meta
    meta = data.get("meta")
    if not isinstance(meta, dict):
        errors.append("meta: must be object")
    else:
        ensure_keys(meta, KEYS["meta"], "meta", errors)
        if not isinstance(meta.get("source_file"), str):
            errors.append("meta.source_file: must be string")
        if not isinstance(meta.get("extraction_ts"), str) or not is_date(meta.get("extraction_ts")):
            errors.append("meta.extraction_ts: must be YYYY-MM-DD string")

    # contact
    contact = data.get("contact")
    if not isinstance(contact, dict):
        errors.append("contact: must be object")
    else:
        ensure_keys(contact, KEYS["contact"], "contact", errors)
        for k in ("responsable_commercial","agence_media"):
            v = contact.get(k)
            if not (v is None or isinstance(v, str)):
                errors.append(f"contact.{k}: must be string or null")

    # advertiser
    advertiser = data.get("advertiser")
    if not isinstance(advertiser, dict):
        errors.append("advertiser: must be object")
    else:
        ensure_keys(advertiser, KEYS["advertiser"], "advertiser", errors)
        for k in ("group_or_annonceur","brand_or_product"):
            v = advertiser.get(k)
            if not (v is None or isinstance(v, str)):
                errors.append(f"advertiser.{k}: must be string or null")

    # brief
    brief = data.get("brief")
    if not isinstance(brief, dict):
        errors.append("brief: must be object")
    else:
        ensure_keys(brief, KEYS["brief"], "brief", errors)
        if not (brief.get("type") is None or isinstance(brief.get("type"), str)):
            errors.append("brief.type: must be string or null")
        v = brief.get("urgency")
        if not (v is None or (isinstance(v, str) and v in ALLOWED_URGENCY)):
            errors.append("brief.urgency: must be 'faible'|'moyen'|'eleve' or null")
        for k in ("typologie_annonceur","target_persona","start_momentum_reason","key_messages","history_with_rossel","other_campaigns_with_rossel","notes"):
            val = brief.get(k)
            if not (val is None or isinstance(val, str)):
                errors.append(f"brief.{k}: must be string or null")
        # arrays
        pl = brief.get("presentation_languages")
        if not (pl is None or (isinstance(pl, list) and all(isinstance(x, str) for x in pl))):
            errors.append("brief.presentation_languages: must be array of strings or null")
        msp = brief.get("media_specific_preferences")
        if not (msp is None or (isinstance(msp, list) and all(isinstance(x, str) for x in msp))):
            errors.append("brief.media_specific_preferences: must be array of strings or null")
        obj = brief.get("objectives")
        if not (obj is None or (isinstance(obj, list) and all(isinstance(x, str) and x in ALLOWED_OBJECTIVES for x in obj))):
            errors.append("brief.objectives: must be array of allowed strings or null")
        # booleans
        ap = brief.get("attachments_present")
        if not (ap is None or isinstance(ap, bool)):
            errors.append("brief.attachments_present: must be boolean or null")
        # dates
        if not is_date(brief.get("end_date")):
            errors.append("brief.end_date: must be YYYY-MM-DD or null")

    # constraints
    cst = data.get("constraints")
    if not isinstance(cst, dict):
        errors.append("constraints: must be object")
    else:
        ensure_keys(cst, KEYS["constraints"], "constraints", errors)
        if not (isinstance(cst.get("min_budget_create_eur"), (int,float))):
            errors.append("constraints.min_budget_create_eur: must be number")
        if not (cst.get("lead_time_business_days_after_valid_brief") is not None and isinstance(cst.get("lead_time_business_days_after_valid_brief"), (int,float))):
            errors.append("constraints.lead_time_business_days_after_valid_brief: must be number")
        if not is_date(cst.get("proposal_deadline")):
            errors.append("constraints.proposal_deadline: must be YYYY-MM-DD or null")
        bcr = cst.get("budget_confirmed_eur_range")
        if not is_range(bcr):
            errors.append("constraints.budget_confirmed_eur_range: must be 'low-high' or null")
        # lowercase tags
        check_lowercase_list(cst.get("do_not"), "constraints.do_not", errors)
        check_lowercase_list(cst.get("prefer"), "constraints.prefer", errors)

    # creative
    cr = data.get("creative")
    if not isinstance(cr, dict):
        errors.append("creative: must be object")
    else:
        ensure_keys(cr, KEYS["creative"], "creative", errors)
        sf = cr.get("sports_focus")
        if not (sf is None or (isinstance(sf, list) and all(isinstance(x, str) for x in sf))):
            errors.append("creative.sports_focus: must be array of strings or null")
        a = cr.get("audience_activity_min_sessions_per_week")
        if not (a is None or isinstance(a, (int,float))):
            errors.append("creative.audience_activity_min_sessions_per_week: must be number or null")

    # internal
    it = data.get("internal")
    if not isinstance(it, dict):
        errors.append("internal: must be object")
    else:
        ensure_keys(it, KEYS["internal"], "internal", errors)
        s = it.get("briefing_acceptance_status")
        if not (isinstance(s, str) and s in ALLOWED_STATUS):
            errors.append("internal.briefing_acceptance_status: must be 'accepted'|'rejected'|'needs_more_info'")
        if not (it.get("acceptance_reason") is None or isinstance(it.get("acceptance_reason"), str)):
            errors.append("internal.acceptance_reason: must be string or null")
        arp = it.get("action_recommend_publishers")
        if not isinstance(arp, bool):
            errors.append("internal.action_recommend_publishers: must be boolean")
        ipr = it.get("internal_publisher_recommendation")
        if not (ipr is None or (isinstance(ipr, list) and all(isinstance(x, str) for x in ipr))):
            errors.append("internal.internal_publisher_recommendation: must be array of strings or null")
        if not (it.get("internal_notes") is None or isinstance(it.get("internal_notes"), str)):
            errors.append("internal.internal_notes: must be string or null")
        # business rules
        if s == "accepted" and arp is False:
            warnings.append("internal: status is 'accepted' but action_recommend_publishers is false (consider setting true)")
        if s != "accepted" and arp is True:
            warnings.append("internal: action_recommend_publishers is true but status is not 'accepted'")

    # supplemental
    sup = data.get("supplemental")
    if not isinstance(sup, dict):
        errors.append("supplemental: must be object")
    else:
        ensure_keys(sup, KEYS["supplemental"], "supplemental", errors)
        of = sup.get("other_fields")
        if not (of is None or isinstance(of, list)):
            errors.append("supplemental.other_fields: must be array or null")
        elif isinstance(of, list):
            for idx, item in enumerate(of):
                if not isinstance(item, dict):
                    errors.append(f"supplemental.other_fields[{idx}]: must be object")
                    continue
                ensure_keys(item, KEYS["other_fields_item"], f"supplemental.other_fields[{idx}]", errors)
                if not isinstance(item.get("label"), str):
                    errors.append(f"supplemental.other_fields[{idx}].label: must be string")
                if not isinstance(item.get("value"), str):
                    errors.append(f"supplemental.other_fields[{idx}].value: must be string")
        sfm = sup.get("source_field_map")
        if not (sfm is None or isinstance(sfm, list)):
            errors.append("supplemental.source_field_map: must be array or null")
        elif isinstance(sfm, list):
            for idx, item in enumerate(sfm):
                if not isinstance(item, dict):
                    errors.append(f"supplemental.source_field_map[{idx}]: must be object")
                    continue
                ensure_keys(item, KEYS["source_field_map_item"], f"supplemental.source_field_map[{idx}]", errors)
                if not isinstance(item.get("label"), str):
                    errors.append(f"supplemental.source_field_map[{idx}].label: must be string")
                if not isinstance(item.get("json_pointer"), str):
                    errors.append(f"supplemental.source_field_map[{idx}].json_pointer: must be string")

    report = {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

    if args.report:
        with open(args.report, "w", encoding="utf-8") as rf:
            json.dump(report, rf, ensure_ascii=False, indent=2)

    if report["valid"]:
        print("VALID ✅  No schema errors detected.")
        if warnings:
            print("Warnings:")
            for w in warnings:
                print(" -", w)
        sys.exit(0)
    else:
        print("INVALID ❌  Errors:", file=sys.stderr)
        for e in errors:
            print(" -", e, file=sys.stderr)
        if warnings:
            print("Warnings:", file=sys.stderr)
            for w in warnings:
                print(" -", w, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    check()

```