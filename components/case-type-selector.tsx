"use client";

import { useState } from "react";
import { getLocalizedCaseTypes } from "@/lib/case-types";
import { CaseTypeIcon } from "@/components/case-type-icon";
import type { Locale } from "@/lib/i18n-shared";

type CaseTypeSelectorProps = {
  defaultValue: string;
  locale: Locale;
};

export function CaseTypeSelector({ defaultValue, locale }: CaseTypeSelectorProps) {
  const caseTypes = getLocalizedCaseTypes(locale);
  const en = locale === "en";
  const initial = caseTypes.find((item) => item.slug === defaultValue) ?? caseTypes[0];
  const [selectedSlug, setSelectedSlug] = useState(initial.slug);
  const selected = caseTypes.find((item) => item.slug === selectedSlug) ?? caseTypes[0];

  return (
    <fieldset className="case-type-fieldset">
      <legend className="case-type-legend">{en ? "Which situation applies?" : "Welche Situation trifft zu?"}</legend>
      <div className="case-type-heading">
        <p>{en ? "Choose the closest case type. You can add more details at any time." : "Wähle die passendste Fallart. Die Angaben können später jederzeit ergänzt werden."}</p>
        <span>{en ? "1 of 2" : "1 von 2"}</span>
      </div>

      <div className="case-type-layout">
        <div className="choice-list choice-list-compact">
          {caseTypes.map((item) => (
            <label className="choice-card choice-radio" key={item.slug}>
              <input
                name="type"
                type="radio"
                value={item.slug}
                checked={item.slug === selectedSlug}
                onChange={() => setSelectedSlug(item.slug)}
                required
              />
              <span className="case-icon case-type-card-icon">
                <CaseTypeIcon type={item.dbValue} />
              </span>
              <span className="choice-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className="radio-indicator" aria-hidden="true" />
            </label>
          ))}
        </div>

        <aside className="case-preparation-panel" aria-live="polite">
          <div className="case-preparation-header">
            <span className="case-preparation-icon">
              <CaseTypeIcon type={selected.dbValue} />
            </span>
            <div>
              <span>{en ? "Preparation" : "Vorbereitung"}</span>
              <h2>{selected.title}</h2>
            </div>
          </div>
          <p>{selected.checklistTitle}</p>
          <ul>
            {selected.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <small>{en ? "You can add missing information to the case file later." : "Fehlende Angaben können auch später in der Fallakte ergänzt werden."}</small>
        </aside>
      </div>
    </fieldset>
  );
}
