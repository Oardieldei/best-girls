import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

function getGalleryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || 'test';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const galleryId = getGalleryId();
const roomWidth = 6;
const roomDepth = 8;
const roomHeight = 4.5;
const playerHeight = 1.6;
const playerMargin = 0.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e6df);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, playerHeight, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
scene.add(ambientLight);

const keyLight = new THREE.SpotLight(0xfff8ee, 220, 28, Math.PI / 4, 0.38, 1.5);
keyLight.position.set(0, roomHeight - 0.1, 0.4);
keyLight.castShadow = false;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xf0f4ff, 0.42);
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
  const bumpCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  [colorCanvas, bumpCanvas, roughnessCanvas].forEach((c) => {
    c.width = 1024;
    c.height = 1024;
  });

  const colorCtx = colorCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const roughCtx = roughnessCanvas.getContext('2d');

  const gradient = colorCtx.createLinearGradient(0, 1024, 0, 0);
  gradient.addColorStop(0, '#b6bcc1');
  gradient.addColorStop(0.38, '#c3c9ce');
  gradient.addColorStop(0.72, '#cfd3d0');
  gradient.addColorStop(1, '#dadcd4');
  colorCtx.fillStyle = gradient;
  colorCtx.fillRect(0, 0, 1024, 1024);

  const sideGradient = colorCtx.createLinearGradient(0, 0, 1024, 0);
  sideGradient.addColorStop(0, 'rgba(104, 112, 120, 0.085)');
  sideGradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.015)');
  sideGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  sideGradient.addColorStop(0.72, 'rgba(255, 255, 255, 0.015)');
  sideGradient.addColorStop(1, 'rgba(97, 106, 112, 0.085)');
  colorCtx.fillStyle = sideGradient;
  colorCtx.fillRect(0, 0, 1024, 1024);

  const roughGradient = roughCtx.createLinearGradient(0, 1024, 0, 0);
  roughGradient.addColorStop(0, 'rgb(178, 178, 178)');
  roughGradient.addColorStop(1, 'rgb(146, 146, 146)');
  roughCtx.fillStyle = roughGradient;
  roughCtx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 8500; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.25 + Math.random() * 0.9;
    const shade = 198 + Math.random() * 24;
    bumpCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, radius, 0, Math.PI * 2);
    bumpCtx.fill();

    const wallDust = Math.random() > 0.5 ? 'rgba(74, 72, 66, 0.012)' : 'rgba(243, 243, 238, 0.012)';
    colorCtx.fillStyle = wallDust;
    colorCtx.fillRect(x, y, 2.2, 2.2);
  }

  for (let i = 0; i < 750; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = 2 + Math.random() * 4;
    bumpCtx.strokeStyle = `rgba(138, 138, 138, ${0.025 + Math.random() * 0.03})`;
    bumpCtx.lineWidth = 0.55;
    bumpCtx.beginPath();
    bumpCtx.moveTo(x, y);
    bumpCtx.lineTo(x + len, y + (Math.random() - 0.5) * 2);
    bumpCtx.stroke();
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);

  [colorMap, bumpMap, roughnessMap].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    texture.anisotropy = maxAnisotropy;
  });

  return { colorMap, bumpMap, roughnessMap };
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

  const goldGradient = colorCtx.createLinearGradient(0, 0, 512, 0);
  goldGradient.addColorStop(0, '#f4e49b');
  goldGradient.addColorStop(0.35, '#ddb75b');
  goldGradient.addColorStop(0.7, '#f6e6a2');
  goldGradient.addColorStop(1, '#b98b2c');
  colorCtx.fillStyle = goldGradient;
  colorCtx.fillRect(0, 0, 512, 512);

  roughCtx.fillStyle = 'rgb(110, 110, 110)';
  roughCtx.fillRect(0, 0, 512, 512);

  bumpCtx.fillStyle = 'rgb(128, 128, 128)';
  bumpCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 16) {
    const offset = (y / 16) % 2 ? 8 : 0;
    for (let x = -16; x < 512; x += 16) {
      const px = x + offset;
      const wave = Math.sin((px + y) * 0.028);
      const lineAlpha = 0.07 + Math.random() * 0.04;

      colorCtx.strokeStyle = `rgba(255, 241, 178, ${lineAlpha})`;
      colorCtx.lineWidth = 1.1;
      colorCtx.beginPath();
      colorCtx.moveTo(px - 7, y + 2 + wave * 1.8);
      colorCtx.lineTo(px + 9, y + 5 - wave * 1.6);
      colorCtx.stroke();

      const bumpTone = 126 + Math.random() * 24;
      bumpCtx.strokeStyle = `rgb(${bumpTone}, ${bumpTone}, ${bumpTone})`;
      bumpCtx.lineWidth = 1.2;
      bumpCtx.beginPath();
      bumpCtx.moveTo(px - 8, y + 2 + wave);
      bumpCtx.lineTo(px + 9, y + 5 - wave);
      bumpCtx.stroke();

      const roughValue = 96 + Math.random() * 18;
      roughCtx.fillStyle = `rgb(${roughValue}, ${roughValue}, ${roughValue})`;
      roughCtx.fillRect(px - 5, y + 1, 12, 8);
    }
  }

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

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomDepth),
  new THREE.MeshStandardMaterial({
    map: createWoodFloorTexture(),
    roughnessMap: createWoodFloorRoughnessMap(),
    roughness: 0.48,
    metalness: 0.06
  })
);
floor.rotation.x = -Math.PI / 2;
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
  bumpMap: wallMaps.bumpMap,
  bumpScale: 0.018,
  roughnessMap: wallMaps.roughnessMap,
  roughness: 0.86,
  metalness: 0
});

