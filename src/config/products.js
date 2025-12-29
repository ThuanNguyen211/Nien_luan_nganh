// src/config/products.js

export const PRODUCTS = {
  tshirt: {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: '👕',
    model: '/tshirt.glb',
    uvMap: '/tshirt_uv_map.png',
    defaultColor: '#ffffff',
    camera: {
      position: [-0.006, 1.492, 0.712],
      target: [0.019, 1.229, -0.031],
      fov: 75
    },
    meshTargets: ['shirt', 'tshirt', 'body'],
    textureFlip: { x: 1, y: -1 },
    label: 'Áo phông'
  },
  mug: {
    id: 'mug',
    name: 'Mug',
    icon: '☕',
    model: '/mug.glb',
    uvMap: '/mug_uv_map.png',
    defaultColor: '#ffffff',
    camera: {
      position: [0, 0.15, 0.4],
      target: [0, 0.1, 0],
      fov: 50
    },
    meshTargets: ['mug', 'cup', 'body', 'cylinder'],
    textureFlip: { x: -1, y: -1 },
    label: 'Ly sứ'
  },
  cap: {
    id: 'cap',
    name: 'Cap',
    icon: '🧢',
    model: '/cap.glb',
    uvMap: '/cap_uv_map.png',
    defaultColor: '#ffffff',
    camera: {
      position: [0, 0.3, 0.8],
      target: [0, 0.1, 0],
      fov: 50
    },
    meshTargets: ['cap', 'hat', 'body'],
    textureFlip: { x: 1, y: -1 },
    label: 'Nón'
  },
  phoneCase: {
    id: 'phoneCase',
    name: 'Phone Case',
    icon: '📱',
    model: '/phone_case.glb',
    uvMap: '/phone_case_uv_map_.png',
    defaultColor: '#ffffff',
    camera: {
      position: [0, 0, 0.25],
      target: [0, 0, 0],
      fov: 50
    },
    meshTargets: ['case', 'phone', 'body'],
    textureFlip: { x: -1, y: -1 },
    label: 'Ốp điện thoại'
  }
};

export const PRODUCT_ORDER = ['tshirt', 'mug', 'cap', 'phoneCase'];

export const DEFAULT_PRODUCT = 'tshirt';
