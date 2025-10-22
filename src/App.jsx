import React, { useState, useRef } from 'react';
import './App.css';
import { Viewer3D } from './components/Viewer3D';
import { Editor2D } from './components/Editor2D';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const stageRef = useRef();

  // --- STATE ĐƠN GIẢN HÓA ---
  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [activeTool, setActiveTool] = useState('colors');

  // Không cần state: designTexture, images, texts
  // Không cần hàm: updateDesignTexture

  return (
    <div className="app-container">
      <Sidebar
        setActiveTool={setActiveTool}
        activeTool={activeTool}
      />

      <div className="viewer-container">
        <Viewer3D
          shirtColor={shirtColor}
        />
      </div>

      <div className="editor-container">
        <Editor2D
          stageRef={stageRef}
          activeTool={activeTool}
          shirtColor={shirtColor}
          setShirtColor={setShirtColor}
        />
      </div>
    </div>
  );
}