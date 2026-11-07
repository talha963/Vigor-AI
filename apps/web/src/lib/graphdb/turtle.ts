import { RDFTriple, PatientGraphData, GraphNode, GraphEdge, NAMESPACES, PREFIX_DECLARATIONS } from './ontology';

/**
 * Global In-Memory & Persisted RDF Knowledge Graph
 * Serialized in W3C Turtle (.ttl) format
 */
const INITIAL_TURTLE_DATA = `
${PREFIX_DECLARATIONS}

# -------------------------------------------------------------
# Practitioners
# -------------------------------------------------------------
vigor:Doctor_Ali a vigor:Practitioner ;
    rdfs:label "Dr. Ali Khan" ;
    vigor:title "Consultant Andrologist & Male Infertility Microsurgeon" ;
    vigor:dohLicense "DOH-AUH-2024-9102" ;
    vigor:facility vigor:Facility_CCAD .

vigor:Doctor_Ziad a vigor:Practitioner ;
    rdfs:label "Dr. Ziad Al-Khafaji" ;
    vigor:title "Senior Specialist Urological Microsurgeon" ;
    vigor:dohLicense "DOH-AUH-2015-8821" ;
    vigor:facility vigor:Facility_CCAD .

# -------------------------------------------------------------
# Facilities
# -------------------------------------------------------------
vigor:Facility_CCAD a vigor:Facility ;
    rdfs:label "Cleveland Clinic Abu Dhabi" ;
    vigor:location "Al Maryah Island, Abu Dhabi" .

vigor:Facility_SSMC a vigor:Facility ;
    rdfs:label "Sheikh Shakhbout Medical City" ;
    vigor:location "Al Mafraq, Abu Dhabi" .

# -------------------------------------------------------------
# Patient 1: psd_9281a8b2 (Physical Visit Follow-up with Dr. Ali)
# -------------------------------------------------------------
vigor:Patient_9281a8b2 a vigor:Patient ;
    rdfs:label "Patient #9281a8b2" ;
    vigor:pseudonymId "psd_9281a8b2" ;
    vigor:age 34 ;
    vigor:bloodGroup "O+" ;
    vigor:emiratesId "784-1990-8819201-1" ;
    vigor:hasEncounter vigor:Encounter_PV_01, vigor:Encounter_PV_02 ;
    vigor:hasCondition vigor:Condition_Astheno, vigor:Condition_Varicocele ;
    vigor:hasConsentReceipt "sha256:7c9e821b...sovereign" .

# Physical Visit 1 (6 Months Ago - Diagnostic Workup)
vigor:Encounter_PV_01 a vigor:Encounter, vigor:PhysicalVisit ;
    rdfs:label "Initial Physical Consultation & Semen Analysis" ;
    vigor:encounterDate "2026-05-14T09:30:00Z"^^xsd:dateTime ;
    vigor:visitType "IN_PERSON_PHYSICAL" ;
    vigor:consultantDoctor vigor:Doctor_Ali ;
    vigor:facilityLocation vigor:Facility_CCAD ;
    vigor:physicalExamNotes "Left spermatic cord palpable dilated veins standing. Valsalva positive Grade II. Right testis 16ml, Left testis 14ml." ;
    vigor:hasObservation vigor:Obs_Biomarker_01, vigor:Obs_Ultrasound_01 ;
    vigor:hasDiagnosis vigor:Condition_Varicocele, vigor:Condition_Astheno ;
    vigor:hasPrescription vigor:Rx_01 .

# Physical Visit 2 (Recent Physical Review)
vigor:Encounter_PV_02 a vigor:Encounter, vigor:PhysicalVisit ;
    rdfs:label "Longitudinal Physical Follow-Up & CASA Repeat" ;
    vigor:encounterDate "2026-11-04T10:15:00Z"^^xsd:dateTime ;
    vigor:visitType "IN_PERSON_PHYSICAL" ;
    vigor:consultantDoctor vigor:Doctor_Ali ;
    vigor:facilityLocation vigor:Facility_CCAD ;
    vigor:physicalExamNotes "Bilateral testicular palpation: non-tender. Persistent Grade II varicocele left hemiscrotum. Semen viscosity normal." ;
    vigor:hasObservation vigor:Obs_Biomarker_02 ;
    vigor:hasPrescription vigor:Rx_02 .

# Biomarkers & WHO 2021 Semen Analysis Observations
vigor:Obs_Biomarker_01 a vigor:BiomarkerObservation ;
    rdfs:label "Baseline CASA Semen Analysis" ;
    vigor:spermCount "14.0"^^xsd:decimal ;
    vigor:progressiveMotility "16.8"^^xsd:decimal ;
    vigor:normalForms "3.0"^^xsd:decimal ;
    vigor:whoAcuity "FLAGGED_SUBREFERENCE" .

vigor:Obs_Biomarker_02 a vigor:BiomarkerObservation ;
    rdfs:label "Repeat 6-Month CASA Follow-Up" ;
    vigor:spermCount "18.5"^^xsd:decimal ;
    vigor:progressiveMotility "22.4"^^xsd:decimal ;
    vigor:normalForms "3.5"^^xsd:decimal ;
    vigor:whoAcuity "PARTIAL_RECOVERY" .

# Scrotal Doppler Ultrasound
vigor:Obs_Ultrasound_01 a vigor:DiagnosticImaging ;
    rdfs:label "Bilateral High-Resolution Scrotal Color Doppler" ;
    vigor:imagingDate "2026-05-16T11:00:00Z"^^xsd:dateTime ;
    vigor:findings "Left pampiniform venous plexus diameter 3.4mm with retrograde venous reflux > 2.5s on Valsalva. Varicocele Grade II." ;
    vigor:radiologist "Dr. Mansour Al-Nuaimi (CCAD Radiology)" .

# Conditions
vigor:Condition_Varicocele a vigor:Condition ;
    rdfs:label "Clinical Left Varicocele (Grade II)" ;
    snomed:id "363046001" .

vigor:Condition_Astheno a vigor:Condition ;
    rdfs:label "Asthenozoospermia (WHO 2021 6th Ed)" ;
    snomed:id "236836009" .

# Prescriptions & Treatment
vigor:Rx_01 a vigor:Prescription ;
    rdfs:label "Antioxidant & Microcirculatory Support Protocol" ;
    vigor:medication "L-Carnitine 2000mg + CoQ10 200mg + Zinc 25mg Daily" ;
    vigor:prescribedBy vigor:Doctor_Ali ;
    vigor:status "COMPLETED" .

vigor:Rx_02 a vigor:Prescription ;
    rdfs:label "Microsurgical Varicocelectomy Referral" ;
    vigor:medication "Subinguinal Microsurgical Repair Consultation at CCAD" ;
    vigor:prescribedBy vigor:Doctor_Ali ;
    vigor:status "ACTIVE" .

# -------------------------------------------------------------
# Patient 2: psd_4402bbdd (Physical Consultation for Varicocele)
# -------------------------------------------------------------
vigor:Patient_4402bbdd a vigor:Patient ;
    rdfs:label "Patient #4402bbdd (Rashid Al-Nuaimi)" ;
    vigor:pseudonymId "psd_4402bbdd" ;
    vigor:age 31 ;
    vigor:bloodGroup "A+" ;
    vigor:emiratesId "784-1995-1029481-2" ;
    vigor:hasEncounter vigor:Encounter_PV_03 ;
    vigor:hasCondition vigor:Condition_Oligo ;
    vigor:hasConsentReceipt "sha256:4a02bc71...sovereign" .

vigor:Encounter_PV_03 a vigor:Encounter, vigor:PhysicalVisit ;
    rdfs:label "Outpatient Physical Exam & Fertility Assessment" ;
    vigor:encounterDate "2026-10-28T11:00:00Z"^^xsd:dateTime ;
    vigor:visitType "IN_PERSON_PHYSICAL" ;
    vigor:consultantDoctor vigor:Doctor_Ali ;
    vigor:facilityLocation vigor:Facility_CCAD ;
    vigor:physicalExamNotes "Epididymides soft, non-tender. Bilateral vasa deferentia palpated and intact. No groin hernia." ;
    vigor:hasObservation vigor:Obs_Biomarker_03 ;
    vigor:hasPrescription vigor:Rx_03 .

vigor:Obs_Biomarker_03 a vigor:BiomarkerObservation ;
    rdfs:label "Initial Semen Analysis" ;
    vigor:spermCount "24.5"^^xsd:decimal ;
    vigor:progressiveMotility "22.0"^^xsd:decimal ;
    vigor:normalForms "3.0"^^xsd:decimal ;
    vigor:whoAcuity "BORDERLINE_SUBREFERENCE" .

vigor:Condition_Oligo a vigor:Condition ;
    rdfs:label "Mild Oligoasthenozoospermia" ;
    snomed:id "236835008" .

vigor:Rx_03 a vigor:Prescription ;
    rdfs:label "Empirical Antioxidant Therapy & Lifestyle Protocol" ;
    vigor:medication "L-Carnitine 1000mg BID + Selenium 200mcg + Lycopene 10mg" ;
    vigor:prescribedBy vigor:Doctor_Ali ;
    vigor:status "ACTIVE" .

# -------------------------------------------------------------
# Patient 3: psd_8831ccaa (Urgent Physical Emergency Encounter)
# -------------------------------------------------------------
vigor:Patient_8831ccaa a vigor:Patient ;
    rdfs:label "Patient #8831ccaa" ;
    vigor:pseudonymId "psd_8831ccaa" ;
    vigor:age 22 ;
    vigor:hasEncounter vigor:Encounter_ED_01 ;
    vigor:hasCondition vigor:Condition_Torsion .

vigor:Encounter_ED_01 a vigor:Encounter, vigor:PhysicalVisit ;
    rdfs:label "Urgent ED Scrotal Exploration & Doppler" ;
    vigor:encounterDate "2026-11-06T04:20:00Z"^^xsd:dateTime ;
    vigor:visitType "EMERGENCY_PHYSICAL" ;
    vigor:consultantDoctor vigor:Doctor_Ali ;
    vigor:facilityLocation vigor:Facility_CCAD ;
    vigor:physicalExamNotes "High riding left testis with transverse lie. Severe tenderness, absent cremasteric reflex. Immediate surgical detorsion executed within 4 hours." ;
    vigor:hasDiagnosis vigor:Condition_Torsion .

vigor:Condition_Torsion a vigor:Condition ;
    rdfs:label "Acute Testicular Torsion (GC01 Emergency Gate)" ;
    snomed:id "236814002" .
`;

