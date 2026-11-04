'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import WindingLadderJourney from '@/components/WindingLadderJourney';
import WatermarkBackground from '@/components/WatermarkBackground';
import Footer from '@/components/Footer';
import IntakeModal from '@/components/IntakeModal';
import ResultsModal from '@/components/ResultsModal';
import ConsentCentreModal from '@/components/ConsentCentreModal';
import ClinicianReviewModal from '@/components/ClinicianReviewModal';
import AtHomeKitModal from '@/components/AtHomeKitModal';
import ArchitectureModal from '@/components/ArchitectureModal';
import { Locale, IntakeAnswers, TriageResult } from '@/types/vigor';
import { GOLDEN_CASES } from '@/lib/golden-cases';

export default function Home() {
  const [locale, setLocale] = useState<Locale>('en');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isClinicianOpen, setIsClinicianOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isAtHomeKitOpen, setIsAtHomeKitOpen] = useState(false);

  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selectedInitialAnswers, setSelectedInitialAnswers] = useState<IntakeAnswers | undefined>(undefined);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('vigor-theme') === 'dark' ||
      (!localStorage.getItem('vigor-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vigor-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vigor-theme', 'light');
    }
  };

  const handleAssessmentCompleted = (result: TriageResult) => {
    setTriageResult(result);
    setIsIntakeOpen(false);
    setIsResultsOpen(true);
  };

  const handleSelectGoldenCase = (caseId: string) => {
    const gc = GOLDEN_CASES.find((c) => c.id === caseId);
    if (gc) {
      setSelectedInitialAnswers(gc.answers);
      setIsIntakeOpen(true);
    }
  };

  const handleOpenNewIntake = () => {
    setSelectedInitialAnswers(undefined);
    setIsIntakeOpen(true);
  };

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen flex flex-col bg-[#F5F3EA] dark:bg-[#141311] text-[#22201D] dark:text-[#F2EEE6] relative selection:bg-[#2E2922] selection:text-[#F7F4EB] transition-colors duration-300"
    >
      {/* Artistic Off-White Background with Subtle Medical & Typographic Watermark Illustrations */}
      <WatermarkBackground />

      {/* Top Header - Fixed & Always Visible */}
      <Header
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenIntake={handleOpenNewIntake}
        onOpenConsent={() => setIsConsentOpen(true)}
        onOpenClinician={() => setIsClinicianOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenAtHomeKit={() => setIsAtHomeKitOpen(true)}
      />

      {/* Main Page Surfaces with pt-16 offset for fixed header */}
      <main className="flex-1 pt-14 sm:pt-16">
        {/* Front Hero Section */}
        <HeroSection
          locale={locale}
          onOpenIntake={handleOpenNewIntake}
          onOpenClinician={() => setIsClinicianOpen(true)}
          onSelectGoldenCase={handleSelectGoldenCase}
        />

        {/* Continuous 3D Winding Ladder Journey with Scroll-Synchronized Progressive Drawing */}
        <WindingLadderJourney
          locale={locale}
          onOpenIntake={handleOpenNewIntake}
          onOpenConsent={() => setIsConsentOpen(true)}
          onOpenClinician={() => setIsClinicianOpen(true)}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
          onOpenAtHomeKit={() => setIsAtHomeKitOpen(true)}
          onSelectGoldenCase={handleSelectGoldenCase}
        />
      </main>

      {/* Footer */}
      <Footer
        locale={locale}
        setLocale={setLocale}
        onOpenConsent={() => setIsConsentOpen(true)}
        onOpenClinician={() => setIsClinicianOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenAtHomeKit={() => setIsAtHomeKitOpen(true)}
      />

      {/* Modals */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        locale={locale}
        onAssessmentCompleted={handleAssessmentCompleted}
        initialAnswers={selectedInitialAnswers}
      />

      <ResultsModal
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        result={triageResult}
        locale={locale}
        onOpenConsent={() => setIsConsentOpen(true)}
        onOpenAtHomeKit={() => setIsAtHomeKitOpen(true)}
      />

      <ConsentCentreModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        locale={locale}
      />

      <ClinicianReviewModal
        isOpen={isClinicianOpen}
        onClose={() => setIsClinicianOpen(false)}
        locale={locale}
      />

      <AtHomeKitModal
        isOpen={isAtHomeKitOpen}
        onClose={() => setIsAtHomeKitOpen(false)}
        locale={locale}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
        locale={locale}
      />
    </div>
  );
}
