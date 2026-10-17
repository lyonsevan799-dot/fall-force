import React from 'react';
import ProceduralRunCanvas from '@/components/game/procedural/ProceduralRunCanvas';

export default function SurvivalCanvas(props) {
  return <ProceduralRunCanvas {...props} mode="survival" best={props.records?.bestScore || 0} />;
}