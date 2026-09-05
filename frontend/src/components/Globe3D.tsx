import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, Flame, Activity, ShieldAlert, RotateCcw, ZoomIn, ZoomOut, Compass, Play, Pause, Anchor } from 'lucide-react';

export interface GlobalLocationNode {
  id: string;
  name: string;
  country: string;
  code: string;
  lat: number;
  lon: number;
  draft: number;
  congestion: number;
  type: 'DESTINATION' | 'ORIGIN' | 'HUB';
  majorExports: string;
  sailRelevance: string;
}

export type HeatmapMode = 'CONGESTION' | 'TRAFFIC' | 'RISK' | 'NORMAL';

// 15 Major Global Maritime Trading Countries & Key Bulk Ports
const GLOBAL_NODES: GlobalLocationNode[] = [
  { id: 'in-vizag', name: 'Visakhapatnam', country: 'India', code: 'IN', lat: 17.68, lon: 83.21, draft: 16.5, congestion: 38, type: 'DESTINATION', majorExports: 'Steel Products, Minerals', sailRelevance: 'Primary SAIL Eastern Fleet Discharge Terminal' },
  { id: 'in-paradip', name: 'Paradip Port', country: 'India', code: 'IN', lat: 20.26, lon: 86.67, draft: 14.5, congestion: 65, type: 'DESTINATION', majorExports: 'Iron Ore, Pellets', sailRelevance: 'Major SAIL Coking Coal Import Hub' },
  { id: 'in-haldia', name: 'Haldia Dock Complex', country: 'India', code: 'IN', lat: 22.02, lon: 88.06, draft: 12.5, congestion: 72, type: 'DESTINATION', majorExports: 'Bulk Cargo', sailRelevance: 'Feeder Hub for Durgapur & IISCO Steel Plants' },
  { id: 'in-gangavaram', name: 'Gangavaram Port', country: 'India', code: 'IN', lat: 17.62, lon: 83.24, draft: 18.0, congestion: 22, type: 'DESTINATION', majorExports: 'Coal, Limestone', sailRelevance: 'Deep-Draft Capesize Bulk Terminal' },
  
  { id: 'au-newcastle', name: 'Port of Newcastle', country: 'Australia', code: 'AU', lat: -32.92, lon: 151.78, draft: 15.2, congestion: 45, type: 'ORIGIN', majorExports: 'Premium Coking Coal', sailRelevance: 'Largest Overseas Raw Material Origin for SAIL' },
  { id: 'au-dampier', name: 'Port of Dampier', country: 'Australia', code: 'AU', lat: -20.66, lon: 116.71, draft: 19.0, congestion: 18, type: 'ORIGIN', majorExports: 'Iron Ore Fines', sailRelevance: 'Pilbara Bulk Iron Ore Loading Corridor' },
  { id: 'au-hedland', name: 'Port Hedland', country: 'Australia', code: 'AU', lat: -20.31, lon: 118.57, draft: 20.0, congestion: 28, type: 'ORIGIN', majorExports: 'Iron Ore Lump & Fines', sailRelevance: 'High-Volume Capesize Export Hub' },
  
  { id: 'za-richards', name: 'Richards Bay Coal Terminal', country: 'South Africa', code: 'ZA', lat: -28.80, lon: 32.04, draft: 17.5, congestion: 30, type: 'ORIGIN', majorExports: 'Thermal & Metallurgical Coal', sailRelevance: 'Key Secondary Coal Source for SAIL Plants' },
  
  { id: 'sg-singapore', name: 'Port of Singapore', country: 'Singapore', code: 'SG', lat: 1.35, lon: 103.82, draft: 16.0, congestion: 52, type: 'HUB', majorExports: 'Bunker Fuel & Transshipment', sailRelevance: 'Global Maritime Bunkering & Trade Hub' },
  
  { id: 'cn-ningbo', name: 'Ningbo-Zhoushan', country: 'China', code: 'CN', lat: 29.86, lon: 121.54, draft: 18.5, congestion: 68, type: 'HUB', majorExports: 'Finished Steel & Finished Goods', sailRelevance: 'Asian Dry Bulk Index Benchmark Market' },
  { id: 'cn-qingdao', name: 'Qingdao Port', country: 'China', code: 'CN', lat: 36.06, lon: 120.38, draft: 17.0, congestion: 58, type: 'HUB', majorExports: 'Iron Ore Transshipment', sailRelevance: 'Global Spot Iron Ore Price Index Indicator' },
  
  { id: 'br-tubarao', name: 'Tubarão Port', country: 'Brazil', code: 'BR', lat: -20.28, lon: -40.24, draft: 22.5, congestion: 35, type: 'ORIGIN', majorExports: 'High-Grade Iron Ore Pellets', sailRelevance: 'Vale Iron Ore Long-Haul Origin for India' },
  
  { id: 'us-houston', name: 'Port of Houston', country: 'United States', code: 'US', lat: 29.76, lon: -95.36, draft: 14.5, congestion: 40, type: 'ORIGIN', majorExports: 'US Met Coal & Petroleum Coke', sailRelevance: 'Atlantic Met Coal Sourcing Base' },
  { id: 'ca-vancouver', name: 'Port of Vancouver', country: 'Canada', code: 'CA', lat: 49.28, lon: -123.12, draft: 15.0, congestion: 48, type: 'ORIGIN', majorExports: 'Hard Coking Coal', sailRelevance: 'Pacific Hard Coking Coal Reserve Supplier' },
  
  { id: 'nl-rotterdam', name: 'Port of Rotterdam', country: 'Netherlands', code: 'NL', lat: 51.92, lon: 4.47, draft: 24.0, congestion: 25, type: 'HUB', majorExports: 'European Scrap & Freight Derivatives', sailRelevance: 'Baltic Dry Index Benchmark Reference' }
];

