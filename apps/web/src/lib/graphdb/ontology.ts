/**
 * Vigor Semantic GraphDB - Ontology Definitions
 * Standards-compliant W3C RDF / OWL / SPARQL namespaces
 */

export const NAMESPACES = {
  vigor: 'http://vigor.ai/ontology#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  snomed: 'http://snomed.info/id/',
  loinc: 'http://loinc.org/rdf/',
  doh: 'http://doh.gov.ae/malaffi#',
} as const;

export const PREFIX_DECLARATIONS = `
@prefix vigor: <${NAMESPACES.vigor}> .
@prefix rdf: <${NAMESPACES.rdf}> .
@prefix rdfs: <${NAMESPACES.rdfs}> .
@prefix xsd: <${NAMESPACES.xsd}> .
@prefix owl: <${NAMESPACES.owl}> .
@prefix snomed: <${NAMESPACES.snomed}> .
@prefix loinc: <${NAMESPACES.loinc}> .
@prefix doh: <${NAMESPACES.doh}> .
`.trim();

export interface RDFTriple {
  subject: string;
  predicate: string;
  object: string;
  datatype?: string;
  isLiteral?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Patient' | 'Encounter' | 'Doctor' | 'Facility' | 'Biomarker' | 'Condition' | 'Prescription' | 'Ultrasound';
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  predicate: string;
  label: string;
}

export interface PatientGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  turtle: string;
  summary: {
    patientId: string;
    pseudonymId: string;
    totalEncounters: number;
    lastPhysicalVisit?: string;
    diagnoses: string[];
    who2021Scores: {
      progressiveMotility?: string;
      spermConcentration?: string;
      normalForms?: string;
    };
    prescriptions: string[];
    physicalExamHighlights: string[];
  };
}
