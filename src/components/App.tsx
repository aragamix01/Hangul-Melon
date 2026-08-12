"use client";

import { useEffect, useState } from "react";
import { prefetchManifest, stopAudio } from "@/lib/audio";
import { useProgress } from "@/lib/progress";
import { Header } from "./Header";
import { Nav, type Screen } from "./Nav";
import { HomeScreen } from "./HomeScreen";
import { CardsScreen } from "./CardsScreen";
import { BuilderScreen } from "./BuilderScreen";
import { PlayScreen } from "./PlayScreen";
import { C } from "./theme";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [stage, setStage] = useState(1);
  const { progress, markLearned } = useProgress();

  useEffect(() => prefetchManifest(), []);
  useEffect(() => stopAudio(), [screen]);

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
            <HomeScreen progress={progress} onStartStage={startStage} onGo={setScreen} />
          )}
          {screen === "cards" && (
            <CardsScreen
              stage={stage}
              onStage={setStage}
              progress={progress}
              onLearned={markLearned}
            />
          )}
          {screen === "build" && <BuilderScreen />}
          {screen === "play" && <PlayScreen progress={progress} />}
        </main>
      </div>

      <Nav screen={screen} onGo={setScreen} />
    </div>
  );
}
