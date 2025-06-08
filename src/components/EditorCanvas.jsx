// src/components/EditorCanvas.jsx
import React from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

export default function EditorCanvas() {
  return (
    <Stage width={800} height={150} style={{ background: '#ddd' }}>
      <Layer>
        <Text text="Single Video Track" x={300} y={10} fontSize={16} fontStyle="bold" />
        <Rect
          x={250}
          y={40}
          width={300}
          height={80}
          fill="black"
          stroke="white"
          strokeWidth={2}
          draggable
        />
      </Layer>
    </Stage>
  );
}