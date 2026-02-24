import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/RGBELoader.js';

function getGalleryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || 'test';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const galleryId = getGalleryId();
const roomScale = 1.5;
const roomWidth = 6 * roomScale;
const roomDepth = 8 * roomScale;
const roomHeight = 4.5 * roomScale;
const wallThickness = 0.25;
const playerHeight = 1.6;
const playerMargin = 0.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e6df);
scene.fog = new THREE.FogExp2(0xaaaaaa, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, playerHeight, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

new RGBELoader().load(
  'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/textures/equirectangular/studio_small_09_2k.hdr',
  (texture) => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.environment = envMap;

    texture.dispose();
    pmrem.dispose();
  }
);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
scene.add(ambientLight);

const keyLight = new THREE.SpotLight(0xfff8ee, 165, 28, Math.PI / 4, 0.38, 1.5);
keyLight.position.set(0, roomHeight - 0.1, 0.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.bias = -0.00008;
keyLight.shadow.normalBias = 0.015;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xf0f4ff, 0.3);
fillLight.position.set(-2, roomHeight * 0.75, 2);
scene.add(fillLight);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

function createWoodFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  const floorGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  floorGradient.addColorStop(0, '#a77a4b');
  floorGradient.addColorStop(1, '#9a6f43');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const plankCount = 22;
  const plankWidth = canvas.width / plankCount;

  for (let i = 0; i < plankCount; i += 1) {
    const hue = 31 + Math.random() * 3;
    const sat = 40 + Math.random() * 5;
    const lum = 42 + Math.random() * 6;
    ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;

    const x = i * plankWidth;
    ctx.fillRect(x, 0, plankWidth, canvas.height);

    for (let y = 0; y < canvas.height; y += 9) {
      const alpha = 0.02 + Math.random() * 0.03;
      const length = 14 + Math.random() * 16;
      ctx.fillStyle = `rgba(68, 46, 26, ${alpha})`;
      ctx.fillRect(x + Math.random() * plankWidth * 0.25, y, length, 1.4 + Math.random() * 1.6);
    }

    for (let g = 0; g < 80; g += 1) {
      const gx = x + Math.random() * plankWidth;
      const gy = Math.random() * canvas.height;
      ctx.strokeStyle = `rgba(82, 57, 35, ${0.03 + Math.random() * 0.04})`;
      ctx.lineWidth = 0.7 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + (Math.random() - 0.5) * 12, gy + 8 + Math.random() * 18, gx + (Math.random() - 0.5) * 6, gy + 16 + Math.random() * 24);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(44, 27, 14, 0.16)';
    ctx.fillRect(x + plankWidth - 1.8, 0, 1.8, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.15, 2.7);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createWoodFloorRoughnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgb(102, 102, 102)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const plankCount = 22;
  const plankWidth = canvas.width / plankCount;

  for (let i = 0; i < plankCount; i += 1) {
    const x = i * plankWidth;
    const plankTone = 88 + Math.random() * 15;
    ctx.fillStyle = `rgb(${plankTone}, ${plankTone}, ${plankTone})`;
    ctx.fillRect(x, 0, plankWidth, canvas.height);

    for (let y = 0; y < canvas.height; y += 10) {
      const streak = 92 + Math.random() * 14;
      ctx.fillStyle = `rgb(${streak}, ${streak}, ${streak})`;
      ctx.fillRect(x, y, plankWidth, 1.2);
    }

    ctx.fillStyle = 'rgb(116, 116, 116)';
    ctx.fillRect(x + plankWidth - 1.8, 0, 1.8, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.15, 2.7);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createPlasterWallMaps() {
  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const aoCanvas = document.createElement('canvas');
  [colorCanvas, heightCanvas, roughnessCanvas, aoCanvas].forEach((c) => {
    c.width = 1024;
    c.height = 1024;
  });

  const colorCtx = colorCanvas.getContext('2d');
  const heightCtx = heightCanvas.getContext('2d');
  const roughCtx = roughnessCanvas.getContext('2d');
  const aoCtx = aoCanvas.getContext('2d');

  colorCtx.fillStyle = '#c8cdd0';
  colorCtx.fillRect(0, 0, 1024, 1024);

  const sideGradient = colorCtx.createLinearGradient(0, 0, 1024, 0);
  sideGradient.addColorStop(0, 'rgba(104, 112, 120, 0.085)');
  sideGradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.015)');
  sideGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  sideGradient.addColorStop(0.72, 'rgba(255, 255, 255, 0.015)');
  sideGradient.addColorStop(1, 'rgba(97, 106, 112, 0.085)');
  colorCtx.fillStyle = sideGradient;
  colorCtx.fillRect(0, 0, 1024, 1024);

  roughCtx.fillStyle = 'rgb(164, 164, 164)';
  roughCtx.fillRect(0, 0, 1024, 1024);

  heightCtx.fillStyle = 'rgb(128, 128, 255)';
  heightCtx.fillRect(0, 0, 1024, 1024);

  aoCtx.fillStyle = 'rgb(228, 228, 228)';
  aoCtx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 3500; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = 0.02 + Math.random() * 0.03;
    const size = 0.8 + Math.random() * 1.8;
    colorCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    colorCtx.fillRect(x, y, size, size);

    const shadowAlpha = 0.018 + Math.random() * 0.03;
    colorCtx.fillStyle = `rgba(98, 104, 110, ${shadowAlpha})`;
    colorCtx.fillRect(x + Math.random() * 2, y + Math.random() * 2, size, size);
  }

  for (let i = 0; i < 7000; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.25 + Math.random() * 0.9;
    const shade = 198 + Math.random() * 24;
    heightCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    heightCtx.beginPath();
    heightCtx.arc(x, y, radius, 0, Math.PI * 2);
    heightCtx.fill();

    const aoShade = 182 + Math.random() * 38;
    aoCtx.fillStyle = `rgba(${aoShade}, ${aoShade}, ${aoShade}, ${0.06 + Math.random() * 0.09})`;
    aoCtx.beginPath();
    aoCtx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    aoCtx.fill();
  }

  for (let i = 0; i < 750; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = 2 + Math.random() * 4;
    const strokeAlpha = 0.025 + Math.random() * 0.03;
    heightCtx.strokeStyle = `rgba(138, 138, 138, ${strokeAlpha})`;
    heightCtx.lineWidth = 0.55;
    heightCtx.beginPath();
    heightCtx.moveTo(x, y);
    heightCtx.lineTo(x + len, y + (Math.random() - 0.5) * 2);
    heightCtx.stroke();

    aoCtx.strokeStyle = `rgba(170, 170, 170, ${strokeAlpha * 1.2})`;
    aoCtx.lineWidth = 0.8;
    aoCtx.beginPath();
    aoCtx.moveTo(x, y);
    aoCtx.lineTo(x + len * 1.2, y + (Math.random() - 0.5) * 2.6);
    aoCtx.stroke();
  }

  for (let i = 0; i < 2000; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const roughnessTone = 132 + Math.random() * 54;
    roughCtx.fillStyle = `rgb(${roughnessTone}, ${roughnessTone}, ${roughnessTone})`;
    roughCtx.fillRect(x, y, 1.4 + Math.random() * 2.8, 1.4 + Math.random() * 2.8);
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  const normalMap = createNormalMapFromHeightCanvas(heightCanvas, 2.2);
  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  const aoMap = new THREE.CanvasTexture(aoCanvas);

  [colorMap, normalMap, roughnessMap, aoMap].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    texture.anisotropy = maxAnisotropy;
  });

  return { colorMap, normalMap, roughnessMap, aoMap };
}