const ROUTE_ARCS = [
  { id: 'r1', origin: 'Port of Newcastle', dest: 'Visakhapatnam', originLat: -32.92, originLon: 151.78, destLat: 17.68, destLon: 83.21, cargo: 'Coking Coal', vessel: 'MV SAIL Steel Express' },
  { id: 'r2', origin: 'Richards Bay', dest: 'Paradip Port', originLat: -28.80, originLon: 32.04, destLat: 20.26, destLon: 86.67, cargo: 'Metallurgical Coal', vessel: 'MV Paradip Pioneer' },
  { id: 'r3', origin: 'Port of Dampier', dest: 'Gangavaram Port', originLat: -20.66, originLon: 116.71, destLat: 17.62, destLon: 83.24, cargo: 'Iron Ore Fines', vessel: 'MV Deccan Giant' },
  { id: 'r4', origin: 'Tubarão Port', dest: 'Visakhapatnam', originLat: -20.28, originLon: -40.24, destLat: 17.68, destLon: 83.21, cargo: 'Iron Ore Pellets', vessel: 'MV Ocean Titan' },
  { id: 'r5', origin: 'Port of Vancouver', dest: 'Haldia Dock Complex', originLat: 49.28, originLon: -123.12, destLat: 22.02, destLon: 88.06, cargo: 'Hard Coking Coal', vessel: 'MV Canada Transporter' }
];

interface Globe3DProps {
  onSelectNode?: (node: GlobalLocationNode) => void;
}

