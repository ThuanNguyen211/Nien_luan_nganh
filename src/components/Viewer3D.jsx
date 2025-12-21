// src/components/Viewer3D.jsx
import React, { Suspense, useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const BLANK_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function Model({ shirtColor, designTexture }) {
  const { scene, materials } = useGLTF('/tshirt.glb');
  const design = useTexture(designTexture || BLANK_TEXTURE);
  if (designTexture) design.flipY = false;

  const customMaterial = useMemo(() => {
    let baseMat = materials?.['Material.001'] || (materials && materials[Object.keys(materials)[0]]);
    if (!baseMat) {
      return new THREE.MeshStandardMaterial({ color: shirtColor });
    }
    const mat = baseMat.clone();
    mat.color.set(shirtColor);
    
    if (designTexture && design) {
      // Tạo canvas để blend texture với màu áo
      const canvas = document.createElement('canvas');
      const img = design.image;
      if (img) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // 1. Flip và vẽ design trước
        ctx.save();
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, -canvas.height);
        ctx.restore();
        
        // 2. Vẽ màu áo PHÍA SAU design (chỉ ở vùng transparent)
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = shirtColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        
        // Tạo texture mới từ canvas
        const blendedTexture = new THREE.CanvasTexture(canvas);
        blendedTexture.flipY = false;
        blendedTexture.needsUpdate = true;
        
        mat.map = blendedTexture;
      }
    } else {
      mat.map = null;
    }
    
    mat.needsUpdate = true;
    
    return mat;
  }, [materials, shirtColor, design, designTexture]);

  useEffect(() => {
    if (!scene || !customMaterial) return;
    let applied = false;
    const targets = ['shirt', 'tshirt', 'body'];
    scene.traverse(child => {
      if (child.isMesh && targets.some(t => child.name.toLowerCase().includes(t))) {
        child.material = customMaterial;
        applied = true;
      }
    });
    if (!applied) {
      scene.traverse(child => {
        if (child.isMesh) child.material = customMaterial;
      });
    }
  }, [scene, customMaterial]);

  return <primitive object={scene} />;
}

export function Viewer3D({ shirtColor, designTexture }) {
  const [maxSize, setMaxSize] = useState(4096);
  const [scaledTex, setScaledTex] = useState(null);

  useEffect(() => {
    if (!designTexture) return setScaledTex(null);
    let mounted = true;
    const img = new Image();
    img.src = designTexture;
    img.onload = () => {
      if (!mounted) return;
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w <= maxSize && h <= maxSize) return setScaledTex(designTexture);
      const scale = Math.min(maxSize / w, maxSize / h);
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      setScaledTex(canvas.toDataURL('image/png'));
    };
    return () => { mounted = false; };
  }, [designTexture, maxSize]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        onCreated={({ gl }) => setMaxSize(gl.capabilities?.maxTextureSize || 4096)}
        camera={{ position: [-0.006, 1.492, 0.712], fov: 75 }}
        style={{ background: '#f0f0f0' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model shirtColor={shirtColor} designTexture={scaledTex || designTexture} />
        </Suspense>
        <OrbitControls target={[0.019, 1.229, -0.031]} />
      </Canvas>
    </div>
  );
}