function createNormalMapFromHeightCanvas(heightCanvas, strength = 2) {
  const width = heightCanvas.width;
  const height = heightCanvas.height;
  const sourceCtx = heightCanvas.getContext('2d');
  const sourceData = sourceCtx.getImageData(0, 0, width, height).data;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normalCtx = normalCanvas.getContext('2d');
  const normalImage = normalCtx.createImageData(width, height);
  const normalData = normalImage.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const leftX = (x - 1 + width) % width;
      const rightX = (x + 1) % width;
      const upY = (y - 1 + height) % height;
      const downY = (y + 1) % height;

      const left = sourceData[(y * width + leftX) * 4] / 255;
      const right = sourceData[(y * width + rightX) * 4] / 255;
      const up = sourceData[(upY * width + x) * 4] / 255;
      const down = sourceData[(downY * width + x) * 4] / 255;

      const dx = (right - left) * strength;
      const dy = (down - up) * strength;
      const normal = new THREE.Vector3(-dx, -dy, 1).normalize();

      normalData[index] = (normal.x * 0.5 + 0.5) * 255;
      normalData[index + 1] = (normal.y * 0.5 + 0.5) * 255;
      normalData[index + 2] = (normal.z * 0.5 + 0.5) * 255;
      normalData[index + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImage, 0, 0);
  return new THREE.CanvasTexture(normalCanvas);
}

function createCeilingPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e3d3bd';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = 'rgba(168, 150, 124, 0.58)';
  ctx.lineWidth = 4;
  const step = 170;

  for (let x = step; x < 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  for (let y = step; y < 1024; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createGoldFrameMaterialMaps() {
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  [colorCanvas, bumpCanvas, roughCanvas].forEach((c) => {
    c.width = 512;
    c.height = 512;
  });

  const colorCtx = colorCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');

  colorCtx.fillStyle = '#a28667';
  colorCtx.fillRect(0, 0, 512, 512);

  roughCtx.fillStyle = 'rgb(118, 118, 118)';
  roughCtx.fillRect(0, 0, 512, 512);

  bumpCtx.fillStyle = 'rgb(138, 138, 138)';
  bumpCtx.fillRect(0, 0, 512, 512);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  [map, bumpMap, roughnessMap].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.4, 1.4);
    texture.anisotropy = maxAnisotropy;
  });

  return { map, bumpMap, roughnessMap };
}

