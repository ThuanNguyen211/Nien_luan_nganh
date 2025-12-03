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

  useEffect(() => {
    if (scene) {
      scene.traverse(child => {
        if (child.isMesh) console.log(`Mesh: ${child.name}`);
      });
    }
  }, [scene]);

  const customMaterial = useMemo(() => {
    let baseMat = materials?.['Material.001'] || (materials && materials[Object.keys(materials)[0]]);
    if (!baseMat) {
      console.warn('Using fallback material');
      return new THREE.MeshStandardMaterial({ color: shirtColor });
    }
    const mat = baseMat.clone();
    mat.color.set(shirtColor);
    mat.map = designTexture ? design : null;
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