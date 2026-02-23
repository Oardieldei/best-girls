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
scene.background = new THREE.Color(0xf5f5f2);

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

  ctx.fillStyle = '#8f6b46';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const plankCount = 18;
  const plankWidth = canvas.width / plankCount;

  for (let i = 0; i < plankCount; i += 1) {
    const hue = 28 + Math.random() * 8;
    const sat = 32 + Math.random() * 10;
    const lum = 34 + Math.random() * 12;
    ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;

    const x = i * plankWidth;
    ctx.fillRect(x, 0, plankWidth, canvas.height);

    for (let y = 0; y < canvas.height; y += 12) {
      const alpha = 0.045 + Math.random() * 0.055;
      ctx.fillStyle = `rgba(35, 23, 12, ${alpha})`;
      ctx.fillRect(x, y, plankWidth, 5 + Math.random() * 5);
    }

    ctx.fillStyle = 'rgba(18, 10, 5, 0.26)';
    ctx.fillRect(x + plankWidth - 2.2, 0, 2.2, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.2, 2.6);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createWoodFloorRoughnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgb(86, 86, 86)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const plankCount = 18;
  const plankWidth = canvas.width / plankCount;

  for (let i = 0; i < plankCount; i += 1) {
    const x = i * plankWidth;
    const plankTone = 75 + Math.random() * 30;
    ctx.fillStyle = `rgb(${plankTone}, ${plankTone}, ${plankTone})`;
    ctx.fillRect(x, 0, plankWidth, canvas.height);

    ctx.fillStyle = 'rgb(130, 130, 130)';
    ctx.fillRect(x + plankWidth - 2.2, 0, 2.2, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.2, 2.6);
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
  gradient.addColorStop(0, '#d4d0c9');
  gradient.addColorStop(1, '#ece8df');
  colorCtx.fillStyle = gradient;
  colorCtx.fillRect(0, 0, 1024, 1024);

  const roughGradient = roughCtx.createLinearGradient(0, 1024, 0, 0);
  roughGradient.addColorStop(0, 'rgb(185, 185, 185)');
  roughGradient.addColorStop(1, 'rgb(120, 120, 120)');
  roughCtx.fillStyle = roughGradient;
  roughCtx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 26000; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.35 + Math.random() * 1.65;
    const shade = 190 + Math.random() * 45;
    bumpCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, radius, 0, Math.PI * 2);
    bumpCtx.fill();

    const wallDust = Math.random() > 0.5 ? 'rgba(58, 54, 46, 0.03)' : 'rgba(240, 240, 230, 0.025)';
    colorCtx.fillStyle = wallDust;
    colorCtx.fillRect(x, y, 2.2, 2.2);
  }

  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = 3 + Math.random() * 7;
    bumpCtx.strokeStyle = `rgba(120, 120, 120, ${0.05 + Math.random() * 0.07})`;
    bumpCtx.lineWidth = 0.8;
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

  ctx.fillStyle = '#f3f1ed';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = 'rgba(186, 184, 178, 0.8)';
  ctx.lineWidth = 5;
  const step = 256;

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
  texture.repeat.set(2, 2.6);
  texture.anisotropy = maxAnisotropy;
  return texture;
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
  color: 0xf7f5f2,
  roughness: 0.62,
  metalness: 0
});
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

const panelLineMaterial = new THREE.MeshStandardMaterial({ color: 0xdad6cf, roughness: 0.7 });
const panelXStep = roomWidth / 4;
const panelZStep = roomDepth / 6;
for (let i = 1; i < 4; i += 1) {
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, roomDepth), panelLineMaterial);
  strip.position.set(-roomWidth / 2 + i * panelXStep, roomHeight - 0.015, 0);
  scene.add(strip);
}
for (let i = 1; i < 6; i += 1) {
  const strip = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.03, 0.03), panelLineMaterial);
  strip.position.set(0, roomHeight - 0.015, -roomDepth / 2 + i * panelZStep);
  scene.add(strip);
}

const wallMaps = createPlasterWallMaps();
const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallMaps.colorMap,
  bumpMap: wallMaps.bumpMap,
  bumpScale: 0.055,
  roughnessMap: wallMaps.roughnessMap,
  roughness: 0.88,
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

const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe6e1d8, roughness: 0.58 });
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
const corniceMaterial = new THREE.MeshStandardMaterial({ color: 0xefebe4, roughness: 0.52 });

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
  const framePadding = 0.08;
  const frameDepth = 0.06;

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

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(maxSide + framePadding, maxSide + framePadding, frameDepth),
    new THREE.MeshStandardMaterial({ color: 0x161616, metalness: 0.15, roughness: 0.7 })
  );

  function applySize(texture) {
    const { width, height } = fitByAspect(texture);

    photo.geometry.dispose();
    photo.geometry = new THREE.PlaneGeometry(width, height);

    frame.geometry.dispose();
    frame.geometry = new THREE.BoxGeometry(width + framePadding, height + framePadding, frameDepth);
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

  photo.position.z = 0.002;
  frame.position.z = -0.03;

  group.add(frame);
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
const gravity = 0.012;
const jumpVelocity = 0.16;
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
    verticalVelocity -= gravity;
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
