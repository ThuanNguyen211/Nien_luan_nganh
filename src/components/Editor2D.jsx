// src/components/Editor2D.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Text, Transformer } from 'react-konva';
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
    rotation: obj.rotation,
    scaleX: obj.scale,
    scaleY: obj.scale,
    draggable: true,
    onClick: (e) => { e.cancelBubble = true; onSelect(obj.id); },
    onTap: (e) => { e.cancelBubble = true; onSelect(obj.id); },
    onDragEnd: (e) => onChange(e.target),
    onTransformEnd: (e) => onChange(e.target),
  };

  let element;
  if (obj.type === 'image' && imgStatus === 'loaded' && img) {
    element = <Image {...commonProps} image={img} width={img.width} height={img.height} />;
  } else if (obj.type === 'text') {
    element = <Text {...commonProps} text={obj.text} fill={obj.fill} fontSize={obj.fontSize} fontFamily={obj.fontFamily} />;
  }

  return (
    <>
      {element}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
          keepRatio={obj.type === 'image'}
          enabledAnchors={obj.type === 'image' ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : undefined}
          rotateEnabled={true}
        />
      )}
    </>
  );
};

const palette = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#F0F0F0', '#CCCCCC', '#999999', '#666666', '#333333', '#1A1A1A',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#FF9800', '#FF5722',
  '#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50', '#009688', '#00BCD4',
  '#03A9F4', '#2196F3', '#3F51B5', '#607D8B', '#9E9E9E', '#795548',
  '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#FFCCBC', '#D7CCC8',
  '#C8E6C9', '#B2EBF2', '#B3E5FC', '#C5CAE9', '#F5F5F5', '#FFE0B2',
];

export function Editor2D({
  stageRef,
  activeTool,
  shirtColor, setShirtColor,
  images, setImages,
  texts, setTexts,
  onPreview
}) {
  const [templateImg] = useImage('/tshirt_uv_map.png');
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);

  const [displaySize, setDisplaySize] = useState({ width: 800, height: 1000 });

  useEffect(() => {
    if (templateImg && containerRef.current) {
      const maxWidth = containerRef.current.clientWidth;
      const maxHeight = 400; // ←←← GIỚI HẠN CHIỀU CAO HIỂN THỊ

      const scaleX = maxWidth / templateImg.width;
      const scaleY = maxHeight / templateImg.height;
      const scale = Math.min(scaleX, scaleY, 1);

      setDisplaySize({
        width: templateImg.width * scale,
        height: templateImg.height * scale,
      });
    }
  }, [templateImg]);

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
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
    };
    setTexts(prev => [...prev, newText]);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setImages(prev => prev.filter(img => img.id !== selectedId));
    setTexts(prev => prev.filter(txt => txt.id !== selectedId));
    setSelectedId(null);
  };

  const renderActiveTool = () => {
    if (!activeTool) return null;

    if (activeTool === 'colors') {
      return (
        <div>
          <div className="section-title">🎨 Shirt Color</div>
          <div className="color-grid">
            {palette.map(color => (
              <button
                key={color}
                className={`color-swatch ${shirtColor === color ? 'selected' : ''}`}
                onClick={() => setShirtColor(color)}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      );
    }

    if (activeTool === 'images') {
      return (
        <div>
          <div className="section-title">🖼️ Upload Image</div>
          <input
            type="file"
            accept="image/*"
            onChange={handleAddImage}
            className="input-file"
          />
          {images.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div className="section-title">Image Layers</div>
              <ul className="object-list">
                {images.map(img => (
                  <li
                    key={img.id}
                    className={`object-item ${selectedId === img.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(img.id)}
                  >
                    📷 {img.id} {selectedId === img.id && '✓'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (activeTool === 'text') {
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
                    📝 {txt.text} {selectedId === txt.id && '✓'}
                  </li>
                ))}
              </ul>
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
        {/* <div className="editor-subtitle">Customize your T-shirt design</div> */}
      </div>

      <div className="editor-content">

      <div className="editor-section">
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