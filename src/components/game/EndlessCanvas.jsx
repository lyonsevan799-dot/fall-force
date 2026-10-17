import React from 'react';
import ProceduralRunCanvas from '@/components/game/procedural/ProceduralRunCanvas';
import useEndlessLeaderboard from '@/hooks/useEndlessLeaderboard';

export default function EndlessCanvas(props) {
  const leaderboard = useEndlessLeaderboard();
  return <ProceduralRunCanvas {...props} mode="endless" leaderboard={leaderboard} />;
}