// src/components/Editor2D.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Text, Transformer, Rect, Circle, RegularPolygon, Star, Line } from 'react-konva';
import useImage from 'use-image';

const DraggableObject = ({ obj, onSelect, onChange, isSelected }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  const [img, imgStatus] = useImage(obj.type === 'image' ? obj.src || '' : '', 'Anonymous');

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  useEffect(() => {
    if (obj.type === 'text' && shapeRef.current) {
      shapeRef.current.offsetX(shapeRef.current.width() / 2);
      shapeRef.current.offsetY(shapeRef.current.height() / 2);
    }
    if (obj.type === 'image' && imgStatus === 'loaded' && shapeRef.current && img) {
      shapeRef.current.offsetX(img.width / 2);
      shapeRef.current.offsetY(img.height / 2);
    }
  }, [obj.type, obj.text, obj.fontSize, obj.fontFamily, imgStatus, img]);

  const commonProps = {
    ref: shapeRef,
    id: obj.id,
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation || 0,
    draggable: true,
    onClick: (e) => { e.cancelBubble = true; onSelect(obj.id); },
    onTap: (e) => { e.cancelBubble = true; onSelect(obj.id); },
    onDragEnd: (e) => onChange(e.target),
    onTransformEnd: (e) => onChange(e.target),
  };

  let element;
  if (obj.type === 'image' && imgStatus === 'loaded' && img) {
    element = (
      <Image 
        {...commonProps} 
        image={img} 
        width={img.width} 
        height={img.height}
        opacity={obj.opacity ?? 1}
        scaleX={(obj.scale || 1) * (obj.flipX ? -1 : 1)}
        scaleY={(obj.scale || 1) * (obj.flipY ? -1 : 1)}
      />
    );
  } else if (obj.type === 'text') {
    element = (
      <Text 
        {...commonProps} 
        text={obj.text} 
        fill={obj.fill} 
        fontSize={obj.fontSize} 
        fontFamily={obj.fontFamily}
        fontStyle={`${obj.bold ? 'bold' : ''} ${obj.italic ? 'italic' : ''}`.trim() || 'normal'}
        textDecoration={obj.underline ? 'underline' : ''}
        align={obj.align || 'center'}
        scaleX={obj.scale || 1}
        scaleY={obj.scale || 1}
      />
    );
  } else if (obj.type === 'rectangle') {
    element = (
      <Rect
        {...commonProps}
        width={obj.width || 100}
        height={obj.height || 80}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth || 0}
        cornerRadius={obj.cornerRadius || 0}
        scaleX={obj.scale || 1}
        scaleY={obj.scale || 1}
        offsetX={(obj.width || 100) / 2}
        offsetY={(obj.height || 80) / 2}
      />
    );
  } else if (obj.type === 'circle') {
    element = (
      <Circle
        {...commonProps}
        radius={obj.radius || 50}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth || 0}
        scaleX={obj.scale || 1}
        scaleY={obj.scale || 1}
      />
    );
  } else if (obj.type === 'triangle') {
    element = (
      <RegularPolygon
        {...commonProps}
        sides={3}
        radius={obj.radius || 50}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth || 0}
        scaleX={obj.scale || 1}
        scaleY={obj.scale || 1}
      />
    );
  } else if (obj.type === 'star') {
    element = (
      <Star
        {...commonProps}
        numPoints={obj.numPoints || 5}
        innerRadius={obj.innerRadius || 25}
        outerRadius={obj.outerRadius || 50}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth || 0}
        scaleX={obj.scale || 1}
        scaleY={obj.scale || 1}
      />
    );
  } else if (obj.type === 'line') {
    element = (
      <Line
        {...commonProps}
        points={obj.points || [0, 0, 100, 0]}
        stroke={obj.stroke || '#000000'}
        strokeWidth={obj.strokeWidth || 3}
        lineCap="round"
        scaleX={obj.scale || 1}
        scaleY={obj.scale || 1}
      />
    );
  }

  return (
    <>
      {element}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
          keepRatio={obj.type === 'image' || obj.type === 'circle' || obj.type === 'star'}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={true}
        />
      )}
    </>
  );
};