function createWall(width, height, depth, posX, posY, posZ, rotY = 0) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
  wall.position.set(posX, posY, posZ);
  wall.rotation.y = rotY;
  scene.add(wall);
  return wall;
}

createWall(roomWidth, roomHeight, 0.1, 0, roomHeight / 2, -roomDepth / 2);
createWall(roomWidth, roomHeight, 0.1, 0, roomHeight / 2, roomDepth / 2);
createWall(roomDepth, roomHeight, 0.1, -roomWidth / 2, roomHeight / 2, 0, Math.PI / 2);
createWall(roomDepth, roomHeight, 0.1, roomWidth / 2, roomHeight / 2, 0, Math.PI / 2);

const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xbf8742, roughness: 0.45, metalness: 0.08 });
const baseboardHeight = 0.1;
const baseboardDepth = 0.04;
const baseboardY = baseboardHeight / 2 + 0.01;

function addTrim(geometry, material, x, y, z) {
  const trim = new THREE.Mesh(geometry, material);
  trim.position.set(x, y, z);
  scene.add(trim);
}

addTrim(new THREE.BoxGeometry(roomWidth, baseboardHeight, baseboardDepth), trimMaterial, 0, baseboardY, -roomDepth / 2 + 0.06);
addTrim(new THREE.BoxGeometry(roomWidth, baseboardHeight, baseboardDepth), trimMaterial, 0, baseboardY, roomDepth / 2 - 0.06);
addTrim(new THREE.BoxGeometry(baseboardDepth, baseboardHeight, roomDepth), trimMaterial, -roomWidth / 2 + 0.06, baseboardY, 0);
addTrim(new THREE.BoxGeometry(baseboardDepth, baseboardHeight, roomDepth), trimMaterial, roomWidth / 2 - 0.06, baseboardY, 0);

const corniceHeight = 0.12;
const corniceDepth = 0.1;
const corniceY = roomHeight - corniceHeight / 2;
const corniceMaterial = new THREE.MeshStandardMaterial({ color: 0xd2c2ac, roughness: 0.5 });

addTrim(new THREE.BoxGeometry(roomWidth, corniceHeight, corniceDepth), corniceMaterial, 0, corniceY, -roomDepth / 2 + 0.08);
addTrim(new THREE.BoxGeometry(roomWidth, corniceHeight, corniceDepth), corniceMaterial, 0, corniceY, roomDepth / 2 - 0.08);
addTrim(new THREE.BoxGeometry(corniceDepth, corniceHeight, roomDepth), corniceMaterial, -roomWidth / 2 + 0.08, corniceY, 0);
addTrim(new THREE.BoxGeometry(corniceDepth, corniceHeight, roomDepth), corniceMaterial, roomWidth / 2 - 0.08, corniceY, 0);

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

  const maxSide = 1.5;
  const framePadding = 0.14;
  const frameDepth = 0.12;
  const frameWidth = 0.1;
  const frameCornerRadius = 0.1;

  const goldFrameMaps = createGoldFrameMaterialMaps();
  const frameMaterial = new THREE.MeshStandardMaterial({
    map: goldFrameMaps.map,
    bumpMap: goldFrameMaps.bumpMap,
    bumpScale: 0.035,
    roughnessMap: goldFrameMaps.roughnessMap,
    roughness: 0.33,
    metalness: 0.62,
    color: 0xf0d98a
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
  frameGroup.add(frameMesh);

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

  photo.position.z = -0.02;
  frameGroup.position.z = -frameDepth * 0.5;

  group.add(frameGroup);
  group.add(photo);
  group.position.set(position.x, position.y, position.z);
  group.rotation.y = rotationY;
  scene.add(group);
}

const basePath = `images/${galleryId}/`;
const wallInset = 0.14;
const photos = [
  { file: '1.jpg', pos: { x: -1.5, y: 1.8, z: -roomDepth / 2 + wallInset }, rot: 0 },
  { file: '2.jpg', pos: { x: 1.5, y: 1.8, z: -roomDepth / 2 + wallInset }, rot: 0 },
  { file: '3.jpg', pos: { x: roomWidth / 2 - wallInset, y: 1.8, z: -1.8 }, rot: -Math.PI / 2 },
  { file: '4.jpg', pos: { x: roomWidth / 2 - wallInset, y: 1.8, z: 1.8 }, rot: -Math.PI / 2 },
  { file: '5.jpg', pos: { x: 1.5, y: 1.8, z: roomDepth / 2 - wallInset }, rot: Math.PI },
  { file: '6.jpg', pos: { x: -1.5, y: 1.8, z: roomDepth / 2 - wallInset }, rot: Math.PI },
  { file: '7.jpg', pos: { x: -roomWidth / 2 + wallInset, y: 1.8, z: 1.8 }, rot: Math.PI / 2 },
  { file: '8.jpg', pos: { x: -roomWidth / 2 + wallInset, y: 1.8, z: -1.8 }, rot: Math.PI / 2 }
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
