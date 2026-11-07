'use client';

import React, { useState, useEffect } from 'react';
import {
  Network,
  Search,
  Database,
  Code,
  Play,
  RotateCw,
  Copy,
  Check,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  Stethoscope,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CLINICAL_SPARQL_PRESETS, executeSparql, SparqlQueryResult } from '@/lib/graphdb/sparql';
import { buildPatientGraph, getRawTurtle } from '@/lib/graphdb/turtle';
import { PatientGraphData, GraphNode } from '@/lib/graphdb/ontology';

interface GraphDbExplorerProps {
  currentDoctorName?: string;
  bookings?: any[];
  locale?: 'en' | 'ar';
}

export default function GraphDbExplorer({
  currentDoctorName = 'Dr. Ali Khan',
  bookings = [],
  locale = 'en',
}: GraphDbExplorerProps) {
  const isAr = locale === 'ar';

  const patientChips = React.useMemo(() => {
    if (bookings && bookings.length > 0) {
      return bookings.map((b) => {
        const pId = b.pseudonymId || `psd_${(b.bookingId || '').slice(-8)}`;
        const name = b.patientName || b.contact?.name || `Patient #${pId.slice(-6)}`;
        return {
          id: pId,
          label: `${name} (${b.facility?.doctor || currentDoctorName})`,
          tag: b.consultType === 'TELEHEALTH_VIDEO' ? 'Telehealth' : 'Physical Visit',
        };
      });
    }
    return [
      { id: 'psd_9281a8b2', label: 'Patient #9281a8b2 (Varicocele II · Dr. Ali)', tag: 'Physical Visit' },
    ];
  }, [bookings, currentDoctorName]);

  const initialPatientId = patientChips[0]?.id || 'psd_9281a8b2';
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [searchInput, setSearchInput] = useState(initialPatientId);
  const [graphData, setGraphData] = useState<PatientGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (patientChips.length > 0 && !patientChips.some(p => p.id === selectedPatientId)) {
      setSelectedPatientId(patientChips[0].id);
      setSearchInput(patientChips[0].id);
    }
  }, [patientChips, selectedPatientId]);

  // SPARQL State
  const [selectedPresetId, setSelectedPresetId] = useState(CLINICAL_SPARQL_PRESETS[0].id);
  const [sparqlQuery, setSparqlQuery] = useState(CLINICAL_SPARQL_PRESETS[0].query);
  const [sparqlResult, setSparqlResult] = useState<SparqlQueryResult | null>(null);
  const [isRunningSparql, setIsRunningSparql] = useState(false);

  // Turtle Viewer State
  const [turtleExpanded, setTurtleExpanded] = useState(false);
  const [copiedTurtle, setCopiedTurtle] = useState(false);

  // Active Explorer Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'sparql' | 'turtle'>('visual');

  // Load Graph Data on selection
  useEffect(() => {
    try {
      const data = buildPatientGraph(selectedPatientId);
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Error loading patient graph:', err);
    }
  }, [selectedPatientId]);

  // Initial SPARQL run
  useEffect(() => {
    handleRunSparql();
  }, [selectedPresetId]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = CLINICAL_SPARQL_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSparqlQuery(found.query);
      const res = executeSparql(found.query);
      setSparqlResult(res);
    }
  };

  const handleRunSparql = () => {
    setIsRunningSparql(true);
    setTimeout(() => {
      try {
        const res = executeSparql(sparqlQuery);
        setSparqlResult(res);
      } catch (err) {
        console.error('SPARQL execution error:', err);
      } finally {
        setIsRunningSparql(false);
      }
    }, 150);
  };

  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSelectedPatientId(searchInput.trim());
    }
  };

  const handleCopyTurtle = () => {
    navigator.clipboard.writeText(getRawTurtle());
    setCopiedTurtle(true);
    setTimeout(() => setCopiedTurtle(false), 1800);
  };

  // Node color helper
  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'Patient':
        return { bg: 'fill-amber-500', stroke: 'stroke-amber-600', ring: 'border-amber-400', badge: 'bg-amber-100 text-amber-800' };
      case 'Encounter':
        return { bg: 'fill-emerald-600', stroke: 'stroke-emerald-700', ring: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-800' };
      case 'Doctor':
        return { bg: 'fill-stone-800', stroke: 'stroke-stone-900', ring: 'border-stone-500', badge: 'bg-stone-100 text-stone-800' };
      case 'Facility':
        return { bg: 'fill-indigo-600', stroke: 'stroke-indigo-700', ring: 'border-indigo-400', badge: 'bg-indigo-100 text-indigo-800' };
      case 'Biomarker':
        return { bg: 'fill-cyan-600', stroke: 'stroke-cyan-700', ring: 'border-cyan-400', badge: 'bg-cyan-100 text-cyan-800' };
      case 'Ultrasound':
        return { bg: 'fill-purple-600', stroke: 'stroke-purple-700', ring: 'border-purple-400', badge: 'bg-purple-100 text-purple-800' };
      case 'Condition':
        return { bg: 'fill-rose-600', stroke: 'stroke-rose-700', ring: 'border-rose-400', badge: 'bg-rose-100 text-rose-800' };
      case 'Prescription':
        return { bg: 'fill-teal-600', stroke: 'stroke-teal-700', ring: 'border-teal-400', badge: 'bg-teal-100 text-teal-800' };
      default:
        return { bg: 'fill-stone-600', stroke: 'stroke-stone-700', ring: 'border-stone-400', badge: 'bg-stone-100 text-stone-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#1C1A17]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2E2922] via-[#24201A] to-[#181614] dark:from-[#FAF8F5] dark:to-[#E5E0D5] flex items-center justify-center text-[#FAF8F5] dark:text-[#181614] text-xl shadow-xs">
              <Network className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  Physical Visit Semantic GraphDB
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  W3C SPARQL 1.1 & Turtle (.ttl)
                </span>
              </div>
              <p className="text-xs text-[#6B6355] dark:text-stone-400 mt-0.5">
                Search in-person physical consultation history, scrotal Doppler ultrasound findings, and longitudinal WHO 2021 semen analysis trends.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DoH Malaffi Linked</span>
            </span>
          </div>
        </div>

        {/* Patient Search & Quick Chips */}
        <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchPatient} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Patient Pseudonym ID (e.g. psd_9281a8b2) or Emirates ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-900 text-xs text-[#1A1816] dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95 shrink-0"
            >
              Search Graph
            </button>
          </form>

          {/* Patient Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {patientChips.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPatientId(p.id);
                  setSearchInput(p.id);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  selectedPatientId === p.id
                    ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-[#6B6355] dark:text-stone-300 border border-[#E5E0D5] dark:border-stone-700 hover:border-stone-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="pt-2 flex items-center gap-2 border-t border-[#EBE7DF] dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('visual')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'visual'
                ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Knowledge Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sparql')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'sparql'
                ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SPARQL 1.1 Query Engine</span>
            {sparqlResult && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {sparqlResult.rowCount} rows
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('turtle')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'turtle'
                ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>W3C Turtle (.ttl) Inspector</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: INTERACTIVE KNOWLEDGE GRAPH & CLINICAL SUMMARY
          ======================================================== */}
      {activeSubTab === 'visual' && graphData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Graph Canvas (SVG) */}
          <div className="lg:col-span-8 bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DF] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  Patient Topological Graph ({graphData.nodes.length} Nodes · {graphData.edges.length} RDF Triples)
                </span>
              </div>
              <span className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Click any node to inspect properties
              </span>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative w-full h-[460px] bg-[#FAF8F5]/80 dark:bg-stone-900/60 rounded-2xl border border-[#EFECE3] dark:border-stone-800 my-4 overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 760 440">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="20"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#8A8172" opacity="0.6" />
                  </marker>
                </defs>

                {/* Graph Edges */}
                {/* Simulated Topological Layout */}
                <g stroke="#C5BEB2" strokeWidth="1.5" strokeDasharray="3 3">
                  {/* Central Hub to Encounters */}
                  <line x1="380" y1="220" x2="220" y2="120" markerEnd="url(#arrowhead)" />
                  <line x1="380" y1="220" x2="540" y2="120" markerEnd="url(#arrowhead)" />
                  {/* Encounters to Observations & Prescriptions */}
                  <line x1="220" y1="120" x2="100" y2="80" markerEnd="url(#arrowhead)" />
                  <line x1="220" y1="120" x2="140" y2="280" markerEnd="url(#arrowhead)" />
                  <line x1="220" y1="120" x2="260" y2="340" markerEnd="url(#arrowhead)" />
                  <line x1="540" y1="120" x2="660" y2="100" markerEnd="url(#arrowhead)" />
                  <line x1="540" y1="120" x2="620" y2="280" markerEnd="url(#arrowhead)" />
                  <line x1="380" y1="220" x2="380" y2="360" markerEnd="url(#arrowhead)" />
                </g>

                {/* Edge Predicate Labels */}
                <g fontSize="9" fill="#8A8172" textAnchor="middle" fontFamily="monospace">
                  <text x="290" y="160">hasEncounter</text>
                  <text x="470" y="160">hasEncounter</text>
                  <text x="150" y="90">consultantDoctor</text>
                  <text x="170" y="210">hasObservation</text>
                  <text x="230" y="240">hasDiagnosis</text>
                  <text x="610" y="100">facility</text>
                  <text x="590" y="210">hasPrescription</text>
                  <text x="380" y="300">hasCondition</text>
                </g>

                {/* Graph Nodes */}
                {/* 1. Central Patient Node */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: `vigor:Patient_${selectedPatientId}`,
                      label: `Patient #${selectedPatientId}`,
                      type: 'Patient',
                      properties: {
                        pseudonym: selectedPatientId,
                        emiratesId: '784-1990-8819201-1',
                        bloodGroup: 'O+',
                        consentStatus: 'VERIFIED_ACTIVE',
                      },
                    })
                  }
                >
                  <circle cx="380" cy="220" r="32" className="fill-amber-500 stroke-amber-600 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="380" y="218" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                    Patient
                  </text>
                  <text x="380" y="232" textAnchor="middle" fill="#FFFFFF" fontSize="9" opacity="0.9">
                    #{selectedPatientId.slice(-6)}
                  </text>
                </g>

                {/* 2. Physical Encounter 01 Node */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Encounter_PV_01',
                      label: 'Physical Visit 01 (Baseline Workup)',
                      type: 'Encounter',
                      properties: {
                        date: '2026-05-14T09:30:00Z',
                        type: 'IN_PERSON_PHYSICAL',
                        doctor: 'Dr. Ali Khan',
                        facility: 'Cleveland Clinic Abu Dhabi',
                        notes: 'Left spermatic cord palpable dilated veins standing. Valsalva positive Grade II. Right testis 16ml, Left testis 14ml.',
                      },
                    })
                  }
                >
                  <circle cx="220" cy="120" r="26" className="fill-emerald-600 stroke-emerald-700 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="220" y="122" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                    PV-01
                  </text>
                  <text x="220" y="133" textAnchor="middle" fill="#A7F3D0" fontSize="8">
                    Physical Visit
                  </text>
                </g>

                {/* 3. Physical Encounter 02 Node */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Encounter_PV_02',
                      label: 'Physical Visit 02 (Longitudinal Follow-up)',
                      type: 'Encounter',
                      properties: {
                        date: '2026-11-04T10:15:00Z',
                        type: 'IN_PERSON_PHYSICAL',
                        doctor: 'Dr. Ali Khan',
                        facility: 'Cleveland Clinic Abu Dhabi',
                        notes: 'Bilateral testicular palpation: non-tender. Persistent Grade II varicocele left hemiscrotum.',
                      },
                    })
                  }
                >
                  <circle cx="540" cy="120" r="26" className="fill-emerald-600 stroke-emerald-700 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="540" y="122" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                    PV-02
                  </text>
                  <text x="540" y="133" textAnchor="middle" fill="#A7F3D0" fontSize="8">
                    Repeat Visit
                  </text>
                </g>

                {/* 4. Doctor Node (Dr. Ali Khan) */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Doctor_Ali',
                      label: currentDoctorName,
                      type: 'Doctor',
                      properties: {
                        name: currentDoctorName,
                        title: 'Consultant Andrologist & Microsurgeon',
                        license: 'DOH-AUH-2024-9102',
                        facility: 'Cleveland Clinic Abu Dhabi',
                      },
                    })
                  }
                >
                  <circle cx="100" cy="80" r="24" className="fill-stone-800 stroke-stone-900 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="100" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                    Dr. Ali
                  </text>
                  <text x="100" y="93" textAnchor="middle" fill="#D6D3D1" fontSize="8">
                    Consultant
                  </text>
                </g>

                {/* 5. Facility Node */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Facility_CCAD',
                      label: 'Cleveland Clinic Abu Dhabi',
                      type: 'Facility',
                      properties: {
                        facility: 'Cleveland Clinic Abu Dhabi',
                        location: 'Al Maryah Island, Abu Dhabi',
                        department: 'Andrology & Male Fertility Hub',
                      },
                    })
                  }
                >
                  <circle cx="660" cy="100" r="24" className="fill-indigo-600 stroke-indigo-700 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="660" y="102" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                    CCAD
                  </text>
                  <text x="660" y="113" textAnchor="middle" fill="#C7D2FE" fontSize="8">
                    Facility
                  </text>
                </g>

                {/* 6. Scrotal Doppler Ultrasound Observation Node */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Obs_Ultrasound_01',
                      label: 'Bilateral Scrotal Doppler Ultrasound',
                      type: 'Ultrasound',
                      properties: {
                        imagingType: 'High-Resolution Scrotal Color Doppler',
                        date: '2026-05-16',
                        findings: 'Left pampiniform venous plexus diameter 3.4mm with retrograde venous reflux > 2.5s on Valsalva. Varicocele Grade II.',
                        radiologist: 'Dr. Mansour Al-Nuaimi (CCAD Radiology)',
                      },
                    })
                  }
                >
                  <circle cx="140" cy="280" r="24" className="fill-purple-600 stroke-purple-700 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="140" y="282" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                    Doppler
                  </text>
                  <text x="140" y="293" textAnchor="middle" fill="#E9D5FF" fontSize="8">
                    3.4mm Reflux
                  </text>
                </g>

                {/* 7. Condition Node (Varicocele II) */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Condition_Varicocele',
                      label: 'Clinical Left Varicocele (Grade II)',
                      type: 'Condition',
                      properties: {
                        clinicalDiagnosis: 'Left Spermatic Cord Varicocele (Grade II)',
                        snomedId: '363046001',
                        icd10: 'I86.1',
                        acuity: 'SURGICAL_CONSULTATION_REQUIRED',
                      },
                    })
                  }
                >
                  <circle cx="380" cy="360" r="24" className="fill-rose-600 stroke-rose-700 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="380" y="362" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                    Varicocele
                  </text>
                  <text x="380" y="373" textAnchor="middle" fill="#FECDD3" fontSize="8">
                    Grade II
                  </text>
                </g>

                {/* 8. Prescription Node */}
                <g
                  className="cursor-pointer group"
                  onClick={() =>
                    setSelectedNode({
                      id: 'vigor:Rx_02',
                      label: 'Microsurgical Varicocelectomy Referral',
                      type: 'Prescription',
                      properties: {
                        procedure: 'Subinguinal Microsurgical Repair Consultation at CCAD',
                        prescribedBy: currentDoctorName,
                        status: 'ACTIVE_APPROVED',
                        medication: 'L-Carnitine 2000mg + CoQ10 200mg Daily',
                      },
                    })
                  }
                >
                  <circle cx="620" cy="280" r="24" className="fill-teal-600 stroke-teal-700 stroke-2 group-hover:scale-110 transition-transform" />
                  <text x="620" y="282" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                    Rx / Surgery
                  </text>
                  <text x="620" y="293" textAnchor="middle" fill="#99F6E4" fontSize="8">
                    Referral
                  </text>
                </g>
              </svg>
            </div>

            {/* Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EBE7DF] dark:border-stone-800 text-[10px] font-bold text-[#6B6355] dark:text-stone-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Patient</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Physical Visit</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-stone-800" /> Doctor</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Facility</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Doppler Ultrasound</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Condition</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Prescription</span>
              </div>
            </div>
          </div>

          {/* Node Inspector & Clinical Longitudinal Dossier */}
          <div className="lg:col-span-4 space-y-5">
            {/* Active Node Detail Card */}
            {selectedNode && (
              <div className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-5 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400">
                    Selected Entity Inspector
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getNodeColor(selectedNode.type).badge}`}>
                    {selectedNode.type}
                  </span>
                </div>

                <div>
                  <h4 className="font-editorial-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                    {selectedNode.label}
                  </h4>
                  <p className="text-[10px] font-mono text-[#8A8172] dark:text-stone-400 truncate">
                    URI: {selectedNode.id}
                  </p>
                </div>

                {selectedNode.properties && (
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-[#EBE7DF] dark:border-stone-800 space-y-2 text-xs">
                    {Object.entries(selectedNode.properties).map(([key, val]) => (
                      <div key={key} className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block font-mono">
                          {key}:
                        </span>
                        <span className="text-[#1A1816] dark:text-stone-200 block leading-relaxed font-sans">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Longitudinal History Summary */}
            <div className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-5 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1B5E20] dark:text-emerald-400 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Physical Visit Longitudinal Record</span>
              </span>

              {/* Physical Exam Highlights */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block">
                  Physical Palpation & Findings
                </span>
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-[#EBE7DF] dark:border-stone-800 text-[#4A453C] dark:text-stone-300 leading-relaxed text-[11px] space-y-1">
                  {graphData.summary.physicalExamHighlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Longitudinal WHO 2021 Progress */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block">
                  Biomarker Trajectory (Baseline &rarr; 6-Month)
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <span className="text-[9px] text-amber-800 dark:text-amber-300 font-bold block">Prog Motility</span>
                    <span className="font-editorial-serif text-base font-bold text-amber-900 dark:text-amber-200">
                      16.8% &rarr; 22.4%
                    </span>
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold block">+33% Gain</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <span className="text-[9px] text-blue-800 dark:text-blue-300 font-bold block">Sperm Count</span>
                    <span className="font-editorial-serif text-base font-bold text-blue-900 dark:text-blue-200">
                      14 &rarr; 18.5 M/ml
                    </span>
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold block">Norm Floor</span>
                  </div>
                </div>
              </div>

              {/* Active Prescriptions */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block">
                  Active Clinical Orders
                </span>
                <div className="space-y-1.5">
                  {graphData.summary.prescriptions.map((rx, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-[#166534] dark:text-emerald-300">
                      💊 {rx}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: SPARQL 1.1 QUERY CONSOLE & RESULTS TABLE
          ======================================================== */}
      {activeSubTab === 'sparql' && (
        <div className="space-y-6">
          <div className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  SPARQL 1.1 Query Console
                </h3>
                <p className="text-xs text-[#8A8172] dark:text-stone-400">
                  Run semantic triple pattern queries across physical visit encounters, ultrasound Doppler scans, and prescriptions.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6B6355] dark:text-stone-400">Preset:</span>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="px-3.5 py-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-900 text-xs text-[#1A1816] dark:text-white font-bold focus:outline-none"
                >
                  {CLINICAL_SPARQL_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Editable Query Box */}
            <div className="relative rounded-2xl overflow-hidden border border-[#DDD7C8] dark:border-stone-700">
              <div className="px-4 py-2 bg-stone-100 dark:bg-stone-900 border-b border-[#DDD7C8] dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-[#6B6355] dark:text-stone-400">
                <span>SPARQL 1.1 Query Editor</span>
                <span>Namespace: vigor &lt;http://vigor.ai/ontology#&gt;</span>
              </div>
              <textarea
                rows={8}
                value={sparqlQuery}
                onChange={(e) => setSparqlQuery(e.target.value)}
                className="w-full p-4 font-mono text-xs bg-[#1A1816] text-[#A7F3D0] focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunSparql}
                  disabled={isRunningSparql}
                  className="px-6 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningSparql ? 'Executing Query...' : 'Run SPARQL Query'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const preset = CLINICAL_SPARQL_PRESETS.find((p) => p.id === selectedPresetId);
                    if (preset) setSparqlQuery(preset.query);
                  }}
                  className="px-4 py-2.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 text-xs font-bold text-[#6B6355] dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reset to Preset</span>
                </button>
              </div>

              {sparqlResult && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#8A8172] dark:text-stone-400">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    ⚡ {sparqlResult.executionTimeMs} ms
                  </span>
                  <span>·</span>
                  <span>{sparqlResult.rowCount} rows matched</span>
                </div>
              )}
            </div>
          </div>

          {/* SPARQL Results Table */}
          {sparqlResult && (
            <div className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-editorial-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  SPARQL Query Results ({sparqlResult.rowCount} Records)
                </h4>
                <span className="text-[10px] font-mono text-[#8A8172] dark:text-stone-400">
                  JSON Bindings Format (W3C Recommendation)
                </span>
              </div>

              {sparqlResult.results.bindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 bg-[#FAF8F5] dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                  No triples matched the given pattern query.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#DDD7C8] dark:border-stone-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F5] dark:bg-stone-900 border-b border-[#DDD7C8] dark:border-stone-800 font-mono text-[11px] text-[#6B6355] dark:text-stone-400 uppercase tracking-wider">
                        {sparqlResult.head.vars.map((v) => (
                          <th key={v} className="p-3 font-bold border-r border-[#E8E2D5] dark:border-stone-800 last:border-r-0">
                            ?{v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE7DF] dark:divide-stone-800">
                      {sparqlResult.results.bindings.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-stone-50/80 dark:hover:bg-stone-900/50 transition-colors"
                        >
                          {sparqlResult.head.vars.map((v) => {
                            const cell = row[v];
                            if (!cell) {
                              return (
                                <td key={v} className="p-3 text-stone-400 italic border-r border-[#E8E2D5] dark:border-stone-800 last:border-r-0">
                                  unbound
                                </td>
                              );
                            }

                            const isUri = cell.type === 'uri';

                            return (
                              <td key={v} className="p-3 border-r border-[#E8E2D5] dark:border-stone-800 last:border-r-0">
                                {isUri ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-sky-300 font-mono text-[11px]">
                                    {cell.value}
                                  </span>
                                ) : (
                                  <span className="text-[#1A1816] dark:text-stone-200 font-sans leading-relaxed">
                                    {cell.value}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: W3C TURTLE (.TTL) RAW INSPECTOR
          ======================================================== */}
      {activeSubTab === 'turtle' && (
        <div className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                Raw W3C Turtle (.ttl) Triplestore
              </h3>
              <p className="text-xs text-[#8A8172] dark:text-stone-400">
                Direct serialization of the graph including Practitioners, Facilities, Physical Visits, CASA Observations, and Prescriptions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyTurtle}
              className="px-4 py-2 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-900 text-xs font-bold text-[#1A1816] dark:text-white hover:border-stone-400 flex items-center gap-1.5 transition-colors"
            >
              {copiedTurtle ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied .ttl</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Turtle Triples</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1816] text-[#A7F3D0] font-mono text-xs overflow-x-auto max-h-[500px] border border-stone-800 leading-relaxed">
            <pre>{getRawTurtle()}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
