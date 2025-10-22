import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';

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
  stageRef, activeTool,
  shirtColor, setShirtColor,
}) {
  const [templateImg] = useImage('/template.png');
  const [stageSize, setStageSize] = useState({ width: 400, height: 500 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (templateImg && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const scale = containerWidth / templateImg.width;
      setStageSize({
        width: containerWidth,
        height: templateImg.height * scale
      });
    }
  }, [templateImg]);

  const renderActiveTool = () => {
    switch(activeTool) {
      case 'colors':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, marginRight: '10px' }}>Shirt Color</h4>
              <input
                type="color"
                value={shirtColor}
                onChange={(e) => setShirtColor(e.target.value)}
                style={{
                  width: '30px', height: '30px', border: '1px solid #ccc',
                  borderRadius: '50%', padding: 0, cursor: 'pointer'
                }}
                title="Custom Color"
              />
            </div>
            <h4>Palette</h4>
            <div className="color-options">
              {palette.map((hexColor) => (
                <div
                  key={hexColor}
                  className="color-swatch"
                  style={{ background: hexColor }}
                  onClick={() => setShirtColor(hexColor)}
                  title={hexColor}
                />
              ))}
            </div>
          </div>
        );
      case 'images':
        return <div><h4>Add Image</h4><p>(Chức năng đang tạm ẩn)</p></div>;
      case 'text':
        return <div><h4>Add Text</h4><p>(Chức năng đang tạm ẩn)</p></div>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="editor-header">Design UV Map</div>
      <div ref={containerRef} className="konva-container">
        {stageSize.width > 0 && stageSize.height > 0 && templateImg && (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
          >
            <Layer name="template-layer">
              <Image image={templateImg} width={stageSize.width} height={stageSize.height} listening={false} />
            </Layer>
            <Layer name="design-layer">
            </Layer>
          </Stage>
        )}
      </div>
      <hr style={{margin: '20px 0'}} />
      <div className="tools-area">
        {renderActiveTool()}
      </div>
    </div>
  );
}