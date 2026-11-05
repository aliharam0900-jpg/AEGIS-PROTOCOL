import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CameraPresetId, GamePhase, HazardZone, SearchAlgorithmId } from '../types/game';

interface CyberGrid3DProps {
  grid: number[][];
  operativePos: [number, number];
  trackerPos: [number, number];
  effectiveGoal: [number, number];
  dataCores: [number, number][];
  hazardZones: HazardZone[];
  extractionPortal: [number, number];
  portalUnlocked: boolean;
  activePath: [number, number][];
  expandedNodes: [number, number][];
  showFrontier: boolean;
  algorithm: SearchAlgorithmId;
  cameraPreset: CameraPresetId;
  cameraZoom: number;
  empWaveTrigger: number;
  phase: GamePhase;
  onTileClick: (targetPos: [number, number]) => void;
}

const TILE_SIZE = 1.4;

function createFloorGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0e111b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#1f2538';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 250);

  ctx.strokeStyle = '#171c2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 16);
  ctx.lineTo(128, 240);
  ctx.moveTo(16, 128);
  ctx.lineTo(240, 128);
  ctx.stroke();

  // Corner tech ticks
  ctx.fillStyle = '#2d3652';
  ctx.fillRect(14, 14, 16, 4);
  ctx.fillRect(14, 14, 4, 16);
  ctx.fillRect(226, 14, 16, 4);
  ctx.fillRect(238, 14, 4, 16);
  ctx.fillRect(14, 238, 16, 4);
  ctx.fillRect(14, 226, 4, 16);
  ctx.fillRect(226, 238, 16, 4);
  ctx.fillRect(238, 226, 4, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createOperativeModel(): {
  root: THREE.Group;
  ring: THREE.Mesh;
  core: THREE.Mesh;
} {
  const root = new THREE.Group();

  // 1. Contact shadow / floor aura ring
  const floorAuraGeo = new THREE.RingGeometry(0.32, 0.54, 32);
  floorAuraGeo.rotateX(-Math.PI / 2);
  const floorAuraMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const floorAura = new THREE.Mesh(floorAuraGeo, floorAuraMat);
  floorAura.position.y = 0.02;
  root.add(floorAura);

  // 2. Primary Lower Hover Chassis (Dark Metallic Slate)
  const baseGeo = new THREE.CylinderGeometry(0.34, 0.42, 0.22, 8);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x162030,
    metalness: 0.85,
    roughness: 0.25,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.22;
  baseMesh.castShadow = true;
  root.add(baseMesh);

  // 3. Glowing Neon Cyan Energy Core (#00FFFF)
  const coreGeo = new THREE.OctahedronGeometry(0.28, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.4,
    metalness: 0.3,
    roughness: 0.15,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 0.56;
  coreMesh.castShadow = true;
  root.add(coreMesh);

  // 4. Secondary Upper Stealth Cowl
  const cowlGeo = new THREE.ConeGeometry(0.32, 0.28, 6);
  const cowlMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.45,
  });
  const cowlMesh = new THREE.Mesh(cowlGeo, cowlMat);
  cowlMesh.position.y = 0.84;
  cowlMesh.castShadow = true;
  root.add(cowlMesh);

  // 5. Accent Directional Visor
  const visorGeo = new THREE.BoxGeometry(0.34, 0.08, 0.22);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2.0,
    roughness: 0.1,
  });
  const visorMesh = new THREE.Mesh(visorGeo, visorMat);
  visorMesh.position.set(0, 0.76, 0.16);
  root.add(visorMesh);

  // 6. Orbiting Cyber Gyro Ring
  const ringGeo = new THREE.TorusGeometry(0.46, 0.032, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00b8d4,
    emissiveIntensity: 1.1,
    metalness: 0.8,
    roughness: 0.2,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.52;
  root.add(ringMesh);

  // 7. Side Stabilizer Fins (2 parts)
  const finGeo = new THREE.BoxGeometry(0.08, 0.34, 0.26);
  const finLeft = new THREE.Mesh(finGeo, baseMat);
  finLeft.position.set(-0.36, 0.48, -0.05);
  finLeft.rotation.z = 0.22;
  root.add(finLeft);

  const finRight = new THREE.Mesh(finGeo, baseMat);
  finRight.position.set(0.36, 0.48, -0.05);
  finRight.rotation.z = -0.22;
  root.add(finRight);

  return { root, ring: ringMesh, core: coreMesh };
}

