// src/components/Viewer3D.jsx
import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei'; // Chỉ import những gì cần
import * as THREE from 'three';

// --- COMPONENT MODEL 3D (Chỉ xử lý màu) ---
function Model({ shirtColor }) {
  const groupRef = useRef();
  const { nodes, materials } = useGLTF('/tshirt.glb'); // Tải model

  // --- TẠO VẬT LIỆU MỚI CHỈ VỚI MÀU SẮC ---
  const customMaterial = useMemo(() => {
    console.log("Creating/Updating material. Color:", shirtColor);

    // Tìm vật liệu gốc (SỬA LẠI TÊN 'FABRIC_1_FRONT_4193' NẾU CẦN)
    const baseMaterialKey = Object.keys(materials).find(key => key === 'FABRIC_1_FRONT_4193') || Object.keys(materials)[0];
    const baseMaterial = materials[baseMaterialKey];

    // Tạo vật liệu standard mới chỉ với màu
    const material = new THREE.MeshStandardMaterial({
        color: shirtColor, // Áp dụng màu áo
        roughness: baseMaterial?.roughness ?? 0.8, // Lấy độ nhám từ gốc hoặc mặc định
        metalness: baseMaterial?.metalness ?? 0.1, // Lấy độ kim loại từ gốc hoặc mặc định
        map: baseMaterial?.map || null // Giữ lại map gốc (nếu có) để áo không bị "trơn"
    });
    // material.needsUpdate = true; // Không cần khi tạo mới trong useMemo với dependency đúng

    return material;
  // Chỉ phụ thuộc vào shirtColor và materials gốc
  }, [materials, shirtColor]);

  // --- Căn giữa thủ công (Giữ nguyên) ---
  useEffect(() => {
    if (groupRef.current) {
        const box = new THREE.Box3().setFromObject(groupRef.current);
        const center = box.getCenter(new THREE.Vector3());
        groupRef.current.position.x += (groupRef.current.position.x - center.x);
        groupRef.current.position.y += (groupRef.current.position.y - center.y);
        groupRef.current.position.z += (groupRef.current.position.z - center.z);
        // console.log("Model centered manually."); // Có thể comment bớt log
    }
  }, []);

  // Tìm geometry (Sửa lại tên nếu cần - Vd: 'Object_4')
  const mainGeometry = nodes.Object_4?.geometry;
  const otherGeometries = [
      nodes.Object_5?.geometry,
      nodes.Object_6?.geometry,
      nodes.Object_7?.geometry
  ].filter(Boolean);

  // Tạo key để ép re-render mesh khi màu thay đổi
  const meshKey = `${shirtColor}`;

  return (
    // Sử dụng rotation/scale phù hợp
    <group ref={groupRef} dispose={null} rotation={[-Math.PI / 2, Math.PI, Math.PI]} scale={0.007}>
      {/* Áp dụng vật liệu mới và key */}
      {mainGeometry && (
          <mesh key={meshKey + '-main'} geometry={mainGeometry} material={customMaterial} />
      )}
      {otherGeometries.map((geom, index) => (
          <mesh key={meshKey + '-' + index} geometry={geom} material={customMaterial} />
      ))}
    </group>
  );
}
// --- KẾT THÚC COMPONENT MODEL ---

// --- COMPONENT VIEWER CHÍNH ---
export function Viewer3D({ shirtColor }) { // Chỉ nhận shirtColor
  return (
      <Canvas
        // Sử dụng camera/target bạn đã tìm được
        camera={{ position: [0.289, -9.282, 5.142], fov: 75 }}
        style={{ background: '#f0f0f0' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model
            shirtColor={shirtColor}
            // Không truyền designTexture nữa
          />
        </Suspense>
        {/* Sử dụng camera/target bạn đã tìm được */}
        <OrbitControls target={[-0.252, -9.807, -0.347]} />
      </Canvas>
  );
}