function createDoorWoodMaps() {
  const size = 1024;
  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const aoCanvas = document.createElement('canvas');
  [colorCanvas, heightCanvas, roughCanvas, aoCanvas].forEach((c) => {
    c.width = size;
    c.height = size;
  });

  const colorCtx = colorCanvas.getContext('2d');
  const heightCtx = heightCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const aoCtx = aoCanvas.getContext('2d');

  const baseGradient = colorCtx.createLinearGradient(0, 0, size, size);
  baseGradient.addColorStop(0, '#8f5b36');
  baseGradient.addColorStop(1, '#724726');
  colorCtx.fillStyle = baseGradient;
  colorCtx.fillRect(0, 0, size, size);

  heightCtx.fillStyle = 'rgb(130,130,130)';
  heightCtx.fillRect(0, 0, size, size);

  const roughGradient = roughCtx.createLinearGradient(0, 0, size, 0);
  roughGradient.addColorStop(0, 'rgb(112,112,112)');
  roughGradient.addColorStop(0.5, 'rgb(152,152,152)');
  roughGradient.addColorStop(1, 'rgb(112,112,112)');
  roughCtx.fillStyle = roughGradient;
  roughCtx.fillRect(0, 0, size, size);

  const handleWear = roughCtx.createRadialGradient(size * 0.78, size * 0.5, size * 0.03, size * 0.78, size * 0.5, size * 0.16);
  handleWear.addColorStop(0, 'rgba(72,72,72,0.8)');
  handleWear.addColorStop(1, 'rgba(72,72,72,0)');
  roughCtx.fillStyle = handleWear;
  roughCtx.fillRect(0, 0, size, size);

  aoCtx.fillStyle = 'rgb(228,228,228)';
  aoCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2600; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = 18 + Math.random() * 42;
    const alpha = 0.04 + Math.random() * 0.08;

    colorCtx.strokeStyle = `rgba(58, 36, 18, ${alpha})`;
    colorCtx.lineWidth = 0.8 + Math.random() * 1.4;
    colorCtx.beginPath();
    colorCtx.moveTo(x, y);
    colorCtx.lineTo(x + length, y + (Math.random() - 0.5) * 8);
    colorCtx.stroke();

    const heightTone = 118 + Math.random() * 30;
    heightCtx.strokeStyle = `rgb(${heightTone}, ${heightTone}, ${heightTone})`;
    heightCtx.lineWidth = 0.6 + Math.random() * 1.2;
    heightCtx.beginPath();
    heightCtx.moveTo(x, y);
    heightCtx.lineTo(x + length, y + (Math.random() - 0.5) * 5);
    heightCtx.stroke();
  }

  const woodColor = new THREE.CanvasTexture(colorCanvas);
  woodColor.colorSpace = THREE.SRGBColorSpace;
  const woodNormal = createNormalMapFromHeightCanvas(heightCanvas, 2.6);
  const woodRoughness = new THREE.CanvasTexture(roughCanvas);
  const woodAO = new THREE.CanvasTexture(aoCanvas);

  [woodColor, woodNormal, woodRoughness, woodAO].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    texture.anisotropy = maxAnisotropy;
  });

  return { woodColor, woodNormal, woodRoughness, woodAO };
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomDepth),
  new THREE.MeshStandardMaterial({
    map: createWoodFloorTexture(),
    roughnessMap: createWoodFloorRoughnessMap(),
    roughness: 0.4,
    metalness: 0.05,
    envMapIntensity: 1.5
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const ceilingMaterial = new THREE.MeshStandardMaterial({
  map: createCeilingPanelTexture(),
  color: 0xe7d9c4,
  roughness: 0.67,
  metalness: 0
});
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

const wallMaps = createPlasterWallMaps();
const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallMaps.colorMap,
  normalMap: wallMaps.normalMap,
  normalScale: new THREE.Vector2(0.65, 0.65),
  roughnessMap: wallMaps.roughnessMap,
  aoMap: wallMaps.aoMap,
  aoMapIntensity: 1,
  roughness: 1,
  metalness: 0
});

function createWallGeometry(width, height, depth) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(geometry.attributes.uv.array, 2));
  return geometry;
}

function createWall(width, height, depth, posX, posY, posZ, rotY = 0) {
  const wall = new THREE.Mesh(createWallGeometry(width, height, depth), wallMaterial);
  wall.position.set(posX, posY, posZ);
  wall.rotation.y = rotY;
  wall.receiveShadow = true;
  scene.add(wall);
  return wall;
}

