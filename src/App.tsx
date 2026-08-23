import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { RegressionMatrix } from './components/RegressionMatrix';
import { LiveSdrPipeline } from './components/LiveSdrPipeline';
import { ConstellationStudio } from './components/ConstellationStudio';
import { SpectrumWaterfall } from './components/SpectrumWaterfall';
import { PqcStudio } from './components/PqcStudio';
import { DspLab } from './components/DspLab';
import { NpuArchitecture } from './components/NpuArchitecture';
import { ALL_MILESTONES, runMilestoneTest } from './tests/milestones';
import { MilestoneTest, SiliconRunStats } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('matrix');
  const [milestones, setMilestones] = useState<MilestoneTest[]>(ALL_MILESTONES);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);

  // Compute test stats
  const passedCount = milestones.filter((m) => m.status === 'passed').length;
  const failedCount = milestones.filter((m) => m.status === 'failed').length;

  const stats: SiliconRunStats = {
    total: milestones.length,
    passed: passedCount,
    failed: failedCount,
    running: isRunningAll,
    lastRunTimestamp: new Date().toISOString(),
  };

  // Run a single milestone test
  const handleRunSingleTest = useCallback(async (testId: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === testId ? { ...m, status: 'running' } : m))
    );

    const m = milestones.find((item) => item.id === testId);
    if (!m) return;

    const result = await runMilestoneTest(m);
    setMilestones((prev) =>
      prev.map((item) => (item.id === testId ? result : item))
    );
  }, [milestones]);

  // Run all 34 milestone tests sequentially with progress animation
  const handleRunAllTests = useCallback(async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);

    const updatedList = [...milestones];
    for (let i = 0; i < updatedList.length; i++) {
      const current = updatedList[i];
      // mark current as running
      setMilestones((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'running' } : item))
      );

      const res = await runMilestoneTest(current);
      updatedList[i] = res;

      setMilestones([...updatedList]);
    }

    setIsRunningAll(false);
  }, [isRunningAll, milestones]);

  // Run test suite once on initial load so the user immediately sees live pass results
  useEffect(() => {
    handleRunAllTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top App Header */}
      <Header stats={stats} onRunAll={handleRunAllTests} />

      {/* Primary Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        passedCount={passedCount}
        totalCount={milestones.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'matrix' && (
          <RegressionMatrix
            milestones={milestones}
            onRunTest={handleRunSingleTest}
            onRunAll={handleRunAllTests}
            running={isRunningAll}
          />
        )}

        {activeTab === 'pipeline' && <LiveSdrPipeline />}

        {activeTab === 'constellation' && <ConstellationStudio />}

        {activeTab === 'spectrum' && <SpectrumWaterfall />}

        {activeTab === 'pqc' && <PqcStudio />}

        {activeTab === 'dsplab' && <DspLab />}

        {activeTab === 'arch' && <NpuArchitecture />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Phoenix SDR-DSP Silicon Engineering Suite • AMD Ryzen AI XDNA1 / AIE2
          </span>
          <span className="font-mono text-slate-600">
            Bit-Accurate DSP, NTT & Quantum-Safe FIPS 203/204
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
