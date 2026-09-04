import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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
  
  { id: 'nl-rotterdam', name: 'Port of Rotterdam', country: 'Netherlands', code: 'NL', lat: 51.92, lon: 4.47, draft: 24.0, congestion: 25, type: 'HUB', majorExports: 'European Scrap & Freight Derivatives', sailRelevance: 'Baltic Dry Index Benchmark Reference' },
  { id: 'ae-fujairah', name: 'Port of Fujairah', country: 'United Arab Emirates', code: 'AE', lat: 25.12, lon: 56.32, draft: 15.0, congestion: 20, type: 'HUB', majorExports: 'Middle East Bunker Fuel', sailRelevance: 'Indian Ocean Bunker Fuel Supply Point' },
  { id: 'qa-raslaffan', name: 'Ras Laffan Industrial City', country: 'Qatar', code: 'QA', lat: 25.92, lon: 51.55, draft: 15.5, congestion: 15, type: 'ORIGIN', majorExports: 'Industrial Flux & Energy', sailRelevance: 'Flux Material Sourcing Corridor' },
  { id: 'kr-busan', name: 'Port of Busan', country: 'South Korea', code: 'KR', lat: 35.10, lon: 129.04, draft: 16.0, congestion: 42, type: 'HUB', majorExports: 'Specialized Steel Plates', sailRelevance: 'East Asian Maritime Fleet Base' },
  { id: 'id-banjarmasin', name: 'Banjarmasin Port', country: 'Indonesia', code: 'ID', lat: -3.31, lon: 114.59, draft: 11.5, congestion: 55, type: 'ORIGIN', majorExports: 'Thermal Coal', sailRelevance: 'Southeast Asian Thermal Energy Supplier' }
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
  const [selectedNode, setSelectedNode] = useState<GlobalLocationNode>(GLOBAL_NODES[0]); // Default Visakhapatnam
  const [hoveredNode, setHoveredNode] = useState<GlobalLocationNode | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Clean slate navy

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Globe Sphere & Equirectangular Landmass Canvas Texture Generator
    const globeRadius = 2.4;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    
    // Canvas texture with accurate continent maps
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Ocean Base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 2048, 1024);

      // Fine Lat/Lon Coordinate Grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
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

      // Draw Detailed Global Continents (Equirectangular Projections)
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;

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
      drawLandmass([[130, 45], [145, 45], [140, 30], [130, 32]]); // Japan

      // Oceania / Australia
      drawLandmass([[113, -12], [153, -12], [153, -38], [113, -38]]);

      // Africa
      drawLandmass([[-17, 35], [32, 32], [51, 11], [40, -35], [18, -34], [9, 5], [-17, 15]]);

      // Europe
      drawLandmass([[-10, 36], [30, 40], [40, 60], [10, 65], [-10, 55]]);

      // North America
      drawLandmass([[-165, 65], [-125, 50], [-75, 45], [-80, 25], [-105, 20], [-125, 32], [-160, 55]]);

      // South America
      drawLandmass([[-80, 10], [-35, -5], [-40, -22], [-70, -55], [-75, -40], [-80, -5]]);

      // Indonesia & SE Asia Islands
      drawLandmass([[95, 5], [108, -7], [118, -8], [115, 2]]);
      drawLandmass([[115, -4], [126, -9], [125, -2]]);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const globeMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.2,
      color: 0x1e293b,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // 3. Atmosphere Glow Ring
    const atmosphereGeo = new THREE.SphereGeometry(globeRadius + 0.04, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight1.position.set(5, 3, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // Lat/Lon to 3D Spherical Vector conversion
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // 5. Global Country / Port Pickable Beacons
    const nodeGroup = new THREE.Group();
    GLOBAL_NODES.forEach(node => {
      const pos = latLonToVector3(node.lat, node.lon, globeRadius + 0.03);
      
      const pinColor = node.type === 'DESTINATION' ? 0xf59e0b : (node.type === 'HUB' ? 0x38bdf8 : 0x10b981);
      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { type: 'NODE', data: node };
      nodeGroup.add(pinMesh);

      // Ring pulse
      const ringGeo = new THREE.RingGeometry(0.06, 0.08, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: pinColor, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(0, 0, 0);
      nodeGroup.add(ringMesh);
    });
    scene.add(nodeGroup);

    // 6. Maritime Route Bezier Arcs & Particle Sparks
    const particles: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[] = [];
    
    ROUTE_ARCS.forEach(route => {
      const p1 = latLonToVector3(route.originLat, route.originLon, globeRadius + 0.02);
      const p2 = latLonToVector3(route.destLat, route.destLon, globeRadius + 0.02);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      mid.normalize().multiplyScalar(globeRadius + distance * 0.32);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
      const arcLine = new THREE.Line(lineGeo, lineMat);
      scene.add(arcLine);

      const sparkGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
      scene.add(sparkMesh);

      particles.push({
        mesh: sparkMesh,
        curve,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.002
      });
    });

    // 7. Raycasting & Interaction Handlers
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      setIsRotating(false);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) {
        // Raycasting for hover tooltip
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodeGroup.children);

        if (intersects.length > 0) {
          const obj = intersects[0].object;
          if (obj.userData && obj.userData.data) {
            setHoveredNode(obj.userData.data);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredNode(null);
        container.style.cursor = 'grab';
        return;
      }

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x += deltaY * 0.005;
      nodeGroup.rotation.y += deltaX * 0.005;
      nodeGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);
      
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData && obj.userData.data) {
          const targetNode = obj.userData.data;
          setSelectedNode(targetNode);
          if (onSelectNode) {
            onSelectNode(targetNode);
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClick);

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating && !isMouseDown) {
        globe.rotation.y += 0.0015;
        nodeGroup.rotation.y += 0.0015;
        atmosphere.rotation.y += 0.001;
      }

      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('click', onClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isRotating]);

  const displayNode = hoveredNode || selectedNode;

  return (
    <div className="relative w-full h-full min-h-[440px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-md">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Orbit Coordinates Overlay */}
      <div className="absolute top-3 right-4 z-10 text-right font-mono text-[10px] text-slate-400 font-semibold tracking-wider">
        ORBIT 17.68° N | 83.21° E • 15 NATIONS ACTIVE
      </div>

      {/* Dynamic Hover/Click Floating Tooltip */}
      {displayNode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-slate-700 px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in-up">
          <span className={`w-3 h-3 rounded-full ${
            displayNode.type === 'DESTINATION' ? 'bg-amber-500' :
            displayNode.type === 'HUB' ? 'bg-sky-400' : 'bg-emerald-400'
          } animate-pulse`} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-100">{displayNode.name}</span>
              <span className="text-xs font-mono font-bold text-sky-400">({displayNode.code})</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {displayNode.country} • Queue: <strong className="text-slate-200">{displayNode.congestion}%</strong> • Draft: <strong className="text-slate-200">{displayNode.draft}m</strong>
            </span>
          </div>
        </div>
      )}

      {/* Bottom Floating Control "Resume rotation" Button */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition"
        >
          {isRotating ? 'Pause rotation' : 'Resume rotation'}
        </button>
      </div>

      {/* Selected Country Details Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/95 border border-slate-700 p-4 rounded-lg text-xs text-slate-100 space-y-2 max-w-xs shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase font-bold block">SELECTED MARITIME NODE</span>
              <h4 className="font-bold text-sm text-slate-100">{selectedNode.name}, {selectedNode.country}</h4>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {selectedNode.code}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800 pt-2">
            <div>
              <span className="text-slate-400 block text-[10px]">Max Draft:</span>
              <span className="font-bold text-slate-100">{selectedNode.draft} m</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Queue Score:</span>
              <span className="font-bold text-sky-400">{selectedNode.congestion}%</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 border-t border-slate-800/80 pt-2 space-y-1">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">SAIL Corridor Relevance:</span>
            <p className="leading-snug">{selectedNode.sailRelevance}</p>
          </div>
        </div>
      )}

      {/* Maritime Route Legend */}
      <div className="absolute bottom-4 left-44 z-10 hidden sm:flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>SAIL Import Terminal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Raw Material Origin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Global Trade Hub</span>
        </div>
      </div>
    </div>
  );
}