let currentTurtle = INITIAL_TURTLE_DATA;

/**
 * Returns raw Turtle RDF representation
 */
export function getRawTurtle(): string {
  return currentTurtle;
}

/**
 * Appends new encounter triples to the knowledge graph
 */
export function appendEncounterTurtle(params: {
  patientId: string;
  encounterId: string;
  visitType: string;
  doctorName: string;
  facilityName: string;
  notes: string;
  diagnosis?: string;
  prescription?: string;
  labOrders?: string[];
}): void {
  const encUri = `vigor:Encounter_${params.encounterId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const patUri = `vigor:Patient_${params.patientId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const nowIso = new Date().toISOString();

  const newTriples = `
# Dynamic Clinical Encounter Appended at ${nowIso}
${patUri} vigor:hasEncounter ${encUri} .

${encUri} a vigor:Encounter, vigor:PhysicalVisit ;
    rdfs:label "Clinical Evaluation Encounter (${params.encounterId})" ;
    vigor:encounterDate "${nowIso}"^^xsd:dateTime ;
    vigor:visitType "${params.visitType}" ;
    vigor:consultant "${params.doctorName.replace(/"/g, '\\"')}" ;
    vigor:facilityLocation "${params.facilityName.replace(/"/g, '\\"')}" ;
    vigor:clinicalNotes "${params.notes.replace(/"/g, '\\"')}" ;
    ${params.diagnosis ? `vigor:hasDiagnosis "${params.diagnosis.replace(/"/g, '\\"')}" ;` : ''}
    ${params.prescription ? `vigor:hasPrescription "${params.prescription.replace(/"/g, '\\"')}" ;` : ''}
    vigor:status "CONFIRMED_AUDITED" .
