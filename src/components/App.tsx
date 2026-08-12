"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRICULA, DEFAULT_CURRICULUM, type CurriculumId } from "@/data/hangul";
import { prefetchManifest, stopAudio } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { Header } from "./Header";
import { Nav, type Screen } from "./Nav";
import { HomeScreen } from "./HomeScreen";
import { CardsScreen } from "./CardsScreen";
import { BuilderScreen } from "./BuilderScreen";
import { PlayScreen } from "./PlayScreen";
import { C } from "./theme";

const CURRICULUM_KEY = "hangul-melon:curriculum:v1";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [stage, setStage] = useState(1);
  const [curriculumId, setCurriculumId] = useState<CurriculumId>(DEFAULT_CURRICULUM);
  const { progress, markLearned } = useProgress();

  useEffect(() => prefetchManifest(), []);
  useEffect(() => stopAudio(), [screen]);

  // Read the saved choice after mount so server and first client render agree.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CURRICULUM_KEY);
      if (saved && saved in CURRICULA) setCurriculumId(saved as CurriculumId);
    } catch {
      /* private mode — stay on the default */
    }
  }, []);

  const chooseCurriculum = useCallback((id: CurriculumId) => {
    setCurriculumId(id);
    setStage(1);
    try {
      localStorage.setItem(CURRICULUM_KEY, id);
    } catch {
      /* preference just won't persist */
    }
  }, []);

  const curriculum = CURRICULA[curriculumId];

  const startStage = (n: number) => {
    setStage(n);
    setScreen("cards");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(120% 60% at 50% 0%, ${C.bgTop} 0%, ${C.bg} 60%)`,
        color: C.ink,
        padding: "0 0 108px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px clamp(16px, 4vw, 32px) 0" }}>
        <Header streak={progress.streak} learned={Object.keys(progress.learned).length} />

        <main>
          {screen === "home" && (
            <HomeScreen
              curriculum={curriculum}
              onCurriculum={chooseCurriculum}
              progress={progress}
              onStartStage={startStage}
              onGo={setScreen}
            />
          )}
          {screen === "cards" && (
            <CardsScreen
              curriculum={curriculum}
              stage={stage}
              onStage={setStage}
              progress={progress}
              onLearned={markLearned}
            />
          )}
          {screen === "build" && <BuilderScreen curriculum={curriculum} />}
          {screen === "play" && <PlayScreen curriculum={curriculum} progress={progress} />}
        </main>
      </div>

      <Nav screen={screen} onGo={setScreen} />
    </div>
  );
}