const palette = [
  '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#CCCCCC',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#FF9800', '#FF5722',
  '#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50', '#009688', '#00BCD4',
  '#03A9F4', '#2196F3', '#3F51B5', '#607D8B', '#9E9E9E', '#795548',
  '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#FFCCBC', '#D7CCC8',
  '#C8E6C9', '#B2EBF2', '#B3E5FC', '#C5CAE9', '#F5F5F5', '#FFE0B2',
];

export function Editor2D({
  stageRef,
  productConfig,
  activeTool,
  productColor, setProductColor,
  images, setImages,
  texts, setTexts,
  shapes, setShapes,
  onPreview,
  autoPreview, setAutoPreview,
  setTemplateSize
}) {
  const [templateImg] = useImage(productConfig?.uvMap || '/tshirt_uv_map.png');
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);

  const [displaySize, setDisplaySize] = useState({ width: 800, height: 1000 });

  useEffect(() => {
    if (templateImg && containerRef.current) {
      const maxWidth = containerRef.current.clientWidth;
      const maxHeight = 480; // Chiều cao canvas lớn hơn để dễ thiết kế

      const scaleX = maxWidth / templateImg.width;
      const scaleY = maxHeight / templateImg.height;
      const scale = Math.min(scaleX, scaleY, 1);

      setDisplaySize({
        width: templateImg.width * scale,
        height: templateImg.height * scale,
      });
      
      // Cập nhật kích thước template gốc cho export
      if (setTemplateSize) {
        setTemplateSize({
          width: templateImg.width,
          height: templateImg.height
        });
      }
    }
  }, [templateImg, setTemplateSize]);

  const handleObjectChange = (node) => {
    const id = node.id();
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();
    const newScaleX = node.scaleX();
    const newScaleY = node.scaleY();
    const avgScale = (newScaleX + newScaleY) / 2;

    setImages(prev => prev.map(img => img.id === id ? { ...img, x: newX, y: newY, rotation: newRotation, scale: avgScale } : img));
    setTexts(prev => prev.map(txt => txt.id === id ? { ...txt, x: newX, y: newY, rotation: newRotation, scale: avgScale } : txt));
    if (setShapes) {
      setShapes(prev => prev.map(shp => shp.id === id ? { ...shp, x: newX, y: newY, rotation: newRotation, scale: avgScale } : shp));
    }
  };

  const handleAddImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newImg = {
        id: `img-${Date.now()}`,
        type: 'image',
        src: reader.result,
        x: 200,
        y: 200,
        rotation: 0,
        scale: 1,
      };
      setImages(prev => [...prev, newImg]);
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'New Text',
      x: 200,
      y: 200,
      rotation: 0,
      scale: 1,
      fontSize: 32,
      fontFamily: 'Arial',
      fill: '#000000',
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    };
    setTexts(prev => [...prev, newText]);
  };

  const handleAddShape = (shapeType) => {
    const baseShape = {
      id: `shape-${Date.now()}`,
      x: 200,
      y: 200,
      rotation: 0,
      scale: 1,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
    };
    
    let newShape;
    switch (shapeType) {
      case 'rectangle':
        newShape = { ...baseShape, type: 'rectangle', width: 100, height: 80, cornerRadius: 0 };
        break;
      case 'circle':
        newShape = { ...baseShape, type: 'circle', radius: 50 };
        break;
      case 'triangle':
        newShape = { ...baseShape, type: 'triangle', radius: 50 };
        break;
      case 'star':
        newShape = { ...baseShape, type: 'star', numPoints: 5, innerRadius: 25, outerRadius: 50 };
        break;
      case 'line':
        newShape = { ...baseShape, type: 'line', points: [0, 0, 100, 0], fill: null, stroke: '#000000', strokeWidth: 4 };
        break;
      default:
        return;
    }
    
    if (setShapes) {
      setShapes(prev => [...prev, newShape]);
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setImages(prev => prev.filter(img => img.id !== selectedId));
    setTexts(prev => prev.filter(txt => txt.id !== selectedId));
    if (setShapes) {
      setShapes(prev => prev.filter(shp => shp.id !== selectedId));
    }
    setSelectedId(null);
  };

  const renderActiveTool = () => {
    if (!activeTool) return null;

    if (activeTool === 'colors') {
      return (
        <div>
          <div className="section-title">🎨 {productConfig?.name || 'Product'} Color</div>
          
          {/* Custom Color Picker */}
          <div className="custom-color-section">
            <label className="color-picker-label">Custom Color:</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={productColor}
                onChange={(e) => setProductColor(e.target.value)}
                className="color-picker-input"
              />
              <input
                type="text"
                value={productColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setProductColor(val);
                }}
                className="color-hex-input"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
          
          {/* Preset Colors */}
          <div style={{ marginTop: '16px' }}>
            <label className="color-picker-label">Preset Colors:</label>
            <div className="color-grid">
              {palette.map(color => (
                <button
                  key={color}
                  className={`color-swatch ${productColor === color ? 'selected' : ''}`}
                  onClick={() => setProductColor(color)}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          {/* Current Color Preview */}
          <div className="current-color-preview" style={{ marginTop: '16px' }}>
            <span>Current: </span>
            <span 
              className="color-preview-box" 
              style={{ backgroundColor: productColor }}
            />
            <span className="color-preview-text">{productColor}</span>
          </div>
        </div>
      );
    }

    if (activeTool === 'images') {
      const selectedImage = images.find(img => img.id === selectedId);
      
      const handleImageOpacity = (opacity) => {
        if (!selectedId) return;
        setImages(prev => prev.map(img => 
          img.id === selectedId ? { ...img, opacity: parseFloat(opacity) } : img
        ));
      };
      
      const handleFlipH = () => {
        if (!selectedId) return;
        setImages(prev => prev.map(img => 
          img.id === selectedId ? { ...img, flipX: !img.flipX } : img
        ));
      };
      
      const handleFlipV = () => {
        if (!selectedId) return;
        setImages(prev => prev.map(img => 
          img.id === selectedId ? { ...img, flipY: !img.flipY } : img
        ));
      };
      
      const handleDuplicate = () => {
        if (!selectedId) return;
        const srcImg = images.find(img => img.id === selectedId);
        if (!srcImg) return;
        const newImg = {
          ...srcImg,
          id: `img-${Date.now()}`,
          x: srcImg.x + 20,
          y: srcImg.y + 20,
        };
        setImages(prev => [...prev, newImg]);
      };
      
      const handleMoveLayer = (direction) => {
        if (!selectedId) return;
        const idx = images.findIndex(img => img.id === selectedId);
        if (idx === -1) return;
        const newImages = [...images];
        const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
        if (targetIdx < 0 || targetIdx >= newImages.length) return;
        [newImages[idx], newImages[targetIdx]] = [newImages[targetIdx], newImages[idx]];
        setImages(newImages);
      };
      
      return (
        <div>
          <div className="section-title">🖼️ Upload Image</div>
          
          {/* Drag & Drop Upload Area */}
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleAddImage}
              className="upload-input"
              id="image-upload"
              multiple
            />
            <label htmlFor="image-upload" className="upload-label">
              <span className="upload-icon">📁</span>
              <span>Click to upload or drag image here</span>
              <span className="upload-hint">PNG, JPG, SVG up to 10MB</span>
            </label>
          </div>
          
          {/* Image List with Thumbnails */}
          {images.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div className="section-title">Image Layers ({images.length})</div>
              <ul className="image-list">
                {images.map((img, index) => (
                  <li
                    key={img.id}
                    className={`image-item ${selectedId === img.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(img.id)}
                  >
                    <img src={img.src} alt="" className="image-thumbnail" />
                    <div className="image-info">
                      <span className="image-name">Layer {index + 1}</span>
                      <span className="image-size">
                        {img.opacity !== undefined ? `${Math.round(img.opacity * 100)}%` : '100%'}
                      </span>
                    </div>
                    {selectedId === img.id && <span className="image-check">✓</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Image Controls */}
          {selectedImage && (
            <div className="image-controls">
              <div className="section-title">✨ Image Settings</div>
              
              {/* Opacity */}
              <div className="control-row">
                <label>Opacity:</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={selectedImage.opacity ?? 1}
                  onChange={(e) => handleImageOpacity(e.target.value)}
                  className="opacity-slider"
                />
                <span>{Math.round((selectedImage.opacity ?? 1) * 100)}%</span>
              </div>
              
              {/* Flip Buttons */}
              <div className="control-row">
                <label>Transform:</label>
                <div className="btn-group">
                  <button 
                    onClick={handleFlipH} 
                    className={`btn btn-sm ${selectedImage.flipX ? 'btn-active' : ''}`}
                    title="Flip Horizontal"
                  >
                    ↔️ Flip H
                  </button>
                  <button 
                    onClick={handleFlipV} 
                    className={`btn btn-sm ${selectedImage.flipY ? 'btn-active' : ''}`}
                    title="Flip Vertical"
                  >
                    ↕️ Flip V
                  </button>
                </div>
              </div>
              
              {/* Layer Order */}
              <div className="control-row">
                <label>Layer:</label>
                <div className="btn-group">
                  <button onClick={() => handleMoveLayer('up')} className="btn btn-sm" title="Bring Forward">
                    ⬆️ Up
                  </button>
                  <button onClick={() => handleMoveLayer('down')} className="btn btn-sm" title="Send Backward">
                    ⬇️ Down
                  </button>
                  <button onClick={handleDuplicate} className="btn btn-sm" title="Duplicate">
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTool === 'text') {
      const selectedText = texts.find(txt => txt.id === selectedId);
      
      const handleTextChange = (field, value) => {
        if (!selectedId) return;
        setTexts(prev => prev.map(txt => 
          txt.id === selectedId ? { ...txt, [field]: value } : txt
        ));
      };
      
      const fontFamilies = [
        'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
        'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black'
      ];
      
      const textColors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#F39C12', '#E74C3C', '#9B59B6', '#3498DB', '#1ABC9C', '#2ECC71'
      ];
      
      return (
        <div>
          <div className="section-title">✍️ Add Text</div>
          <button onClick={handleAddText} className="btn btn-primary btn-block">
            ➕ Add New Text
          </button>
          
          {texts.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div className="section-title">Text Layers</div>
              <ul className="object-list">
                {texts.map(txt => (
                  <li
                    key={txt.id}
                    className={`object-item ${selectedId === txt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(txt.id)}
                  >
                    📝 {txt.text.substring(0, 15)}{txt.text.length > 15 ? '...' : ''} {selectedId === txt.id && '✓'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Text Editor Controls */}
          {selectedText && (
            <div className="text-controls" style={{ marginTop: '24px' }}>
              <div className="section-title">✨ Text Settings</div>
              
              {/* Text Content */}
              <div className="control-group">
                <label>Text:</label>
                <input
                  type="text"
                  value={selectedText.text}
                  onChange={(e) => handleTextChange('text', e.target.value)}
                  className="text-input"
                  placeholder="Enter text..."
                />
              </div>
              
              {/* Font Family */}
              <div className="control-group">
                <label>Font:</label>
                <select
                  value={selectedText.fontFamily}
                  onChange={(e) => handleTextChange('fontFamily', e.target.value)}
                  className="select-input"
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                  ))}
                </select>
              </div>
              
              {/* Font Size */}
              <div className="control-group">
                <label>Size: {selectedText.fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={selectedText.fontSize}
                  onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
                  className="opacity-slider"
                />
              </div>
              
              {/* Text Style Buttons */}
              <div className="control-group">
                <label>Style:</label>
                <div className="btn-group">
                  <button
                    onClick={() => handleTextChange('bold', !selectedText.bold)}
                    className={`btn btn-sm ${selectedText.bold ? 'btn-active' : ''}`}
                    style={{ fontWeight: 'bold' }}
                  >
                    B
                  </button>
                  <button
                    onClick={() => handleTextChange('italic', !selectedText.italic)}
                    className={`btn btn-sm ${selectedText.italic ? 'btn-active' : ''}`}
                    style={{ fontStyle: 'italic' }}
                  >
                    I
                  </button>
                  <button
                    onClick={() => handleTextChange('underline', !selectedText.underline)}
                    className={`btn btn-sm ${selectedText.underline ? 'btn-active' : ''}`}
                    style={{ textDecoration: 'underline' }}
                  >
                    U
                  </button>
                </div>
              </div>
              
              {/* Text Color */}
              <div className="control-group">
                <label>Color:</label>
                <div className="color-picker-row">
                  <input
                    type="color"
                    value={selectedText.fill}
                    onChange={(e) => handleTextChange('fill', e.target.value)}
                    className="color-picker-input"
                  />
                  <div className="mini-color-grid">
                    {textColors.map(color => (
                      <button
                        key={color}
                        className={`mini-color-swatch ${selectedText.fill === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleTextChange('fill', color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTool === 'shapes') {
      const selectedShape = shapes?.find(shp => shp.id === selectedId);
      
      const handleShapeChange = (field, value) => {
        if (!selectedId || !setShapes) return;
        setShapes(prev => prev.map(shp => 
          shp.id === selectedId ? { ...shp, [field]: value } : shp
        ));
      };
      
      const shapeColors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
        '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
        '#000000', '#FFFFFF', '#6B7280', '#1F2937', '#FBBF24', '#A855F7'
      ];
      
      return (
        <div>
          <div className="section-title">🔷 Add Shapes</div>
          
          {/* Shape Buttons */}
          <div className="shape-buttons">
            <button onClick={() => handleAddShape('rectangle')} className="shape-btn" title="Rectangle">
              <span className="shape-icon">▭</span>
              <span>Rectangle</span>
            </button>
            <button onClick={() => handleAddShape('circle')} className="shape-btn" title="Circle">
              <span className="shape-icon">●</span>
              <span>Circle</span>
            </button>
            <button onClick={() => handleAddShape('triangle')} className="shape-btn" title="Triangle">
              <span className="shape-icon">▲</span>
              <span>Triangle</span>
            </button>
            <button onClick={() => handleAddShape('star')} className="shape-btn" title="Star">
              <span className="shape-icon">★</span>
              <span>Star</span>
            </button>
            <button onClick={() => handleAddShape('line')} className="shape-btn" title="Line">
              <span className="shape-icon">―</span>
              <span>Line</span>
            </button>
          </div>
          
          {/* Shape Layers */}
          {shapes && shapes.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div className="section-title">Shape Layers</div>
              <ul className="object-list">
                {shapes.map((shp, idx) => (
                  <li
                    key={shp.id}
                    className={`object-item ${selectedId === shp.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(shp.id)}
                  >
                    {shp.type === 'rectangle' && '▭'}
                    {shp.type === 'circle' && '●'}
                    {shp.type === 'triangle' && '▲'}
                    {shp.type === 'star' && '★'}
                    {shp.type === 'line' && '―'}
                    {' '}{shp.type.charAt(0).toUpperCase() + shp.type.slice(1)} {idx + 1}
                    {selectedId === shp.id && ' ✓'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Shape Controls */}
          {selectedShape && (
            <div className="shape-controls" style={{ marginTop: '24px' }}>
              <div className="section-title">✨ Shape Settings</div>
              
              {/* Fill Color */}
              {selectedShape.type !== 'line' && (
                <div className="control-group">
                  <label>Fill Color:</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={selectedShape.fill || '#3B82F6'}
                      onChange={(e) => handleShapeChange('fill', e.target.value)}
                      className="color-picker-input"
                    />
                    <div className="mini-color-grid">
                      {shapeColors.slice(0, 12).map(color => (
                        <button
                          key={color}
                          className={`mini-color-swatch ${selectedShape.fill === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleShapeChange('fill', color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stroke Color */}
              <div className="control-group">
                <label>Stroke Color:</label>
                <div className="color-picker-row">
                  <input
                    type="color"
                    value={selectedShape.stroke || '#000000'}
                    onChange={(e) => handleShapeChange('stroke', e.target.value)}
                    className="color-picker-input"
                  />
                  <button 
                    className="btn btn-sm"
                    onClick={() => handleShapeChange('stroke', null)}
                  >
                    No Stroke
                  </button>
                </div>
              </div>
              
              {/* Stroke Width */}
              <div className="control-group">
                <label>Stroke Width: {selectedShape.strokeWidth || 0}px</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={selectedShape.strokeWidth || 0}
                  onChange={(e) => handleShapeChange('strokeWidth', parseInt(e.target.value))}
                  className="opacity-slider"
                />
              </div>
              
              {/* Rectangle Corner Radius */}
              {selectedShape.type === 'rectangle' && (
                <div className="control-group">
                  <label>Corner Radius: {selectedShape.cornerRadius || 0}px</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedShape.cornerRadius || 0}
                    onChange={(e) => handleShapeChange('cornerRadius', parseInt(e.target.value))}
                    className="opacity-slider"
                  />
                </div>
              )}
              
              {/* Star Points */}
              {selectedShape.type === 'star' && (
                <div className="control-group">
                  <label>Points: {selectedShape.numPoints || 5}</label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    value={selectedShape.numPoints || 5}
                    onChange={(e) => handleShapeChange('numPoints', parseInt(e.target.value))}
                    className="opacity-slider"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="editor-header">
        <div className="editor-title">Design Editor</div>
      </div>

      <div className="editor-content">

      <div className="editor-section">
        {/* Auto Preview Toggle */}
        <div className="auto-preview-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoPreview}
              onChange={(e) => setAutoPreview(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            {autoPreview ? '🔄 Auto Preview ON' : '⏸️ Auto Preview OFF'}
          </span>
        </div>
        
        <button onClick={onPreview} className="btn btn-primary btn-block">
          🎨 Preview on 3D Model
        </button>
      </div>

      <div className="editor-section">
        <div className="section-title">Canvas</div>
        <div className="konva-wrapper">
          <div ref={containerRef} className="konva-container">
        {templateImg && (
          <Stage
            ref={stageRef}
            width={displaySize.width}
            height={displaySize.height}
            scaleX={displaySize.width / templateImg.width}
            scaleY={displaySize.height / templateImg.height}
            onMouseDown={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) { setSelectedId(null); }
            }}
          >
            <Layer name="template-layer">
              <Image image={templateImg} width={templateImg.width} height={templateImg.height} listening={false} />
            </Layer>
            <Layer name="design-layer">
              {shapes && shapes.map(shp => (
                <DraggableObject key={shp.id} obj={shp} isSelected={shp.id === selectedId}
                                 onSelect={setSelectedId} onChange={handleObjectChange} />
              ))}
              {images.map(img => (
                <DraggableObject key={img.id} obj={img} isSelected={img.id === selectedId}
                                 onSelect={setSelectedId} onChange={handleObjectChange} />
              ))}
              {texts.map(txt => (
                <DraggableObject key={txt.id} obj={txt} isSelected={txt.id === selectedId}
                                 onSelect={setSelectedId} onChange={handleObjectChange} />
              ))}
            </Layer>
          </Stage>
        )}
          </div>
        </div>
      </div>

      {selectedId && (
        <div className="editor-section">
          <div className="selected-panel">
            <div className="selected-panel-title">✨ Object Selected: {selectedId}</div>
            <button onClick={handleDelete} className="btn btn-danger btn-block">
              🗑️ Delete Object
            </button>
          </div>
        </div>
      )}

      <div className="editor-section">
        <div className="tools-area">
          {renderActiveTool()}
        </div>
      </div>
      </div>
    </>
  );
}