`;

  currentTurtle += `\n${newTriples}`;
}

/**
 * Helper to split comma-separated Turtle objects while preserving quoted strings
 */
function splitTurtleObjects(objStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < objStr.length; i++) {
    const char = objStr[i];
    if ((char === '"' || char === "'") && (i === 0 || objStr[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
    }

    if (char === ',' && !inQuotes) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

/**
 * Parse Turtle into an array of subject-predicate-object triples
 */
export function parseTurtleTriples(turtleText: string = currentTurtle): RDFTriple[] {
  const triples: RDFTriple[] = [];
  const lines = turtleText.split('\n');
  let currentSubject = '';

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('@prefix')) continue;

    const isNewSubject = !rawLine.startsWith(' ') && !rawLine.startsWith('\t');

    if (isNewSubject) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        currentSubject = parts[0];
        const predicate = parts[1] === 'a' ? 'rdf:type' : parts[1];
        const objectWithPunct = parts.slice(2).join(' ');
        const objectRaw = objectWithPunct.replace(/[;,.\s]+$/, '');
        const objList = splitTurtleObjects(objectRaw);
        for (const obj of objList) {
          triples.push({ subject: currentSubject, predicate, object: obj });
        }
      }
    } else if (currentSubject) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const predicate = parts[0] === 'a' ? 'rdf:type' : parts[0];
        const objectWithPunct = parts.slice(1).join(' ');
        const objectRaw = objectWithPunct.replace(/[;,.\s]+$/, '');
        const objList = splitTurtleObjects(objectRaw);
        for (const obj of objList) {
          triples.push({ subject: currentSubject, predicate, object: obj });
        }
      }
    }
  }

  return triples;
}

/**
 * Builds a visual graph (nodes and edges) for a specific patient or overall system
 */
export function buildPatientGraph(patientQuery: string = 'psd_9281a8b2'): PatientGraphData {
  const triples = parseTurtleTriples(currentTurtle);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  const cleanQuery = patientQuery.replace(/^psd_/, '').toLowerCase();

  // Find target patient subject
  let targetSubject = `vigor:Patient_${cleanQuery}`;
  const existingPat = triples.find(
    (t) =>
      t.subject.toLowerCase().includes(cleanQuery) ||
      t.object.toLowerCase().includes(cleanQuery)
  );
  if (existingPat) {
    targetSubject = existingPat.subject.startsWith('vigor:Patient') ? existingPat.subject : targetSubject;
  }

  // Filter triples connected to target patient (1-hop and 2-hop traversal)
  const connectedSubjects = new Set<string>([targetSubject]);
  
  // 1-hop traversal
  for (const t of triples) {
    if (t.subject === targetSubject) {
      if (t.object.startsWith('vigor:')) {
        connectedSubjects.add(t.object);
      }
    }
  }

  // 2-hop traversal
  for (const t of triples) {
    if (connectedSubjects.has(t.subject) && t.object.startsWith('vigor:')) {
      connectedSubjects.add(t.object);
    }
  }

  // Build nodes & edges
  let edgeCounter = 0;
  for (const t of triples) {
    if (connectedSubjects.has(t.subject)) {
      // Add Subject node
      if (!nodeMap.has(t.subject)) {
        const type = t.subject.includes('Patient')
          ? 'Patient'
          : t.subject.includes('Encounter')
          ? 'Encounter'
          : t.subject.includes('Doctor')
          ? 'Doctor'
          : t.subject.includes('Facility')
          ? 'Facility'
          : t.subject.includes('Obs')
          ? 'Biomarker'
          : t.subject.includes('Condition')
          ? 'Condition'
          : t.subject.includes('Rx')
          ? 'Prescription'
          : 'Encounter';

        const label = t.subject.replace('vigor:', '').replace(/_/g, ' ');
        const node: GraphNode = { id: t.subject, label, type };
        nodeMap.set(t.subject, node);
        nodes.push(node);
      }

      // Add Edge and Target Node if object is an entity
      if (t.object.startsWith('vigor:')) {
        if (!nodeMap.has(t.object)) {
          const type = t.object.includes('Doctor')
            ? 'Doctor'
            : t.object.includes('Facility')
            ? 'Facility'
            : t.object.includes('Obs')
            ? 'Biomarker'
            : t.object.includes('Condition')
            ? 'Condition'
            : t.object.includes('Rx')
            ? 'Prescription'
            : t.object.includes('Ultrasound')
            ? 'Ultrasound'
            : 'Encounter';

          const label = t.object.replace('vigor:', '').replace(/_/g, ' ');
          const node: GraphNode = { id: t.object, label, type };
          nodeMap.set(t.object, node);
          nodes.push(node);
        }

        edges.push({
          id: `edge_${++edgeCounter}`,
          source: t.subject,
          target: t.object,
          predicate: t.predicate,
          label: t.predicate.replace('vigor:', '').replace('rdf:', ''),
        });
      }
    }
  }

  return {
    nodes,
    edges,
    turtle: currentTurtle,
    summary: {
      patientId: targetSubject.replace('vigor:', ''),
      pseudonymId: patientQuery,
      totalEncounters: nodes.filter((n) => n.type === 'Encounter').length || 2,
      lastPhysicalVisit: '2026-11-04 (Cleveland Clinic Abu Dhabi · Dr. Ali Khan)',
      diagnoses: [
        'Asthenozoospermia (WHO 2021 PR: 16.8% → 22.4%)',
        'Clinical Left Varicocele Grade II (Valsalva positive)',
      ],
      who2021Scores: {
        progressiveMotility: '22.4% (Partial Recovery)',
        spermConcentration: '18.5 M/ml (Normal floor)',
        normalForms: '3.5% (Borderline)',
      },
      prescriptions: [
        'L-Carnitine 2000mg + CoQ10 200mg daily (Antioxidant protocol)',
        'Subinguinal Microsurgical Varicocelectomy Referral (CCAD)',
      ],
      physicalExamHighlights: [
        'Testicular Palpation: Right 16ml, Left 14ml (normal consistency)',
        'Valsalva maneuver: Palpable dilated left spermatic cord veins (3.4mm Doppler reflux > 2.5s)',
        'No inguinal hernia or hydrocele identified',
      ],
    },
  };
}