function createTrackerNodeModel(): {
  root: THREE.Group;
  bladeRing: THREE.Mesh;
  scannerEye: THREE.Mesh;
} {
  const root = new THREE.Group();

  // 1. Floor Threat Lock Hexagon
  const lockGeo = new THREE.RingGeometry(0.38, 0.58, 6);
  lockGeo.rotateX(-Math.PI / 2);
  const lockMat = new THREE.MeshBasicMaterial({
    color: 0xff0055,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const lockRing = new THREE.Mesh(lockGeo, lockMat);
  lockRing.position.y = 0.025;
  root.add(lockRing);

  // 2. Primary Crimson Hexagonal Hull (#FF0055)
  const hexHullGeo = new THREE.CylinderGeometry(0.48, 0.54, 0.32, 6);
  const hexHullMat = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    emissive: 0x990033,
    emissiveIntensity: 0.85,
    metalness: 0.78,
    roughness: 0.22,
  });
  const hexHull = new THREE.Mesh(hexHullGeo, hexHullMat);
  hexHull.position.y = 0.48;
  hexHull.castShadow = true;
  root.add(hexHull);

  // 3. Secondary Obsidian Armored Carapace
  const capGeo = new THREE.CylinderGeometry(0.32, 0.46, 0.2, 6);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x181826,
    metalness: 0.92,
    roughness: 0.48,
  });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.y = 0.72;
  capMesh.castShadow = true;
  root.add(capMesh);

  // 4. Rotating Hexagonal Blade Shroud
  const bladeGeo = new THREE.TorusGeometry(0.58, 0.04, 6, 6);
  bladeGeo.rotateX(Math.PI / 2);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    emissive: 0xff0055,
    emissiveIntensity: 1.5,
    metalness: 0.85,
    roughness: 0.15,
  });
  const bladeRing = new THREE.Mesh(bladeGeo, bladeMat);
  bladeRing.position.y = 0.48;
  root.add(bladeRing);

  // 5. Hunter Laser Eye Core
  const eyeGeo = new THREE.SphereGeometry(0.16, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff3377,
    emissive: 0xff0055,
    emissiveIntensity: 2.4,
    roughness: 0.1,
  });
  const scannerEye = new THREE.Mesh(eyeGeo, eyeMat);
  scannerEye.position.set(0, 0.52, 0.42);
  root.add(scannerEye);

  // 6. 4 Angled Thruster Pods
  const podGeo = new THREE.BoxGeometry(0.12, 0.26, 0.16);
  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  angles.forEach((ang) => {
    const pod = new THREE.Mesh(podGeo, capMat);
    pod.position.set(Math.cos(ang) * 0.44, 0.34, Math.sin(ang) * 0.44);
    pod.rotation.y = -ang;
    root.add(pod);
  });

  // 7. Upper Overmind Telemetry Spire
  const spireGeo = new THREE.CylinderGeometry(0.025, 0.05, 0.38, 8);
  const spireMesh = new THREE.Mesh(spireGeo, hexHullMat);
  spireMesh.position.y = 0.96;
  root.add(spireMesh);

  return { root, bladeRing, scannerEye };
}

