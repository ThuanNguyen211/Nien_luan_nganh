import React from 'react';
import { FaPalette, FaImage, FaFont, FaShapes } from 'react-icons/fa';

export function Sidebar({ activeTool, setActiveTool }) {
  const handleToolToggle = (toolName) => {
    setActiveTool(prevTool => (prevTool === toolName ? null : toolName));
  };

  return (
    <nav className="sidebar">
      <button
        className={`sidebar-item ${activeTool === 'colors' ? 'active' : ''}`}
        onClick={() => handleToolToggle('colors')}
      >
        <FaPalette />
        <span>Colors</span>
      </button>

      <button
        className={`sidebar-item ${activeTool === 'images' ? 'active' : ''}`}
        onClick={() => handleToolToggle('images')}
      >
        <FaImage />
        <span>Images</span>
      </button>

      <button
        className={`sidebar-item ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => handleToolToggle('text')}
      >
        <FaFont />
        <span>Text</span>
      </button>

      <button className="sidebar-item" disabled style={{ opacity: 0.5 }}>
        <FaShapes />
        <span>Shapes</span>
      </button>
    </nav>
  );
}