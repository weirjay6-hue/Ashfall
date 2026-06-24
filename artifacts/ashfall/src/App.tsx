import { useState } from "react";
import GameCanvas from "./game/GameCanvas";
import MainMenu from "./pages/MainMenu";
import GameOver from "./pages/GameOver";

export type Screen = "menu" | "playing" | "gameover";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [finalScore, setFinalScore] = useState(0);
  const [finalWave, setFinalWave] = useState(1);

  const startGame = () => setScreen("playing");

  const handleGameOver = (score: number, wave: number) => {
    setFinalScore(score);
    setFinalWave(wave);
    setScreen("gameover");
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0d0b0a]">
      {screen === "menu" && <MainMenu onStart={startGame} />}
      {screen === "playing" && (
        <GameCanvas onGameOver={handleGameOver} />
      )}
      {screen === "gameover" && (
        <GameOver
          score={finalScore}
          wave={finalWave}
          onRestart={startGame}
          onMenu={() => setScreen("menu")}
        />
      )}
    </div>
  );
}