function createDataCoreModel(): {
  root: THREE.Group;
  crystal: THREE.Mesh;
  outerGimbal: THREE.Mesh;
  innerGimbal: THREE.Mesh;
} {
  const root = new THREE.Group();

  // 1. Pedestal Base Ring
  const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.08, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x282c3e,
    metalness: 0.85,
    roughness: 0.35,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.04;
  root.add(base);

  // 2. Shimmering Gold Crystal Core (#FFD700)
  const crystalGeo = new THREE.OctahedronGeometry(0.26, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffaa00,
    emissiveIntensity: 1.35,
    metalness: 0.9,
    roughness: 0.12,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 0.55;
  crystal.castShadow = true;
  root.add(crystal);

  // 3. Outer Gold Gimbal Ring
  const outerGeo = new THREE.TorusGeometry(0.36, 0.025, 10, 28);
  const gimbalMat = new THREE.MeshStandardMaterial({
    color: 0xffdf40,
    emissive: 0xcc8800,
    emissiveIntensity: 0.7,
    metalness: 0.95,
    roughness: 0.25,
  });
  const outerGimbal = new THREE.Mesh(outerGeo, gimbalMat);
  outerGimbal.position.y = 0.55;
  root.add(outerGimbal);

  // 4. Inner Counter-Rotating Gimbal Ring
  const innerGeo = new THREE.TorusGeometry(0.29, 0.02, 10, 24);
  const innerGimbal = new THREE.Mesh(innerGeo, gimbalMat);
  innerGimbal.position.y = 0.55;
  innerGimbal.rotation.y = Math.PI / 2;
  root.add(innerGimbal);

  return { root, crystal, outerGimbal, innerGimbal };
}

function createHazardZoneModel(): {
  root: THREE.Group;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  corePylon: THREE.Mesh;
  coreMat: THREE.MeshStandardMaterial;
  cornerGroup: THREE.Group;
} {
  const root = new THREE.Group();

  // 1. Floor Warning / Lockdown Hex Reticle
  const ringGeo = new THREE.RingGeometry(0.32, 0.56, 6);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.03;
  root.add(ring);

  // 2. Emitter Base Plate
  const baseGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.08, 6);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x2a1b2e,
    metalness: 0.85,
    roughness: 0.35,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.04;
  root.add(base);

  // 3. Central Plasma Lockdown Column
  const coreGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.92, 6);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xff2a85,
    emissiveIntensity: 1.8,
    metalness: 0.5,
    roughness: 0.2,
    transparent: true,
    opacity: 0.88,
  });
  const corePylon = new THREE.Mesh(coreGeo, coreMat);
  corePylon.position.y = 0.5;
  root.add(corePylon);

  // 4. 4 Corner Containment Emitter Pylons
  const cornerGroup = new THREE.Group();
  const postGeo = new THREE.BoxGeometry(0.09, 0.85, 0.09);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.6,
    metalness: 0.9,
    roughness: 0.3,
  });
  const offsets = [
    [-0.38, -0.38],
    [0.38, -0.38],
    [-0.38, 0.38],
    [0.38, 0.38],
  ];
  offsets.forEach(([ox, oz]) => {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(ox, 0.44, oz);
    cornerGroup.add(post);
  });
  root.add(cornerGroup);

  return { root, ring, ringMat, corePylon, coreMat, cornerGroup };
}