export default function Globe3D({ onSelectNode }: Globe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GlobalLocationNode>(GLOBAL_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<GlobalLocationNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('CONGESTION');
  const [isRotating, setIsRotating] = useState(true);

  // References for camera controls
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetRotationYRef = useRef(0);
  const targetRotationXRef = useRef(0);
  const targetZoomRef = useRef(7.2);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  // Function to center camera on a node
  const focusNodeOnGlobe = (node: GlobalLocationNode) => {
    const targetY = -((node.lon + 180) * (Math.PI / 180)) + Math.PI / 2;
    const targetX = (node.lat) * (Math.PI / 180);
    targetRotationYRef.current = targetY;
    targetRotationXRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetX));
    targetZoomRef.current = 5.2;
  };

  const handleNodeClick = (node: GlobalLocationNode) => {
    setSelectedNode(node);
    focusNodeOnGlobe(node);
    if (onSelectNode) onSelectNode(node);
  };

  const handleResetCamera = () => {
    targetRotationYRef.current = 0;
    targetRotationXRef.current = 0;
    targetZoomRef.current = 7.2;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070A0D);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Texture Generator (Equirectangular Canvas Texture for Globe + Heatmap)
    const globeRadius = 2.4;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const renderCanvasTexture = (mode: HeatmapMode) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, 2048, 1024);

      // Ocean Base - Dark Void
      ctx.fillStyle = '#0B131A';
      ctx.fillRect(0, 0, 2048, 1024);

      // Coordinates Grid Lines
      ctx.strokeStyle = 'rgba(44, 62, 76, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 2048; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Draw Global Continents (Steel #1B252C with #2C3E4C border)
      ctx.fillStyle = '#1B252C';
      ctx.strokeStyle = '#2C3E4C';
      ctx.lineWidth = 1.5;

      const drawLandmass = (pathCoords: [number, number][]) => {
        if (pathCoords.length === 0) return;
        ctx.beginPath();
        pathCoords.forEach(([lon, lat], idx) => {
          const x = ((lon + 180) / 360) * 2048;
          const y = ((90 - lat) / 180) * 1024;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // Asia & India
      drawLandmass([[68, 25], [78, 35], [88, 28], [92, 22], [88, 10], [78, 8], [72, 15]]);
      drawLandmass([[95, 30], [125, 40], [130, 22], [105, 10], [98, 15]]);
      drawLandmass([[130, 45], [145, 45], [140, 30], [130, 32]]);

      // Oceania / Australia
      drawLandmass([[113, -12], [153, -12], [153, -38], [113, -38]]);

      // Africa
      drawLandmass([[-17, 35], [32, 32], [51, 11], [40, -35], [18, -34], [9, 5], [-17, 15]]);

      // Europe
      drawLandmass([[-10, 36], [30, 40], [40, 60], [10, 65], [-10, 55]]);

      // North America
      drawLandmass([[-165, 65], [-125, 50], [-75, 45], [-80, 25], [-105, 20], [-125, 32], [-160, 55]]);

      // South America
      drawLandmass([[-80, 10], [-35, -5], [-40, -22], [-70, -50], [-75, -45], [-80, -10]]);

      // DYNAMIC HEATMAP OVERLAY LAYER
      if (mode !== 'NORMAL') {
        GLOBAL_NODES.forEach(node => {
          const cx = ((node.lon + 180) / 360) * 2048;
          const cy = ((90 - node.lat) / 180) * 1024;
          
          let intensity = node.congestion / 100.0;
          let radius = 60 + intensity * 70;

          const drawHeatCircle = (x: number, y: number) => {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);

            if (mode === 'CONGESTION') {
              if (node.congestion >= 60) {
                grad.addColorStop(0, 'rgba(201, 91, 85, 0.85)');
                grad.addColorStop(0.5, 'rgba(209, 154, 58, 0.45)');
                grad.addColorStop(1, 'rgba(201, 91, 85, 0)');
              } else if (node.congestion >= 35) {
                grad.addColorStop(0, 'rgba(209, 154, 58, 0.8)');
                grad.addColorStop(0.5, 'rgba(59, 113, 137, 0.35)');
                grad.addColorStop(1, 'rgba(209, 154, 58, 0)');
              } else {
                grad.addColorStop(0, 'rgba(75, 154, 114, 0.75)');
                grad.addColorStop(1, 'rgba(75, 154, 114, 0)');
              }
            } else if (mode === 'TRAFFIC') {
              grad.addColorStop(0, 'rgba(22, 140, 138, 0.9)');
              grad.addColorStop(0.5, 'rgba(185, 120, 62, 0.5)');
              grad.addColorStop(1, 'rgba(22, 140, 138, 0)');
            } else if (mode === 'RISK') {
              grad.addColorStop(0, 'rgba(185, 120, 62, 0.95)');
              grad.addColorStop(0.4, 'rgba(201, 91, 85, 0.6)');
              grad.addColorStop(1, 'rgba(185, 120, 62, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          };

          drawHeatCircle(cx, cy);
          if (cx - radius < 0) drawHeatCircle(cx + 2048, cy);
          if (cx + radius > 2048) drawHeatCircle(cx - 2048, cy);
        });
      }
    };

    renderCanvasTexture(heatmapMode);
    const texture = new THREE.CanvasTexture(canvas);
    textureRef.current = texture;

    const globeMat = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 12,
      specular: new THREE.Color(0x168C8A)
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // 3. Atmosphere Layer (Ocean Teal Ambient Glow)
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.08, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x122B3A),
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x168C8A, 1.3);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Helper: Convert Lat/Lon to 3D Coordinates
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // 5. Render Port Nodes & Pulse Rings
    const nodeGroup = new THREE.Group();
    const nodeMeshMap = new Map<string, { mesh: THREE.Mesh; ringMesh: THREE.Mesh; node: GlobalLocationNode }>();

    GLOBAL_NODES.forEach((node) => {
      const pos = latLonToVector3(node.lat, node.lon, globeRadius + 0.02);
      
      let nodeColor = 0x3B7189; // Muted Blue Hub
      if (node.type === 'DESTINATION') nodeColor = 0x4B9A72; // Emerald Discharge
      else if (node.type === 'ORIGIN') nodeColor = 0xB9783E; // Industrial Copper

      const markerGeo = new THREE.SphereGeometry(0.048, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);

      // Pulse Ring
      const ringGeo = new THREE.RingGeometry(0.065, 0.085, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.002));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));

      const portGroup = new THREE.Group();
      portGroup.add(markerMesh);
      portGroup.add(ringMesh);

      nodeGroup.add(portGroup);
      nodeMeshMap.set(node.id, { mesh: markerMesh, ringMesh, node });
    });
    scene.add(nodeGroup);

    // 6. Render Maritime Shipping Route Arcs & Animated Particles
    const arcGroup = new THREE.Group();
    const particleList: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; speed: number; progress: number }[] = [];

    ROUTE_ARCS.forEach((arc) => {
      const vStart = latLonToVector3(arc.originLat, arc.originLon, globeRadius + 0.02);
      const vEnd = latLonToVector3(arc.destLat, arc.destLon, globeRadius + 0.02);

      const midPoint = vStart.clone().add(vEnd).multiplyScalar(0.5);
      const distance = vStart.distanceTo(vEnd);
      midPoint.setLength(globeRadius + 0.02 + distance * 0.26);

      const curve = new THREE.QuadraticBezierCurve3(vStart, midPoint, vEnd);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineDashedMaterial({
        color: 0x168C8A,
        dashSize: 0.14,
        gapSize: 0.08,
        linewidth: 2,
        transparent: true,
        opacity: 0.85
      });

      const line = new THREE.Line(curveGeo, curveMat);
      line.computeLineDistances();
      arcGroup.add(line);

      // Animated Cargo Vessel Particles
      for (let p = 0; p < 2; p++) {
        const pGeo = new THREE.SphereGeometry(0.028, 12, 12);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xEDF1F0 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        arcGroup.add(pMesh);
        particleList.push({
          mesh: pMesh,
          curve,
          speed: 0.0018 + Math.random() * 0.0006,
          progress: p * 0.5
        });
      }
    });
    scene.add(arcGroup);

    // 7. Interactive Mouse Controls & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let curRotX = targetRotationXRef.current;
    let curRotY = targetRotationYRef.current;
    let curZoom = targetZoomRef.current;

    const domElem = renderer.domElement;

    const handlePointerDown = (event: PointerEvent) => {
      isDragging = true;
      prevMousePos = { x: event.clientX, y: event.clientY };

      const rect = domElem.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.values()).map(v => v.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        for (const entry of nodeMeshMap.values()) {
          if (entry.mesh === hitMesh) {
            handleNodeClick(entry.node);
            break;
          }
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = domElem.getBoundingClientRect();
      const mx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Mouse drag rotation
      if (isDragging) {
        const deltaX = event.clientX - prevMousePos.x;
        const deltaY = event.clientY - prevMousePos.y;
        targetRotationYRef.current += deltaX * 0.005;
        targetRotationXRef.current += deltaY * 0.005;
        targetRotationXRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationXRef.current));
        prevMousePos = { x: event.clientX, y: event.clientY };
      }

      // Hover Raycasting
      mouse.x = mx;
      mouse.y = my;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.values()).map(v => v.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        for (const entry of nodeMeshMap.values()) {
          if (entry.mesh === hitMesh) {
            setHoveredNode(entry.node);
            setHoverPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
            domElem.style.cursor = 'pointer';
            break;
          }
        }
      } else {
        setHoveredNode(null);
        domElem.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetZoomRef.current += event.deltaY * 0.004;
      targetZoomRef.current = Math.max(3.8, Math.min(11.0, targetZoomRef.current));
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation if enabled
      if (isRotating && !isDragging) {
        targetRotationYRef.current += 0.0012;
      }

      // Smooth camera spherical movement (Lerp)
      curRotY += (targetRotationYRef.current - curRotY) * 0.08;
      curRotX += (targetRotationXRef.current - curRotX) * 0.08;
      curZoom += (targetZoomRef.current - curZoom) * 0.08;

      camera.position.x = curZoom * Math.sin(curRotY) * Math.cos(curRotX);
      camera.position.y = curZoom * Math.sin(curRotX);
      camera.position.z = curZoom * Math.cos(curRotY) * Math.cos(curRotX);
      camera.lookAt(0, 0, 0);

      // Animate Cargo Particles
      particleList.forEach(pt => {
        pt.progress += pt.speed;
        if (pt.progress > 1) pt.progress = 0;
        const pos = pt.curve.getPoint(pt.progress);
        pt.mesh.position.copy(pos);
      });

      // Animate Selected Node Pulse Ring
      const activeEntry = nodeMeshMap.get(selectedNode.id);
      if (activeEntry) {
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.25;
        activeEntry.ringMesh.scale.set(scale, scale, scale);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [heatmapMode, isRotating, selectedNode.id]);

  return (
    <div className="relative w-full h-full min-h-[480px] card-slate-navy overflow-hidden border border-[#23303A] font-sans">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* TOP OVERLAY: HEATMAP & INTERACTIVE CONTROLS TOOLBAR */}
      <div className="absolute top-4 left-4 z-20 font-mono space-y-2 select-none">
        {/* Heatmap Layer Mode Selector */}
        <div className="bg-[#070A0D]/95 border border-[#23303A] p-2.5 rounded-lg backdrop-blur-md space-y-1.5 shadow-xl">
          <span className="text-[10px] text-[#A8B2B7] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-[#168C8A]" />
            Globe Surface Heatmap Layer
          </span>

          <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
            <button
              onClick={() => setHeatmapMode('CONGESTION')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                heatmapMode === 'CONGESTION'
                  ? 'bg-[#168C8A] text-[#EDF1F0] font-black shadow'
                  : 'bg-[#10161B] text-[#A8B2B7] hover:text-[#EDF1F0] border border-[#23303A]'
              }`}
            >
              <Activity className="h-3 w-3" />
              Congestion
            </button>

            <button
              onClick={() => setHeatmapMode('TRAFFIC')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                heatmapMode === 'TRAFFIC'
                  ? 'bg-[#168C8A] text-[#EDF1F0] font-black shadow'
                  : 'bg-[#10161B] text-[#A8B2B7] hover:text-[#EDF1F0] border border-[#23303A]'
              }`}
            >
              <Anchor className="h-3 w-3" />
              Traffic Volume
            </button>

            <button
              onClick={() => setHeatmapMode('RISK')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                heatmapMode === 'RISK'
                  ? 'bg-[#B9783E] text-[#EDF1F0] font-black shadow'
                  : 'bg-[#10161B] text-[#A8B2B7] hover:text-[#EDF1F0] border border-[#23303A]'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              Disruption Risk
            </button>

            <button
              onClick={() => setHeatmapMode('NORMAL')}
              className={`px-2 py-1 rounded transition ${
                heatmapMode === 'NORMAL'
                  ? 'bg-[#1B252C] text-[#EDF1F0] font-black'
                  : 'bg-[#10161B] text-[#A8B2B7] hover:text-[#EDF1F0] border border-[#23303A]'
              }`}
            >
              Off
            </button>
          </div>
        </div>

        {/* Selected Port Node Badge & Camera Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-[#070A0D]/90 border border-[#23303A] px-3 py-1.5 rounded-lg backdrop-blur-md text-[11px] text-[#EDF1F0] font-bold flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-[#168C8A] animate-pulse" />
            <span>{selectedNode.name}</span>
            <span className="text-[10px] text-[#A8B2B7]">({selectedNode.country})</span>
          </div>

          <button
            onClick={() => setIsRotating(!isRotating)}
            className="bg-[#10161B]/90 hover:bg-[#1B252C] border border-[#23303A] text-[#A8B2B7] hover:text-[#EDF1F0] text-[10px] font-bold px-2.5 py-1.5 rounded-lg backdrop-blur-md transition flex items-center gap-1"
            title="Toggle Auto-Rotation"
          >
            {isRotating ? <Pause className="h-3.5 w-3.5 text-[#3B7189]" /> : <Play className="h-3.5 w-3.5 text-[#4B9A72]" />}
            {isRotating ? 'Pause' : 'Rotate'}
          </button>

          <button
            onClick={handleResetCamera}
            className="bg-[#10161B]/90 hover:bg-[#1B252C] border border-[#23303A] text-[#A8B2B7] hover:text-[#EDF1F0] text-[10px] font-bold px-2.5 py-1.5 rounded-lg backdrop-blur-md transition flex items-center gap-1"
            title="Reset Globe Camera View"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#A8B2B7]" />
            Reset
          </button>
        </div>
      </div>

      {/* TOP RIGHT LEGEND */}
      <div className="absolute top-4 right-4 z-20 bg-[#070A0D]/95 border border-[#23303A] p-3 rounded-lg backdrop-blur-md font-mono text-[10px] space-y-1.5 select-none shadow-xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4B9A72] block ring-2 ring-[#4B9A72]/30" />
          <span className="text-[#EDF1F0]">Discharge Terminal (SAIL India)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B9783E] block ring-2 ring-[#B9783E]/30" />
          <span className="text-[#EDF1F0]">Loading Origin (Global Cargo)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B7189] block ring-2 ring-[#3B7189]/30" />
          <span className="text-[#EDF1F0]">Maritime Bunkering Hub</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-[#23303A]">
          <span className="w-4 h-0.5 bg-[#168C8A] block" />
          <span className="text-[#168C8A] font-bold">Active Fleet Shipping Route</span>
        </div>
      </div>

      {/* BOTTOM RIGHT INSTRUCTIONAL PROMPT */}
      <div className="absolute bottom-3 right-4 z-20 font-mono text-[10px] text-[#A8B2B7] bg-[#070A0D]/80 border border-[#23303A] px-3 py-1 rounded backdrop-blur-md select-none">
        Drag mouse to orbit • Scroll to zoom • Click node to focus
      </div>

      {/* INTERACTIVE HOVER TOOLTIP OVERLAY */}
      {hoveredNode && hoverPos && (
        <div
          className="absolute z-30 pointer-events-none font-mono text-xs bg-[#070A0D]/95 border border-[#168C8A] p-3 rounded-lg shadow-2xl backdrop-blur-md max-w-xs space-y-1.5 transition-all duration-75"
          style={{
            left: `${Math.min(hoverPos.x + 15, (mountRef.current?.clientWidth || 800) - 260)}px`,
            top: `${Math.min(hoverPos.y + 15, (mountRef.current?.clientHeight || 450) - 160)}px`
          }}
        >
          <div className="flex items-center justify-between border-b border-[#23303A] pb-1 gap-2">
            <span className="font-extrabold text-[#EDF1F0] uppercase tracking-tight">{hoveredNode.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-[#1B252C] text-[#168C8A] border border-[#23303A]">
              {hoveredNode.code}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B2B7]">Congestion Index:</span>
              <span className={`font-bold ${hoveredNode.congestion > 60 ? 'text-[#C95B55]' : hoveredNode.congestion > 35 ? 'text-[#D19A3A]' : 'text-[#4B9A72]'}`}>
                {hoveredNode.congestion}%
              </span>
            </div>

            {/* Congestion Mini Progress Bar */}
            <div className="w-full bg-[#10161B] h-1.5 rounded-full overflow-hidden border border-[#23303A]">
              <div
                className={`h-full transition-all duration-300 ${
                  hoveredNode.congestion > 60 ? 'bg-[#C95B55]' : hoveredNode.congestion > 35 ? 'bg-[#D19A3A]' : 'bg-[#4B9A72]'
                }`}
                style={{ width: `${hoveredNode.congestion}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <span className="text-[#A8B2B7]">Max Draft Capacity:</span>
              <span className="text-[#EDF1F0] font-bold">{hoveredNode.draft}m</span>
            </div>

            <div className="text-[10px] text-[#A8B2B7] border-t border-[#23303A] pt-1 mt-1">
              <span className="text-[#168C8A] font-bold block">SAIL Strategic Note:</span>
              {hoveredNode.sailRelevance}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

