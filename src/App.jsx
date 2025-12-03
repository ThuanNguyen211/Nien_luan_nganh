// src/App.jsx
import React, { useState, useRef } from 'react';
import './App.css';
import { Viewer3D } from './components/Viewer3D';
import { Editor2D } from './components/Editor2D';
import { Sidebar } from './components/Sidebar';

// --- ERROR BOUNDARY (ĐÚNG CHUẨN REACT 18+) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', flexDirection: 'column', padding: 20 }}>
          <h3 style={{ color: '#d32f2f' }}>3D Viewer Error</h3>
          <details><summary>Error details</summary><pre>{this.state.error?.toString()}</pre></details>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{ marginTop: 10, padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4 }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const stageRef = useRef();

  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [previewTexture, setPreviewTexture] = useState(null);
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [activeTool, setActiveTool] = useState('colors');
  const [showUVChecker, setShowUVChecker] = useState(false);

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  const handleSave = () => {
    alert('Save functionality coming soon!');
  };

  // ✅ SỬA HÀM EXPORT: CHỈ EXPORT LAYER "design-layer" VỚI KÍCH THƯỚC GỐC
  const exportDesignTexture = () => {
    return new Promise((resolve) => {
      if (!stageRef.current) {
        resolve(null);
        return;
      }

      const stage = stageRef.current.getStage();
      const designLayer = stage.findOne('.design-layer');
      const templateLayer = stage.findOne('.template-layer');

      if (!designLayer || !templateLayer) {
        resolve(null);
        return;
      }

      // Ẩn template
      templateLayer.visible(false);
      stage.batchDraw();

      // Export ngay lập tức (không cần requestAnimationFrame vì không có animation)
      try {
        const dataURL = designLayer.toDataURL({
          pixelRatio: 1, // ←←← DÙNG pixelRatio=1 để giữ kích thước gốc của template
        });
        resolve(dataURL);
      } catch (err) {
        console.error("Export error:", err);
        resolve(null);
      } finally {
        // Hiện lại template
        templateLayer.visible(true);
        stage.batchDraw();
      }
    });
  };

  const handlePreview = async () => {
    try {
      const dataURL = await exportDesignTexture();
      setPreviewTexture(dataURL);
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Could not generate preview.");
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">POD Designer</div>
          <div className="app-title">Custom T-Shirt Design Studio</div>
        </div>
        <div className="app-header-right">
          <button className="header-btn" onClick={handleSave}>💾 Save</button>
          <button className="header-btn" onClick={handleExport}>📥 Export</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-main">
        <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />

        <div className="viewer-container">
          <ErrorBoundary>
            <Viewer3D
              shirtColor={shirtColor}
              designTexture={showUVChecker ? '/uv_checker.png' : previewTexture}
            />
            <button
              className={`viewer-overlay-btn ${showUVChecker ? 'active' : ''}`}
              onClick={() => setShowUVChecker(!showUVChecker)}
            >
              {showUVChecker ? '🔲 Hide UV Grid' : '🔳 Show UV Grid'}
            </button>
          </ErrorBoundary>
        </div>

        <div className="editor-container">
          <Editor2D
            stageRef={stageRef}
            activeTool={activeTool}
            shirtColor={shirtColor}
            setShirtColor={setShirtColor}
            images={images}
            setImages={setImages}
            texts={texts}
            setTexts={setTexts}
            onPreview={handlePreview}
          />
        </div>
      </div>
    </div>
  );
}