createWall(roomWidth, roomHeight, wallThickness, 0, roomHeight / 2, -roomDepth / 2);
createWall(roomWidth, roomHeight, wallThickness, 0, roomHeight / 2, roomDepth / 2);
createWall(roomDepth, roomHeight, wallThickness, -roomWidth / 2, roomHeight / 2, 0, Math.PI / 2);

const doorOpeningWidth = 1.16;
const doorOpeningHeight = 2.34;
const sideDoorCenterZ = -roomDepth / 2 + 1.45;
const sideDoorMinZ = sideDoorCenterZ - doorOpeningWidth / 2;
const sideDoorMaxZ = sideDoorCenterZ + doorOpeningWidth / 2;
const sideWallStart = -roomDepth / 2;
const sideWallEnd = roomDepth / 2;

createWall((sideDoorMinZ - sideWallStart), roomHeight, wallThickness, roomWidth / 2, roomHeight / 2, (sideWallStart + sideDoorMinZ) / 2, Math.PI / 2);
createWall((sideWallEnd - sideDoorMaxZ), roomHeight, wallThickness, roomWidth / 2, roomHeight / 2, (sideDoorMaxZ + sideWallEnd) / 2, Math.PI / 2);
createWall(doorOpeningWidth, roomHeight - doorOpeningHeight, wallThickness, roomWidth / 2, doorOpeningHeight + (roomHeight - doorOpeningHeight) / 2, sideDoorCenterZ, Math.PI / 2);

function createBeveledDoorLeafShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, height);
  shape.lineTo(0, height);
  shape.closePath();
  return shape;
}

function createDoorAssembly() {
  const doorGroup = new THREE.Group();
  doorGroup.name = 'DoorFrame';

  const doorMaps = createDoorWoodMaps();
  const doorMaterial = new THREE.MeshPhysicalMaterial({
    map: doorMaps.woodColor,
    normalMap: doorMaps.woodNormal,
    roughnessMap: doorMaps.woodRoughness,
    aoMap: doorMaps.woodAO,
    roughness: 0.55,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    metalness: 0.02
  });

  const frameDepth = 0.1;
  const jambThickness = 0.1;
  const architraveThickness = 0.03;
  const architraveWidth = 0.11;
  const leafWidth = 0.92;
  const leafHeight = 2.2;
  const leafDepth = 0.045;
  const openingWidth = leafWidth + jambThickness * 2;
  const openingHeight = leafHeight + jambThickness;

  const jambMaterial = new THREE.MeshStandardMaterial({ color: 0xb88d63, roughness: 0.44 });
  const architraveMaterial = new THREE.MeshStandardMaterial({ color: 0xc19a73, roughness: 0.36 });

  const jambLeft = new THREE.Mesh(new THREE.BoxGeometry(jambThickness, openingHeight, frameDepth), jambMaterial);
  jambLeft.position.set(-openingWidth / 2 + jambThickness / 2, openingHeight / 2, 0);
  const jambRight = jambLeft.clone();
  jambRight.position.x *= -1;
  const jambTop = new THREE.Mesh(new THREE.BoxGeometry(openingWidth, jambThickness, frameDepth), jambMaterial);
  jambTop.position.set(0, openingHeight - jambThickness / 2, 0);

  const jamb = new THREE.Group();
  jamb.name = 'Jamb';
  jamb.add(jambLeft, jambRight, jambTop);

  const architrave = new THREE.Group();
  architrave.name = 'Architrave';
  const casingOuterW = openingWidth + architraveWidth * 2;
  const casingOuterH = openingHeight + architraveWidth;
  const casingLeft = new THREE.Mesh(new THREE.BoxGeometry(architraveWidth, casingOuterH, architraveThickness), architraveMaterial);
  casingLeft.position.set(-casingOuterW / 2 + architraveWidth / 2, casingOuterH / 2, frameDepth / 2 + architraveThickness / 2 + 0.004);
  const casingRight = casingLeft.clone();
  casingRight.position.x *= -1;
  const casingTop = new THREE.Mesh(new THREE.BoxGeometry(casingOuterW, architraveWidth, architraveThickness), architraveMaterial);
  casingTop.position.set(0, casingOuterH - architraveWidth / 2, frameDepth / 2 + architraveThickness / 2 + 0.004);
  architrave.add(casingLeft, casingRight, casingTop);

  const leafShape = createBeveledDoorLeafShape(leafWidth, leafHeight);
  const leafGeometry = new THREE.ExtrudeGeometry(leafShape, {
    depth: leafDepth,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1
  });
  leafGeometry.center();
  leafGeometry.setAttribute('uv2', new THREE.Float32BufferAttribute(leafGeometry.attributes.uv.array, 2));

  const doorLeaf = new THREE.Group();
  doorLeaf.name = 'DoorLeaf';
  const leaf = new THREE.Mesh(leafGeometry, doorMaterial);
  leaf.position.set(0, leafHeight / 2, -leafDepth * 0.5);

  const panelMaterial = doorMaterial.clone();
  panelMaterial.clearcoat = 0.45;
  const panelShape = createBeveledDoorLeafShape(leafWidth * 0.35, leafHeight * 0.34);
  const panelGeometry = new THREE.ExtrudeGeometry(panelShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.002,
    bevelSegments: 2
  });
  panelGeometry.center();
  panelGeometry.setAttribute('uv2', new THREE.Float32BufferAttribute(panelGeometry.attributes.uv.array, 2));
  const panelTop = new THREE.Mesh(panelGeometry, panelMaterial);
  panelTop.position.set(0, leafHeight * 0.68, leafDepth * 0.03);
  const panelBottom = panelTop.clone();
  panelBottom.position.y = leafHeight * 0.3;

  const handleMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc0c7cf, metalness: 1, roughness: 0.18, clearcoat: 0.2 });
  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.065, 18), handleMaterial);
  handleStem.rotation.z = Math.PI / 2;
  handleStem.position.set(leafWidth * 0.33, leafHeight * 0.48, leafDepth * 0.68);
  const handleGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.11, 18), handleMaterial);
  handleGrip.rotation.y = Math.PI / 2;
  handleGrip.position.set(leafWidth * 0.39, leafHeight * 0.48, leafDepth * 0.68);
  const handleRosette = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 20), handleMaterial);
  handleRosette.rotation.x = Math.PI / 2;
  handleRosette.position.set(leafWidth * 0.33, leafHeight * 0.48, leafDepth * 0.64);

  const panels = new THREE.Group();
  panels.name = 'Panels';
  panels.add(panelTop, panelBottom);

  const bevelEdges = new THREE.Group();
  bevelEdges.name = 'Bevel edges';
  bevelEdges.add(leaf);

  const handle = new THREE.Group();
  handle.name = 'Handle';
  handle.add(handleStem, handleGrip, handleRosette);

  doorLeaf.add(bevelEdges, panels, handle);

  const gapShadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(leafWidth * 0.94, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24 })
  );
  gapShadowPlane.name = 'Gap shadow plane';
  gapShadowPlane.rotation.x = -Math.PI / 2;
  gapShadowPlane.position.set(0, 0.003, -0.02);

  doorGroup.add(architrave, jamb, doorLeaf, gapShadowPlane);

  // Keep the architrave flush with the room-side wall while recessing the jamb and leaf into the opening.
  const roomSideWallPlaneX = roomWidth / 2 - wallThickness / 2;
  const architraveRoomSideOffset = frameDepth / 2 + architraveThickness + 0.004;
  doorGroup.position.set(roomSideWallPlaneX + architraveRoomSideOffset, 0, sideDoorCenterZ);
  doorGroup.rotation.y = -Math.PI / 2;
  scene.add(doorGroup);
}