export const CyberGrid3D: React.FC<CyberGrid3DProps> = ({
  grid,
  operativePos,
  trackerPos,
  effectiveGoal,
  dataCores,
  hazardZones,
  extractionPortal,
  portalUnlocked,
  activePath,
  expandedNodes,
  showFrontier,
  algorithm,
  cameraPreset,
  cameraZoom,
  empWaveTrigger,
  phase,
  onTileClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Mutable ref state so React updates never tear down or recreate the WebGL scene
  const stateRef = useRef({
    grid,
    operativePos,
    trackerPos,
    effectiveGoal,
    dataCores,
    hazardZones,
    extractionPortal,
    portalUnlocked,
    activePath,
    expandedNodes,
    showFrontier,
    algorithm,
    cameraPreset,
    cameraZoom,
    empWaveTrigger,
    phase,
    onTileClick,
  });

  useEffect(() => {
    stateRef.current = {
      grid,
      operativePos,
      trackerPos,
      effectiveGoal,
      dataCores,
      hazardZones,
      extractionPortal,
      portalUnlocked,
      activePath,
      expandedNodes,
      showFrontier,
      algorithm,
      cameraPreset,
      cameraZoom,
      empWaveTrigger,
      phase,
      onTileClick,
    };
  }, [
    grid,
    operativePos,
    trackerPos,
    effectiveGoal,
    dataCores,
    hazardZones,
    extractionPortal,
    portalUnlocked,
    activePath,
    expandedNodes,
    showFrontier,
    algorithm,
    cameraPreset,
    cameraZoom,
    empWaveTrigger,
    phase,
    onTileClick,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard (SwiftShader / llvmpipe detection)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a10);
    scene.fog = new THREE.FogExp2(0x090a10, 0.022);

    // 2. Studio Environment Map Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      120
    );
    camera.position.set(0, 17, 15.5);
    camera.lookAt(0, 0, 0);

    // 3. Balanced 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090a10, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(11, 19, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 45;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff0055, 1.1);
    rimLight.position.set(-12, 10, -11);
    scene.add(rimLight);

    const cyanAccentLight = new THREE.PointLight(0x00ffff, 2.5, 8);
    scene.add(cyanAccentLight);

    const crimsonAccentLight = new THREE.PointLight(0xff0055, 2.5, 8);
    scene.add(crimsonAccentLight);

    // Helper to convert (gx, gz) grid coordinates to 3D world (wx, wz)
    const gridToWorld = (gx: number, gz: number, gridSize: number, out: THREE.Vector3) => {
      const half = (gridSize - 1) / 2;
      out.set((gx - half) * TILE_SIZE, 0, (gz - half) * TILE_SIZE);
    };

    // 4. Instanced Floor Grid & Firewall Obstacles (#333344)
    const maxCells = 15 * 15;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const floorTex = createFloorGridTexture(maxAniso);

    const floorGeo = new THREE.BoxGeometry(TILE_SIZE * 0.98, 0.16, TILE_SIZE * 0.98);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.55,
      metalness: 0.4,
    });
    const floorInstanced = new THREE.Mesh(
      new THREE.BoxGeometry(13 * TILE_SIZE + 0.6, 0.14, 13 * TILE_SIZE + 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x0b0e17,
        roughness: 0.7,
        metalness: 0.5,
      })
    );
    floorInstanced.position.y = -0.16;
    floorInstanced.receiveShadow = true;
    scene.add(floorInstanced);

    const tileInstanced = new THREE.InstancedMesh(floorGeo, floorMat, maxCells);
    tileInstanced.receiveShadow = true;
    tileInstanced.layers.enable(1); // Raycast layer for click-to-move
    scene.add(tileInstanced);

    // Firewall Wall Blocks (#333344) + Upper Bevel Cap
    const wallGeo = new THREE.BoxGeometry(TILE_SIZE * 0.9, 1.05, TILE_SIZE * 0.9);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.38,
      metalness: 0.72,
    });
    const wallInstanced = new THREE.InstancedMesh(wallGeo, wallMat, maxCells);
    wallInstanced.castShadow = !isSoftwareGl;
    wallInstanced.receiveShadow = true;
    scene.add(wallInstanced);

    const wallCapGeo = new THREE.BoxGeometry(TILE_SIZE * 0.76, 0.12, TILE_SIZE * 0.76);
    const wallCapMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      emissive: 0x1e293b,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.88,
    });
    const wallCapInstanced = new THREE.InstancedMesh(wallCapGeo, wallCapMat, maxCells);
    scene.add(wallCapInstanced);

    // 5. Search Frontier Overlay Tiles & Optimal Path Conduit Nodes
    const frontierGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.82, TILE_SIZE * 0.82);
    frontierGeo.rotateX(-Math.PI / 2);
    const frontierMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const frontierInstanced = new THREE.InstancedMesh(frontierGeo, frontierMat, maxCells);
    frontierInstanced.frustumCulled = false;
    scene.add(frontierInstanced);

    const pathNodeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.08, 6);
    const pathNodeMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });
    const pathInstanced = new THREE.InstancedMesh(pathNodeGeo, pathNodeMat, maxCells);
    pathInstanced.frustumCulled = false;
    scene.add(pathInstanced);

    // 6. Hero Multi-Part Entities
    const operative = createOperativeModel();
    scene.add(operative.root);

    const tracker = createTrackerNodeModel();
    scene.add(tracker.root);

    // Pool of up to 6 multi-part Data Cores
    const coreModels = Array.from({ length: 6 }, () => {
      const m = createDataCoreModel();
      scene.add(m.root);
      return m;
    });

    // Pool of up to 8 Hunter Hazard Zones
    const hazardModels = Array.from({ length: 8 }, () => {
      const h = createHazardZoneModel();
      h.root.visible = false;
      scene.add(h.root);
      return h;
    });

    // Extraction Portal Multi-Part Gate
    const portalGroup = new THREE.Group();
    const portalBaseGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.12, 8);
    const portalBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const portalBase = new THREE.Mesh(portalBaseGeo, portalBaseMat);
    portalBase.position.y = 0.06;
    portalGroup.add(portalBase);

    const portalTorusGeo = new THREE.TorusGeometry(0.48, 0.055, 12, 32);
    const portalTorusMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.5,
      metalness: 0.7,
      roughness: 0.2,
    });
    const portalRing = new THREE.Mesh(portalTorusGeo, portalTorusMat);
    portalRing.position.y = 0.62;
    portalGroup.add(portalRing);
    scene.add(portalGroup);

    // EMP Shockwave Ring
    const empGeo = new THREE.RingGeometry(0.4, 0.75, 36);
    empGeo.rotateX(-Math.PI / 2);
    const empMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const empMesh = new THREE.Mesh(empGeo, empMat);
    empMesh.position.y = 0.18;
    scene.add(empMesh);

    // Pre-allocated math helpers (Zero GC in render loop)
    const _dummy = new THREE.Object3D();
    const _vecA = new THREE.Vector3();
    const _vecB = new THREE.Vector3();
    const _camTarget = new THREE.Vector3();
    const _desiredCamPos = new THREE.Vector3();
    const tileIndexToCoord: [number, number][] = [];

    // Rebuild static board layout whenever sector grid changes
    let lastGridRef: number[][] | null = null;
    const syncStaticGrid = (currentGrid: number[][]) => {
      const rows = currentGrid.length;
      const cols = rows > 0 ? currentGrid[0].length : 0;
      tileIndexToCoord.length = 0;

      let tileIdx = 0;
      let wallIdx = 0;

      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          gridToWorld(x, z, rows, _vecA);
          _dummy.position.set(_vecA.x, -0.08, _vecA.z);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.set(1, 1, 1);
          _dummy.updateMatrix();
          tileInstanced.setMatrixAt(tileIdx, _dummy.matrix);
          tileIndexToCoord.push([x, z]);
          tileIdx++;

          if (currentGrid[z][x] === 1) {
            _dummy.position.set(_vecA.x, 0.52, _vecA.z);
            _dummy.updateMatrix();
            wallInstanced.setMatrixAt(wallIdx, _dummy.matrix);

            _dummy.position.set(_vecA.x, 1.08, _vecA.z);
            _dummy.updateMatrix();
            wallCapInstanced.setMatrixAt(wallIdx, _dummy.matrix);
            wallIdx++;
          }
        }
      }

      tileInstanced.count = tileIdx;
      tileInstanced.instanceMatrix.needsUpdate = true;
      tileInstanced.computeBoundingSphere();

      wallInstanced.count = wallIdx;
      wallInstanced.instanceMatrix.needsUpdate = true;
      wallInstanced.computeBoundingSphere();

      wallCapInstanced.count = wallIdx;
      wallCapInstanced.instanceMatrix.needsUpdate = true;
      wallCapInstanced.computeBoundingSphere();
    };

    syncStaticGrid(stateRef.current.grid);
    lastGridRef = stateRef.current.grid;

    // Position actors at initial coordinates immediately
    gridToWorld(
      stateRef.current.operativePos[0],
      stateRef.current.operativePos[1],
      stateRef.current.grid.length,
      operative.root.position
    );
    gridToWorld(
      stateRef.current.trackerPos[0],
      stateRef.current.trackerPos[1],
      stateRef.current.grid.length,
      tracker.root.position
    );

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for Click-to-Move on adjacent tiles
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      if (stateRef.current.phase !== 'playing') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(tileInstanced, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const coord = tileIndexToCoord[hits[0].instanceId];
        if (coord) {
          stateRef.current.onTileClick(coord);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Software-WebGL Paced Render Loop
    let frameId = 0;
    let lastEmpSeen = stateRef.current.empWaveTrigger;
    let empAnimProgress = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const gSize = st.grid.length;

      if (st.grid !== lastGridRef) {
        syncStaticGrid(st.grid);
        lastGridRef = st.grid;
      }

      // Smoothly damp Operative & Tracker positions
      gridToWorld(st.operativePos[0], st.operativePos[1], gSize, _vecA);
      const dxOp = _vecA.x - operative.root.position.x;
      const dzOp = _vecA.z - operative.root.position.z;
      operative.root.position.x = THREE.MathUtils.damp(
        operative.root.position.x,
        _vecA.x,
        14,
        dt
      );
      operative.root.position.z = THREE.MathUtils.damp(
        operative.root.position.z,
        _vecA.z,
        14,
        dt
      );
      if (Math.abs(dxOp) + Math.abs(dzOp) > 0.02) {
        const targetYaw = Math.atan2(dxOp, dzOp);
        operative.root.rotation.y = THREE.MathUtils.damp(
          operative.root.rotation.y,
          targetYaw,
          12,
          dt
        );
      }
      operative.ring.rotation.z = elapsed * 2.2;
      operative.core.position.y = 0.56 + Math.sin(elapsed * 4.0) * 0.05;
      cyanAccentLight.position.set(
        operative.root.position.x,
        1.4,
        operative.root.position.z
      );

      // Tracker Node kinematics
      gridToWorld(st.trackerPos[0], st.trackerPos[1], gSize, _vecB);
      const dxTr = _vecB.x - tracker.root.position.x;
      const dzTr = _vecB.z - tracker.root.position.z;
      tracker.root.position.x = THREE.MathUtils.damp(
        tracker.root.position.x,
        _vecB.x,
        12,
        dt
      );
      tracker.root.position.z = THREE.MathUtils.damp(
        tracker.root.position.z,
        _vecB.z,
        12,
        dt
      );
      if (Math.abs(dxTr) + Math.abs(dzTr) > 0.02) {
        const hunterYaw = Math.atan2(dxTr, dzTr);
        tracker.root.rotation.y = THREE.MathUtils.damp(
          tracker.root.rotation.y,
          hunterYaw,
          10,
          dt
        );
      }
      tracker.bladeRing.rotation.z = -elapsed * 3.5;
      tracker.root.position.y = Math.sin(elapsed * 5.0) * 0.04;
      crimsonAccentLight.position.set(
        tracker.root.position.x,
        1.4,
        tracker.root.position.z
      );

      // Data Cores animation
      coreModels.forEach((cm, idx) => {
        if (idx < st.dataCores.length) {
          const [cx, cz] = st.dataCores[idx];
          gridToWorld(cx, cz, gSize, cm.root.position);
          cm.root.visible = true;
          cm.crystal.rotation.y = elapsed * 2.0 + idx;
          cm.crystal.position.y = 0.55 + Math.sin(elapsed * 3.2 + idx) * 0.06;
          cm.outerGimbal.rotation.x = elapsed * 1.8 + idx;
          cm.innerGimbal.rotation.z = -elapsed * 2.4;
        } else {
          cm.root.visible = false;
        }
      });

      // Hunter Hazard Zones animation (Priming Windup vs Locked Plasma Barrier)
      hazardModels.forEach((hm, idx) => {
        if (idx < st.hazardZones.length) {
          const hz = st.hazardZones[idx];
          gridToWorld(hz.x, hz.z, gSize, hm.root.position);
          hm.root.visible = true;
          hm.ring.rotation.z = elapsed * (hz.state === 'priming' ? 4.0 : -2.2);

          if (hz.state === 'priming') {
            hm.ringMat.color.setHex(0xf59e0b);
            hm.ringMat.opacity = 0.55 + Math.sin(elapsed * 10.0) * 0.25;
            hm.coreMat.color.setHex(0xf59e0b);
            hm.coreMat.emissive.setHex(0xd97706);
            hm.corePylon.scale.set(0.65, 0.25 + Math.sin(elapsed * 8.0) * 0.08, 0.65);
            hm.corePylon.position.y = 0.16;
            hm.cornerGroup.scale.y = 0.35;
          } else {
            hm.ringMat.color.setHex(0xff0055);
            hm.ringMat.opacity = 0.85;
            hm.coreMat.color.setHex(0xff2a85);
            hm.coreMat.emissive.setHex(0xff0055);
            hm.corePylon.scale.set(1.0, 1.0, 1.0);
            hm.corePylon.position.y = 0.5;
            hm.corePylon.rotation.y = elapsed * 2.5;
            hm.cornerGroup.scale.y = 1.0;
          }
        } else {
          hm.root.visible = false;
        }
      });

      // Extraction Portal update
      gridToWorld(st.extractionPortal[0], st.extractionPortal[1], gSize, portalGroup.position);
      portalRing.rotation.z = elapsed * (st.portalUnlocked ? 3.2 : 0.8);
      portalTorusMat.color.setHex(st.portalUnlocked ? 0x10b981 : 0x475569);
      portalTorusMat.emissive.setHex(st.portalUnlocked ? 0x10b981 : 0x1e293b);
      portalTorusMat.emissiveIntensity = st.portalUnlocked ? 2.2 : 0.5;

      // Update Search Frontier Overlay Tiles
      if (st.showFrontier && st.expandedNodes.length > 0) {
        frontierMat.color.setHex(
          st.algorithm === 'astar'
            ? 0x8b5cf6
            : st.algorithm === 'bfs'
              ? 0x3b82f6
              : 0xf59e0b
        );
        let fIdx = 0;
        for (const [fx, fz] of st.expandedNodes) {
          if (fIdx >= maxCells) break;
          gridToWorld(fx, fz, gSize, _vecA);
          _dummy.position.set(_vecA.x, 0.015, _vecA.z);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.set(1, 1, 1);
          _dummy.updateMatrix();
          frontierInstanced.setMatrixAt(fIdx++, _dummy.matrix);
        }
        frontierInstanced.count = fIdx;
        frontierInstanced.instanceMatrix.needsUpdate = true;
      } else {
        frontierInstanced.count = 0;
      }

      // Update Active Optimal Path Conduit
      let pIdx = 0;
      for (let i = 1; i < st.activePath.length; i++) {
        if (pIdx >= maxCells) break;
        const [px, pz] = st.activePath[i];
        gridToWorld(px, pz, gSize, _vecA);
        _dummy.position.set(_vecA.x, 0.06, _vecA.z);
        _dummy.rotation.set(0, elapsed * 1.5, 0);
        const pulse = i === st.activePath.length - 1 ? 1.25 : 0.85;
        _dummy.scale.set(pulse, 1, pulse);
        _dummy.updateMatrix();
        pathInstanced.setMatrixAt(pIdx++, _dummy.matrix);
      }
      pathInstanced.count = pIdx;
      pathInstanced.instanceMatrix.needsUpdate = true;

      // EMP Shockwave animation
      if (st.empWaveTrigger !== lastEmpSeen) {
        lastEmpSeen = st.empWaveTrigger;
        empAnimProgress = 1.0;
        empMesh.position.x = operative.root.position.x;
        empMesh.position.z = operative.root.position.z;
      }
      if (empAnimProgress > 0) {
        empAnimProgress = Math.max(0, empAnimProgress - dt * 1.8);
        const s = 1 + (1 - empAnimProgress) * 9.5;
        empMesh.scale.set(s, s, 1);
        empMat.opacity = empAnimProgress * 0.75;
      } else {
        empMat.opacity = 0;
      }

      // Camera Choreography (Title Orbit vs Isometric Tactical vs Top-Down vs Chase)
      if (st.phase === 'title') {
        const orbitAngle = elapsed * 0.22;
        _desiredCamPos.set(
          Math.sin(orbitAngle) * 16.5,
          14.5,
          Math.cos(orbitAngle) * 16.5
        );
        _camTarget.set(0, 0.3, 0);
      } else if (st.cameraPreset === 'tactical_top') {
        _desiredCamPos.set(0, 22.5 / st.cameraZoom, 2.2);
        _camTarget.set(0, 0, 0);
      } else if (st.cameraPreset === 'drone_chase') {
        _desiredCamPos.set(
          operative.root.position.x * 0.7,
          10.5 / st.cameraZoom,
          operative.root.position.z + 9.5 / st.cameraZoom
        );
        _camTarget.set(
          operative.root.position.x * 0.65,
          0.4,
          operative.root.position.z * 0.65
        );
      } else {
        // Default Isometric Tactical 3D with dynamic zoom and subtle player tracking
        _desiredCamPos.set(
          operative.root.position.x * 0.22 + 9.5 / st.cameraZoom,
          15.5 / st.cameraZoom,
          operative.root.position.z * 0.22 + 13.8 / st.cameraZoom
        );
        _camTarget.set(
          operative.root.position.x * 0.18,
          0.2,
          operative.root.position.z * 0.18
        );
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 5, dt);
      camera.lookAt(_camTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      floorTex.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden bg-[#090a10]"
      aria-label="AEGIS Protocol 3D Tactical Server Grid"
    />
  );
};
