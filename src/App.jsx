// src/App.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { Viewer3D } from './components/Viewer3D';
import { Editor2D } from './components/Editor2D';
import { Sidebar } from './components/Sidebar';
import { PRODUCTS, PRODUCT_ORDER, DEFAULT_PRODUCT } from './config/products';

// --- ERROR BOUNDARY (ĐÚNG CHUẨN REACT 18+) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Error logging can be sent to external service in production
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

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_PRODUCT);
  const currentProduct = PRODUCTS[selectedProduct];

  const [productColor, setProductColor] = useState(currentProduct.defaultColor);
  const [previewTexture, setPreviewTexture] = useState(null);
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [activeTool, setActiveTool] = useState('colors');
  const [autoPreview, setAutoPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [templateSize, setTemplateSize] = useState({ width: 1024, height: 1024 });

  // Reset design khi đổi sản phẩm
  const handleProductChange = (productId) => {
    if (productId === selectedProduct) return;
    
    const confirmChange = images.length > 0 || texts.length > 0 || shapes.length > 0
      ? window.confirm('Đổi sản phẩm sẽ xóa thiết kế hiện tại. Bạn có muốn tiếp tục?')
      : true;
    
    if (confirmChange) {
      setSelectedProduct(productId);
      setProductColor(PRODUCTS[productId].defaultColor);
      setImages([]);
      setTexts([]);
      setShapes([]);
      setPreviewTexture(null);
    }
  };

  // Auto-preview với debounce khi design thay đổi
  const autoExportTexture = useCallback(async () => {
    if (!autoPreview || isExporting) return;
    if (images.length === 0 && texts.length === 0 && shapes.length === 0) {
      setPreviewTexture(null);
      return;
    }
    
    setIsExporting(true);
    // Delay nhỏ để đảm bảo canvas đã render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      if (!stageRef.current) return;
      const stage = stageRef.current.getStage();
      const designLayer = stage.findOne('.design-layer');
      const templateLayer = stage.findOne('.template-layer');
      
      if (!designLayer || !templateLayer) return;
      
      const currentScaleX = stage.scaleX();
      const currentScaleY = stage.scaleY();
      templateLayer.visible(false);
      stage.scale({ x: 1, y: 1 });
      stage.batchDraw();
      
      const dataURL = designLayer.toDataURL({ 
        pixelRatio: 1,
        x: 0,
        y: 0,
        width: templateSize.width,
        height: templateSize.height
      });
      setPreviewTexture(dataURL);
      
      stage.scale({ x: currentScaleX, y: currentScaleY });
      templateLayer.visible(true);
      stage.batchDraw();
    } catch {
      // Silent fail for auto-preview
    } finally {
      setIsExporting(false);
    }
  }, [autoPreview, images, texts, shapes, isExporting, templateSize]);

  // Trigger auto-preview khi images, texts hoặc shapes thay đổi
  useEffect(() => {
    const timer = setTimeout(autoExportTexture, 300);
    return () => clearTimeout(timer);
  }, [images, texts, shapes]);

  //  SAVE DESIGN - Xuất file JSON
  const handleSave = () => {
    const designData = {
      version: '1.1',
      createdAt: new Date().toISOString(),
      product: selectedProduct,
      productColor,
      images: images.map(img => ({
        ...img,
        // Giữ nguyên src base64
      })),
      texts,
      shapes,
      templateSize
    };

    const jsonString = JSON.stringify(designData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${selectedProduct}-design-${Date.now()}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 📂 IMPORT DESIGN - Nhập file JSON
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const designData = JSON.parse(e.target.result);
        
        // Validate version
        if (!designData.version) {
          alert('Invalid design file format');
          return;
        }

        // Load design data
        if (designData.product && PRODUCTS[designData.product]) {
          setSelectedProduct(designData.product);
        }
        if (designData.productColor) {
          setProductColor(designData.productColor);
        } else if (designData.shirtColor) {
          // Backward compatibility với file cũ
          setProductColor(designData.shirtColor);
        }
        if (designData.images) setImages(designData.images);
        if (designData.texts) setTexts(designData.texts);
        if (designData.shapes) setShapes(designData.shapes);
        
        alert('Design imported successfully!');
      } catch {
        alert('Failed to import design: Invalid file format');
      }
    };
    reader.readAsText(file);
    
    // Reset input để có thể import lại cùng file
    event.target.value = '';
  };

  // ✅ EXPORT TEXTURE Ở KÍCH THƯỚC GỐC (KHÔNG BỊ SCALE)
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

      // Lưu scale hiện tại
      const currentScaleX = stage.scaleX();
      const currentScaleY = stage.scaleY();

      // Ẩn template
      templateLayer.visible(false);
      
      // Reset scale về 1:1 để export đúng kích thước gốc
      stage.scale({ x: 1, y: 1 });
      stage.batchDraw();

      // Export với kích thước gốc
      try {
        const dataURL = designLayer.toDataURL({
          pixelRatio: 1,
          x: 0,
          y: 0,
          width: templateSize.width,
          height: templateSize.height
        });
        resolve(dataURL);
      } catch {
        resolve(null);
      } finally {
        // Khôi phục scale và hiện lại template
        stage.scale({ x: currentScaleX, y: currentScaleY });
        templateLayer.visible(true);
        stage.batchDraw();
      }
    });
  };

  const handlePreview = async () => {
    try {
      const dataURL = await exportDesignTexture();
      
      if (!dataURL) {
        alert("Failed to export texture. Make sure you have added images or text.");
        return;
      }
      
      setPreviewTexture(dataURL);
    } catch (error) {
      alert("Could not generate preview: " + error.message);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">POD Designer</div>
          <div className="product-selector">
            {PRODUCT_ORDER.map(productId => {
              const product = PRODUCTS[productId];
              return (
                <button
                  key={productId}
                  className={`product-btn ${selectedProduct === productId ? 'active' : ''}`}
                  onClick={() => handleProductChange(productId)}
                  title={product.label}
                >
                  <span className="product-icon">{product.icon}</span>
                  <span className="product-name">{product.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="app-header-right">
          {/* Import Button */}
          <label className="header-btn import-btn">
            📂 Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button className="header-btn" onClick={handleSave}>💾 Save</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-main">
        <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />

        <div className="viewer-container">
          <ErrorBoundary>
            <Viewer3D
              productConfig={currentProduct}
              productColor={productColor}
              designTexture={previewTexture}
            />
          </ErrorBoundary>
        </div>

        <div className="editor-container">
          <Editor2D
            stageRef={stageRef}
            productConfig={currentProduct}
            activeTool={activeTool}
            productColor={productColor}
            setProductColor={setProductColor}
            images={images}
            setImages={setImages}
            texts={texts}
            setTexts={setTexts}
            shapes={shapes}
            setShapes={setShapes}
            onPreview={handlePreview}
            autoPreview={autoPreview}
            setAutoPreview={setAutoPreview}
            setTemplateSize={setTemplateSize}
          />
        </div>
      </div>
    </div>
  );
}