createDoorAssembly();

const cornerChamferMaterial = wallMaterial.clone();
const chamferSize = 0.07;
const chamferDepth = 0.035;
[
  { x: roomWidth / 2 - chamferSize * 0.5, z: roomDepth / 2 - chamferSize * 0.5 },
  { x: -roomWidth / 2 + chamferSize * 0.5, z: roomDepth / 2 - chamferSize * 0.5 },
  { x: roomWidth / 2 - chamferSize * 0.5, z: -roomDepth / 2 + chamferSize * 0.5 },
  { x: -roomWidth / 2 + chamferSize * 0.5, z: -roomDepth / 2 + chamferSize * 0.5 }
].forEach(({ x, z }) => {
  const chamfer = new THREE.Mesh(createWallGeometry(chamferSize, roomHeight, chamferDepth), cornerChamferMaterial);
  chamfer.position.set(x, roomHeight / 2, z);
  chamfer.rotation.y = Math.PI / 4;
  scene.add(chamfer);
});

const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xbf8742, roughness: 0.45, metalness: 0.08 });
const baseboardHeight = 0.1;
const baseboardDepth = 0.04;
const baseboardY = baseboardHeight / 2 + 0.01;

function addTrim(geometry, material, x, y, z) {
  const trim = new THREE.Mesh(geometry, material);
  trim.position.set(x, y, z);
  scene.add(trim);
}

addTrim(new THREE.BoxGeometry(roomWidth, baseboardHeight, baseboardDepth), trimMaterial, 0, baseboardY, -roomDepth / 2 + wallThickness / 2 + 0.01);
addTrim(new THREE.BoxGeometry(roomWidth, baseboardHeight, baseboardDepth), trimMaterial, 0, baseboardY, roomDepth / 2 - wallThickness / 2 - 0.01);
addTrim(new THREE.BoxGeometry(baseboardDepth, baseboardHeight, roomDepth), trimMaterial, -roomWidth / 2 + wallThickness / 2 + 0.01, baseboardY, 0);
addTrim(new THREE.BoxGeometry(baseboardDepth, baseboardHeight, roomDepth), trimMaterial, roomWidth / 2 - wallThickness / 2 - 0.01, baseboardY, 0);

