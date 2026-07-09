import React from 'react';
import { SocketProvider, useGame } from './context/SocketContext';
import { WelcomeView } from './components/WelcomeView';
import { LobbyView } from './components/LobbyView';
import { GameBoardView } from './components/GameBoardView';
import { LeaderboardView } from './components/LeaderboardView';
import { RoomStatus } from '@ecorace/shared';

const GameShell: React.FC = () => {
  const { room, player } = useGame();

  if (!room || !player) {
    return <WelcomeView />;
  }

  switch (room.status) {
    case RoomStatus.LOBBY:
      return <LobbyView />;
    case RoomStatus.PLAYING:
      return <GameBoardView />;
    case RoomStatus.FINISHED:
      return <LeaderboardView />;
    default:
      return <WelcomeView />;
  }
};

function App() {
  return (
    <SocketProvider>
      <GameShell />
    </SocketProvider>
  );
}

export default App;
