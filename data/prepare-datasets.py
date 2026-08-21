#!/usr/bin/env python3
"""
One-time data-prep script — run once to produce data/ipc-facts.json and
data/laws-index.json from the raw Kaggle CSVs. Not run by the live server;
server.js just loads the resulting JSON files at startup.
"""
import csv
import json
import re

# ── 1. IPC sections: real content, cleaned and reframed with the BNS-2023 caveat ──
with open("ipc_sections.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

ipc_facts = []
seen_sections = set()
def is_missing(v):
    v = (v or "").strip().lower()
    return v == "" or v in ("nan", "none", "n/a", "null")

for r in rows:
    section = (r.get("Section") or "").strip()
    offense = (r.get("Offense") or "").strip()
    punishment = (r.get("Punishment") or "").strip()
    description = (r.get("Description") or "").strip()
    if not section or section in seen_sections:
        continue
    # Skip rows with genuinely missing data rather than presenting "nan" as a fact.
    if is_missing(offense) or is_missing(punishment) or is_missing(description):
        continue
    seen_sections.add(section)

    # Strip the redundant "Description of IPC Section X\nAccording to section X of..." boilerplate
    # since Section/Offense are already separate fields — keep just the substantive part.
    description = re.sub(r"^Description of IPC Section \S+\s*", "", description)
    description = re.sub(r"^According to section \S+ of Indian penal code,?\s*", "", description, flags=re.IGNORECASE)
    description = description.strip()

    sec_num = section.replace("IPC_", "")
    ipc_facts.append({
        "section": f"IPC Section {sec_num}",
        "offense": offense,
        "punishment": punishment,
        "detail": description,
        # This exact caveat gets shown to the AI every time this entry is used —
        # so it never presents an old-code section as if it were current law.
        "note": "This is from the Indian Penal Code (IPC), which was replaced by the Bharatiya Nyaya Sanhita (BNS) 2023 on 1 July 2024. Cite it as historical/reference context — mention that the current law is the BNS, and that the exact new section number should be confirmed rather than guessed.",
        # A simple lowercase search blob used for keyword matching at request time.
    "_search": offense.lower(),
    })

with open("ipc-facts.json", "w", encoding="utf-8") as f:
    json.dump(ipc_facts, f, ensure_ascii=False)

print(f"ipc-facts.json: {len(ipc_facts)} entries")

# ── 2. Laws & Acts index: titles + links only (no real content) — used purely as an
#    optional "further reading" pointer, never as a fact to ground an answer. ──
with open("indian_laws_and_acts_v2.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

laws_index = []
seen_titles = set()
for r in rows:
    title = (r.get("title") or "").strip()
    url = (r.get("url") or "").strip()
    if not title or not url or title in seen_titles:
        continue
    seen_titles.add(title)
    laws_index.append({"title": title, "url": url, "_search": title.lower()})

with open("laws-index.json", "w", encoding="utf-8") as f:
    json.dump(laws_index, f, ensure_ascii=False)

print(f"laws-index.json: {len(laws_index)} entries")