const corniceHeight = 0.12;
const corniceDepth = 0.1;
const corniceY = roomHeight - corniceHeight / 2;
const corniceMaterial = new THREE.MeshStandardMaterial({ color: 0xd2c2ac, roughness: 0.5 });

addTrim(new THREE.BoxGeometry(roomWidth, corniceHeight, corniceDepth), corniceMaterial, 0, corniceY, -roomDepth / 2 + wallThickness / 2 + 0.02);
addTrim(new THREE.BoxGeometry(roomWidth, corniceHeight, corniceDepth), corniceMaterial, 0, corniceY, roomDepth / 2 - wallThickness / 2 - 0.02);
addTrim(new THREE.BoxGeometry(corniceDepth, corniceHeight, roomDepth), corniceMaterial, -roomWidth / 2 + wallThickness / 2 + 0.02, corniceY, 0);
addTrim(new THREE.BoxGeometry(corniceDepth, corniceHeight, roomDepth), corniceMaterial, roomWidth / 2 - wallThickness / 2 - 0.02, corniceY, 0);

function addChandelier(x, z) {
  const chandelier = new THREE.Group();
  const wireLength = 0.15;
  const hangingTopY = roomHeight - wireLength / 2;
  const fixtureY = roomHeight - wireLength;

  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, wireLength, 10),
    new THREE.MeshStandardMaterial({ color: 0x8f6b3a, roughness: 0.48, metalness: 0.55 })
  );
  chain.position.y = hangingTopY;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.018, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0x9f7640, roughness: 0.42, metalness: 0.58 })
  );
  stem.position.y = fixtureY - 0.06;

  const shade = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({ color: 0xf8efd9, roughness: 0.32, metalness: 0 })
  );
  shade.position.y = fixtureY - 0.13;

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2d6 })
  );
  bulb.position.y = fixtureY - 0.12;

  const glow = new THREE.PointLight(0xffe4b7, 4.8, 2.3, 2.2);
  glow.position.y = fixtureY - 0.12;

  chandelier.add(chain, stem, shade, bulb, glow);
  chandelier.position.set(x, 0, z);
  scene.add(chandelier);
}

const chandelierOffsetX = roomWidth * 0.26;
const chandelierOffsetZ = roomDepth * 0.3;
[
  { x: -chandelierOffsetX, z: -chandelierOffsetZ },
  { x: chandelierOffsetX, z: -chandelierOffsetZ },
  { x: -chandelierOffsetX, z: chandelierOffsetZ },
  { x: chandelierOffsetX, z: chandelierOffsetZ }
].forEach(({ x, z }) => addChandelier(x, z));

function addVentGrille() {
  const grille = new THREE.Group();
  const outerWidth = 0.64;
  const outerHeight = 0.28;
  const frameDepth = 0.03;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(outerWidth, outerHeight, frameDepth),
    new THREE.MeshStandardMaterial({ color: 0xdee2e6, roughness: 0.62, metalness: 0.12 })
  );
  grille.add(frame);

  for (let i = 0; i < 6; i += 1) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(outerWidth * 0.84, 0.02, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xc8ced5, roughness: 0.5, metalness: 0.14 })
    );
    slat.position.y = -0.085 + i * 0.034;
    slat.position.z = frameDepth * 0.34;
    slat.rotation.x = -0.22;
    grille.add(slat);
  }

  grille.position.set(roomWidth / 2 - 0.46, roomHeight - 0.32, -roomDepth / 2 + 0.08);
  scene.add(grille);
}

addVentGrille();

function addAirDust() {
  const dustTextureCanvas = document.createElement('canvas');
  dustTextureCanvas.width = 64;
  dustTextureCanvas.height = 64;
  const ctx = dustTextureCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  const dustTexture = new THREE.CanvasTexture(dustTextureCanvas);
  dustTexture.colorSpace = THREE.SRGBColorSpace;

  const dustCount = 79;
  const positions = new Float32Array(dustCount * 3);
  const offsets = new Float32Array(dustCount);
  const velocities = new Float32Array(dustCount * 3);
  const halfWidth = roomWidth / 2 - 0.35;
  const halfDepth = roomDepth / 2 - 0.35;
  const minY = 0.35;
  const maxY = roomHeight - 0.35;

  for (let i = 0; i < dustCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * (halfWidth * 2);
    positions[i * 3 + 1] = minY + Math.random() * (maxY - minY);
    positions[i * 3 + 2] = (Math.random() - 0.5) * (halfDepth * 2);

    const dir = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize();
    const speed = ((0.0035 + Math.random() * 0.0045) / 1.5) * 0.7;
    velocities[i * 3] = dir.x * speed;
    velocities[i * 3 + 1] = dir.y * speed;
    velocities[i * 3 + 2] = dir.z * speed;
    offsets[i] = Math.random() * Math.PI * 2;
  }

  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    map: dustTexture,
    color: 0xf6f1e8,
    size: 0.02,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);
  return { dust, offsets, velocities, halfWidth, halfDepth, minY, maxY };
}

