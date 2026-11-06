import { RDFTriple } from './ontology';
import { parseTurtleTriples, getRawTurtle } from './turtle';

export interface SparqlBindingValue {
  type: 'uri' | 'literal';
  value: string;
  datatype?: string;
}

export type SparqlRow = Record<string, SparqlBindingValue>;

export interface SparqlQueryResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: SparqlRow[];
  };
  executionTimeMs: number;
  rowCount: number;
  rawQuery: string;
}

/**
 * Standard Clinical Preset SPARQL Queries for Doctor Portal
 */
export const CLINICAL_SPARQL_PRESETS = [
  {
    id: 'patient_physical_history',
    name: 'Longitudinal Physical Visits & Clinical Notes',
    description: 'Retrieve all historical physical visits, physical exam findings, and Doppler results for Patient #9281a8b2',
    query: `PREFIX vigor: <http://vigor.ai/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?encounter ?date ?facility ?examNotes ?prescription
WHERE {
  vigor:Patient_9281a8b2 vigor:hasEncounter ?encounter .
  ?encounter vigor:encounterDate ?date ;
             vigor:facilityLocation ?facility ;
             vigor:physicalExamNotes ?examNotes .
  OPTIONAL { ?encounter vigor:hasPrescription ?rx . ?rx vigor:medication ?prescription }
}`,
  },
  {
    id: 'dr_ali_patients',
    name: 'Dr. Ali Khan Clinical Encounters',
    description: 'Query all physical visit encounters and clinical decisions overseen by Dr. Ali Khan',
    query: `PREFIX vigor: <http://vigor.ai/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?patient ?encounter ?date ?examNotes
WHERE {
  ?patient vigor:hasEncounter ?encounter .
  ?encounter vigor:consultantDoctor vigor:Doctor_Ali ;
             vigor:encounterDate ?date ;
             vigor:physicalExamNotes ?examNotes .
}`,
  },
  {
    id: 'varicocele_doppler',
    name: 'Scrotal Doppler Ultrasound & Varicocele Diagnoses',
    description: 'Find all Doppler imaging findings with retrograde reflux and varicocele grading',
    query: `PREFIX vigor: <http://vigor.ai/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?encounter ?imaging ?findings ?radiologist
WHERE {
  ?encounter vigor:hasObservation ?imaging .
  ?imaging vigor:findings ?findings ;
           vigor:radiologist ?radiologist .
}`,
  },
  {
    id: 'who2021_biomarker_progression',
    name: 'WHO 2021 Semen Analysis Progression',
    description: 'Compare baseline and follow-up sperm concentration and progressive motility',
    query: `PREFIX vigor: <http://vigor.ai/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?observation ?spermCount ?progressiveMotility ?normalForms ?acuity
WHERE {
  ?encounter vigor:hasObservation ?observation .
  ?observation vigor:spermCount ?spermCount ;
               vigor:progressiveMotility ?progressiveMotility ;
               vigor:normalForms ?normalForms ;
               vigor:whoAcuity ?acuity .
}`,
  },
  {
    id: 'active_prescriptions',
    name: 'Active Medication & Surgical Referral Orders',
    description: 'List all active prescriptions and surgical interventions ordered by practitioners',
    query: `PREFIX vigor: <http://vigor.ai/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?rx ?medication ?prescribedBy ?status
WHERE {
  ?rx a vigor:Prescription ;
      vigor:medication ?medication ;
      vigor:prescribedBy ?prescribedBy ;
      vigor:status ?status .
}`,
  },
];

/**
 * Helper to parse a block of triple patterns (handling semicolons and dots)
 */
function parsePatternBlock(content: string, isOptional: boolean = false): { s: string; p: string; o: string; isOptional?: boolean }[] {
  const patterns: { s: string; p: string; o: string; isOptional?: boolean }[] = [];
  // Split on dots that end statements
  const statements = content
    .split(/\.\s+|\.\n|\.$/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('PREFIX') && !s.startsWith('#'));

  for (const stmt of statements) {
    if (stmt.includes(';')) {
      const parts = stmt.split(';').map((p) => p.trim()).filter(Boolean);
      let subject = '';
      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        const tokens = seg.split(/\s+/);
        if (i === 0) {
          subject = tokens[0];
          const p = tokens[1] === 'a' ? 'rdf:type' : tokens[1];
          const o = tokens.slice(2).join(' ');
          if (subject && p && o) patterns.push({ s: subject, p, o, isOptional });
        } else {
          const p = tokens[0] === 'a' ? 'rdf:type' : tokens[0];
          const o = tokens.slice(1).join(' ');
          if (subject && p && o) patterns.push({ s: subject, p, o, isOptional });
        }
      }
    } else {
      const tokens = stmt.split(/\s+/);
      if (tokens.length >= 3) {
        const s = tokens[0];
        const p = tokens[1] === 'a' ? 'rdf:type' : tokens[1];
        const o = tokens.slice(2).join(' ');
        patterns.push({ s, p, o, isOptional });
      }
    }
  }

  return patterns;
}

/**
 * Lightweight deterministic SPARQL 1.1 query engine
 * Executes SELECT ... WHERE { ... } pattern queries on in-memory Turtle RDF triples
 */
