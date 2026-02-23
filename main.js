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
const roomDepth = 4;
const roomHeight = 3;
const playerHeight = 1.6;
const playerMargin = 0.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, playerHeight, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const keyLight = new THREE.SpotLight(0xffffff, 1.2, 18, Math.PI / 6, 0.35, 1);
keyLight.position.set(0, roomHeight - 0.2, 0);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
fillLight.position.set(-2, 2, 2);
scene.add(fillLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomDepth),
  new THREE.MeshStandardMaterial({ color: 0xe4e4e4, roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomDepth),
  new THREE.MeshStandardMaterial({ color: 0xf6f6f6, side: THREE.DoubleSide })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

function createWall(width, height, depth, posX, posY, posZ, rotY = 0) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  );
  wall.position.set(posX, posY, posZ);
  wall.rotation.y = rotY;
  scene.add(wall);
  return wall;
}

createWall(roomWidth, roomHeight, 0.1, 0, roomHeight / 2, -roomDepth / 2);
createWall(roomWidth, roomHeight, 0.1, 0, roomHeight / 2, roomDepth / 2);
createWall(roomDepth, roomHeight, 0.1, -roomWidth / 2, roomHeight / 2, 0, Math.PI / 2);
createWall(roomDepth, roomHeight, 0.1, roomWidth / 2, roomHeight / 2, 0, Math.PI / 2);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

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
  { file: '1.jpg', pos: { x: -1.5, y: 1.5, z: -roomDepth / 2 + wallInset }, rot: 0 },
  { file: '2.jpg', pos: { x: 1.5, y: 1.5, z: -roomDepth / 2 + wallInset }, rot: 0 },
  { file: '3.jpg', pos: { x: roomWidth / 2 - wallInset, y: 1.5, z: -1 }, rot: -Math.PI / 2 },
  { file: '4.jpg', pos: { x: roomWidth / 2 - wallInset, y: 1.5, z: 1 }, rot: -Math.PI / 2 },
  { file: '5.jpg', pos: { x: 1.5, y: 1.5, z: roomDepth / 2 - wallInset }, rot: Math.PI },
  { file: '6.jpg', pos: { x: -1.5, y: 1.5, z: roomDepth / 2 - wallInset }, rot: Math.PI },
  { file: '7.jpg', pos: { x: -roomWidth / 2 + wallInset, y: 1.5, z: 1 }, rot: Math.PI / 2 },
  { file: '8.jpg', pos: { x: -roomWidth / 2 + wallInset, y: 1.5, z: -1 }, rot: Math.PI / 2 }
];

photos.forEach((photo) => addPhoto(basePath + photo.file, photo.pos, photo.rot));

const controls = new PointerLockControls(camera, renderer.domElement);

document.body.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => document.body.classList.add('is-locked'));
controls.addEventListener('unlock', () => document.body.classList.remove('is-locked'));

const move = { forward: false, back: false, left: false, right: false };
const speed = 0.05;

const keyMap = {
  KeyW: 'forward',
  KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right'
};

window.addEventListener('keydown', (event) => {
  const dir = keyMap[event.code];
  if (dir) move[dir] = true;
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
  camera.position.z = clamp(camera.position.z, -roomDepth / 2 + playerMargin, roomDepth / 2 - playerMargin);
  camera.position.y = playerHeight;
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