const dustParticles = addAirDust();

function createPlaceholderTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 683;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#8a8a8a';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Нет фото: ${label}`, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addPhoto(url, position, rotationY = 0) {
  const group = new THREE.Group();

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.6),
    new THREE.ShadowMaterial({ opacity: 0.25 })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.01;
  contactShadow.receiveShadow = true;

  const paintingScale = 1.5;
  const maxSide = 1.5 * paintingScale;
  const framePadding = 0.1;
  const frameDepth = 0.084;
  const frameWidth = 0.045;
  const frameCornerRadius = 0.05;

  const goldFrameMaps = createGoldFrameMaterialMaps();
  const frameMaterial = new THREE.MeshStandardMaterial({
    map: goldFrameMaps.map,
    bumpMap: goldFrameMaps.bumpMap,
    bumpScale: 0.035,
    roughnessMap: goldFrameMaps.roughnessMap,
    roughness: 0.26,
    metalness: 0.58,
    color: 0xd2b693,
    emissive: 0x3a2b1d,
    emissiveIntensity: 0.2
  });

  function fitByAspect(texture) {
    const aspect = texture.image.width / texture.image.height;
    if (aspect >= 1) {
      return { width: maxSide, height: maxSide / aspect };
    }
    return { width: maxSide * aspect, height: maxSide };
  }

  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(maxSide, maxSide),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  photo.material.polygonOffset = true;
  photo.material.polygonOffsetFactor = -1;
  photo.material.polygonOffsetUnits = -1;

  const frameGroup = new THREE.Group();
  const frameMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(), frameMaterial);
  const wallShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08, depthWrite: false })
  );
  frameGroup.add(wallShadow);
  frameGroup.add(frameMesh);

  const backLight = new THREE.RectAreaLight(0xffedcf, 0.85, 1.6, 1.1);
  backLight.position.set(0, 0, -0.055);
  backLight.lookAt(0, 0, -1);
  frameGroup.add(backLight);

  function roundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const r = Math.min(radius, hw, hh);

    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  }

  function applySize(texture) {
    const { width, height } = fitByAspect(texture);

    photo.geometry.dispose();
    photo.geometry = new THREE.PlaneGeometry(width, height);

    const outerWidth = width + framePadding;
    const outerHeight = height + framePadding;
    const innerWidth = Math.max(0.05, outerWidth - frameWidth * 2);
    const innerHeight = Math.max(0.05, outerHeight - frameWidth * 2);

    const outerShape = roundedRectShape(outerWidth, outerHeight, frameCornerRadius);
    const innerShape = roundedRectShape(innerWidth, innerHeight, Math.max(0.025, frameCornerRadius - frameWidth * 0.55));
    outerShape.holes = [innerShape];

    frameMesh.geometry.dispose();
    frameMesh.geometry = new THREE.ExtrudeGeometry(outerShape, {
      depth: frameDepth,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.022,
      bevelSegments: 3,
      curveSegments: 24
    });
    frameMesh.geometry.center();

    wallShadow.geometry.dispose();
    wallShadow.geometry = new THREE.PlaneGeometry(outerWidth + 0.03, outerHeight + 0.03);

    backLight.width = outerWidth * 0.92;
    backLight.height = outerHeight * 0.92;
  }

  textureLoader.load(
    url,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      applySize(texture);
      photo.material.map = texture;
      photo.material.needsUpdate = true;
    },
    undefined,
    () => {
      const placeholder = createPlaceholderTexture(url.split('/').pop());
      placeholder.anisotropy = maxAnisotropy;
      applySize(placeholder);
      photo.material.map = placeholder;
      photo.material.needsUpdate = true;
    }
  );

  photo.position.z = 0.055;
  frameGroup.position.z = 0.025;
  wallShadow.position.z = -0.012;

  group.add(frameGroup);
  group.add(photo);
  frameMesh.castShadow = true;
  photo.castShadow = true;
  contactShadow.position.x = position.x;
  contactShadow.position.z = position.z;
  scene.add(contactShadow);

  group.position.set(position.x, position.y, position.z);
  group.rotation.y = rotationY;
  scene.add(group);
}