export function executeSparql(sparqlQuery: string, customTurtle?: string): SparqlQueryResult {
  const startTime = performance.now();
  const turtle = customTurtle || getRawTurtle();
  const triples = parseTurtleTriples(turtle);

  // 1. Extract SELECT variables
  const selectMatch = sparqlQuery.match(/SELECT\s+(DISTINCT\s+)?([\?a-zA-Z0-9_\s]+)\s+WHERE/i);
  let vars: string[] = [];
  if (selectMatch && selectMatch[2]) {
    vars = selectMatch[2]
      .split(/\s+/)
      .map((v) => v.trim().replace(/^\?/, ''))
      .filter((v) => v.length > 0 && v !== '*');
  }

  // 2. Extract WHERE block
  const whereMatch = sparqlQuery.match(/WHERE\s*\{([\s\S]*)\}/i);
  if (!whereMatch) {
    return {
      head: { vars },
      results: { bindings: [] },
      executionTimeMs: performance.now() - startTime,
      rowCount: 0,
      rawQuery: sparqlQuery,
    };
  }

  const whereContent = whereMatch[1];

  // Separate OPTIONAL blocks if any
  const optionalBlocks: string[] = [];
  const cleanWhere = whereContent.replace(/OPTIONAL\s*\{([^}]+)\}/gi, (_, inner) => {
    optionalBlocks.push(inner.trim());
    return '';
  });

  // Extract mandatory patterns
  const patterns = parsePatternBlock(cleanWhere, false);

  // Extract optional patterns
  const optionalPatterns: { s: string; p: string; o: string; isOptional?: boolean }[] = [];
  for (const block of optionalBlocks) {
    optionalPatterns.push(...parsePatternBlock(block, true));
  }

  // Match triples iteratively and join bindings
  let currentBindings: SparqlRow[] = [{}];

  function matchValue(patternVal: string, tripleVal: string, binding: SparqlRow): { match: boolean; newBinding: SparqlRow } {
    if (patternVal.startsWith('?')) {
      const varName = patternVal.slice(1);
      if (binding[varName]) {
        // Variable already bound, check equality
        const existing = binding[varName].value.replace(/^"|"$/g, '').toLowerCase();
        const incoming = tripleVal.replace(/^"|"$/g, '').toLowerCase();
        return { match: existing === incoming, newBinding: binding };
      } else {
        // Bind new variable
        const isUri = tripleVal.startsWith('vigor:') || tripleVal.startsWith('http://') || tripleVal.startsWith('snomed:') || tripleVal.startsWith('doh:');
        const cleanVal = tripleVal.replace(/[\^]+xsd:[a-zA-Z0-9]+$/, '').replace(/^"|"$/g, '');
        return {
          match: true,
          newBinding: {
            ...binding,
            [varName]: {
              type: isUri ? 'uri' : 'literal',
              value: cleanVal,
            },
          },
        };
      }
    } else {
      // Literal or URI match
      const pClean = patternVal.replace(/[<>]/g, '').toLowerCase();
      const tClean = tripleVal.replace(/[<>]/g, '').replace(/^"|"$/g, '').toLowerCase();
      return { match: pClean === tClean || tClean.includes(pClean), newBinding: binding };
    }
  }

  // Process mandatory patterns
  for (const pat of patterns) {
    const nextBindings: SparqlRow[] = [];

    for (const b of currentBindings) {
      for (const t of triples) {
        const sMatch = matchValue(pat.s, t.subject, b);
        if (!sMatch.match) continue;

        const pMatch = matchValue(pat.p, t.predicate, sMatch.newBinding);
        if (!pMatch.match) continue;

        const oMatch = matchValue(pat.o, t.object, pMatch.newBinding);
        if (oMatch.match) {
          nextBindings.push(oMatch.newBinding);
        }
      }
    }

    currentBindings = nextBindings;
    if (currentBindings.length === 0) break;
  }

  // Process optional patterns
  if (optionalPatterns.length > 0 && currentBindings.length > 0) {
    currentBindings = currentBindings.map((b) => {
      let updatedBinding = { ...b };
      for (const opt of optionalPatterns) {
        for (const t of triples) {
          const sMatch = matchValue(opt.s, t.subject, updatedBinding);
          if (!sMatch.match) continue;
          const pMatch = matchValue(opt.p, t.predicate, sMatch.newBinding);
          if (!pMatch.match) continue;
          const oMatch = matchValue(opt.o, t.object, pMatch.newBinding);
          if (oMatch.match) {
            updatedBinding = oMatch.newBinding;
            break;
          }
        }
      }
      return updatedBinding;
    });
  }

  // Deduplicate and filter variables to only SELECT vars if provided
  const seen = new Set<string>();
  const uniqueBindings: SparqlRow[] = [];

  for (const b of currentBindings) {
    // If specific vars requested in SELECT, only keep those
    const row: SparqlRow = {};
    if (vars.length > 0) {
      for (const v of vars) {
        if (b[v]) {
          row[v] = b[v];
        }
      }
    } else {
      Object.assign(row, b);
    }

    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueBindings.push(row);
    }
  }

  // If vars was empty or select *, deduce from keys
  if (vars.length === 0 && uniqueBindings.length > 0) {
    vars = Array.from(new Set(uniqueBindings.flatMap((b) => Object.keys(b))));
  }

  const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

  return {
    head: { vars },
    results: { bindings: uniqueBindings },
    executionTimeMs,
    rowCount: uniqueBindings.length,
    rawQuery: sparqlQuery,
  };
}