const basePath = `images/${galleryId}/`;
const wallInset = 0.08;
const photoSpacingScale = 0.8;
const shortWallPhotoOffset = (roomWidth / 4) * photoSpacingScale;
const longWallPhotoOffset = 1.35 * photoSpacingScale;
const photos = [
  { file: '1.jpg', pos: { x: -shortWallPhotoOffset, y: 1.8, z: -roomDepth / 2 + wallInset }, rot: 0 },
  { file: '2.jpg', pos: { x: shortWallPhotoOffset, y: 1.8, z: -roomDepth / 2 + wallInset }, rot: 0 },
  { file: '3.jpg', pos: { x: roomWidth / 2 - wallInset, y: 1.8, z: -longWallPhotoOffset }, rot: -Math.PI / 2 },
  { file: '4.jpg', pos: { x: roomWidth / 2 - wallInset, y: 1.8, z: longWallPhotoOffset }, rot: -Math.PI / 2 },
  { file: '5.jpg', pos: { x: shortWallPhotoOffset, y: 1.8, z: roomDepth / 2 - wallInset }, rot: Math.PI },
  { file: '6.jpg', pos: { x: -shortWallPhotoOffset, y: 1.8, z: roomDepth / 2 - wallInset }, rot: Math.PI },
  { file: '7.jpg', pos: { x: -roomWidth / 2 + wallInset, y: 1.8, z: longWallPhotoOffset }, rot: Math.PI / 2 },
  { file: '8.jpg', pos: { x: -roomWidth / 2 + wallInset, y: 1.8, z: -longWallPhotoOffset }, rot: Math.PI / 2 }
];

photos.forEach((photo) => addPhoto(basePath + photo.file, photo.pos, photo.rot));

const controls = new PointerLockControls(camera, renderer.domElement);

document.body.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => document.body.classList.add('is-locked'));
controls.addEventListener('unlock', () => document.body.classList.remove('is-locked'));

const move = { forward: false, back: false, left: false, right: false };
const speed = 0.055;
const gravity = 0.0108;
const apexGravity = 0.0048;
const jumpVelocity = 0.158;
let verticalVelocity = 0;
let isJumping = false;

const keyMap = {
  KeyW: 'forward',
  KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right'
};

window.addEventListener('keydown', (event) => {
  const dir = keyMap[event.code];
  if (dir) move[dir] = true;

  if (event.code === 'Space' && controls.isLocked && !isJumping) {
    verticalVelocity = jumpVelocity;
    isJumping = true;
  }
});

window.addEventListener('keyup', (event) => {
  const dir = keyMap[event.code];
  if (dir) move[dir] = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function applyBounds() {
  camera.position.x = clamp(camera.position.x, -roomWidth / 2 + playerMargin, roomWidth / 2 - playerMargin);
  camera.position.z = clamp(camera.position.z, -roomDepth / 2 + playerMargin, roomDepth / 2 -playerMargin);

  if (isJumping) {
    const nearApex = verticalVelocity > 0 && verticalVelocity < 0.045;
    verticalVelocity -= nearApex ? apexGravity : gravity;
    camera.position.y += verticalVelocity;

    if (camera.position.y <= playerHeight) {
      camera.position.y = playerHeight;
      verticalVelocity = 0;
      isJumping = false;
    }
  } else {
    camera.position.y = playerHeight;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  if (dustParticles) {
    const positions = dustParticles.dust.geometry.attributes.position.array;
    for (let i = 0; i < dustParticles.offsets.length; i += 1) {
      const idx = i * 3;
      positions[idx] += dustParticles.velocities[idx];
      positions[idx + 1] += dustParticles.velocities[idx + 1] + Math.sin(t * 0.9 + dustParticles.offsets[i]) * 0.00003;
      positions[idx + 2] += dustParticles.velocities[idx + 2];

      if (Math.abs(positions[idx]) > dustParticles.halfWidth) {
        positions[idx] = clamp(positions[idx], -dustParticles.halfWidth, dustParticles.halfWidth);
        dustParticles.velocities[idx] *= -1;
      }

      if (Math.abs(positions[idx + 2]) > dustParticles.halfDepth) {
        positions[idx + 2] = clamp(positions[idx + 2], -dustParticles.halfDepth, dustParticles.halfDepth);
        dustParticles.velocities[idx + 2] *= -1;
      }

      if (positions[idx + 1] > dustParticles.maxY || positions[idx + 1] < dustParticles.minY) {
        positions[idx + 1] = clamp(positions[idx + 1], dustParticles.minY, dustParticles.maxY);
        dustParticles.velocities[idx + 1] *= -1;
      }
    }
    dustParticles.dust.geometry.attributes.position.needsUpdate = true;
  }

  if (controls.isLocked) {
    if (move.forward) controls.moveForward(speed);
    if (move.back) controls.moveForward(-speed);
    if (move.left) controls.moveRight(-speed);
    if (move.right) controls.moveRight(speed);
    applyBounds();
  }

  renderer.render(scene, camera);
}

animate();
