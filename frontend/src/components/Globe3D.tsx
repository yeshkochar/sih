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
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer (Steel & Ocean theme)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070A0D);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Globe Sphere & Equirectangular Landmass Canvas Texture Generator
    const globeRadius = 2.4;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Ocean Base - Dark Ocean Void
      ctx.fillStyle = '#0B131A';
      ctx.fillRect(0, 0, 2048, 1024);

      // Fine Lat/Lon Coordinate Grid - Metallic Silver
      ctx.strokeStyle = 'rgba(44, 62, 76, 0.4)';
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

      // Draw Detailed Global Continents (Steel #1B252C with #2C3E4C border)
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
    }

    const texture = new THREE.CanvasTexture(canvas);
    const globeMat = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 8,
      specular: new THREE.Color(0x168C8A)
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // 3. Atmosphere Layer (Ocean Teal Glow)
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.08, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x122B3A),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x168C8A, 1.2);
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

    // 5. Render Port Nodes
    const nodeGroup = new THREE.Group();
    const nodeMeshMap = new Map<string, { mesh: THREE.Mesh; node: GlobalLocationNode }>();

    GLOBAL_NODES.forEach((node) => {
      const pos = latLonToVector3(node.lat, node.lon, globeRadius + 0.02);
      
      // Node color coding: Emerald for Destination, Copper for Origin, Muted Blue for Hub
      let nodeColor = 0x3B7189;
      if (node.type === 'DESTINATION') nodeColor = 0x4B9A72;
      else if (node.type === 'ORIGIN') nodeColor = 0xB9783E;

      const markerGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);

      // Pulse ring for ports
      const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
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
      nodeMeshMap.set(node.id, { mesh: markerMesh, node });
    });
    scene.add(nodeGroup);

    // 6. Render Maritime Shipping Route Arcs (Ocean Teal)
    const arcGroup = new THREE.Group();
    ROUTE_ARCS.forEach((arc) => {
      const vStart = latLonToVector3(arc.originLat, arc.originLon, globeRadius + 0.02);
      const vEnd = latLonToVector3(arc.destLat, arc.destLon, globeRadius + 0.02);

      // Interpolate curved 3D 3-point arc
      const midPoint = vStart.clone().add(vEnd).multiplyScalar(0.5);
      const distance = vStart.distanceTo(vEnd);
      midPoint.setLength(globeRadius + 0.02 + distance * 0.25);

      const curve = new THREE.QuadraticBezierCurve3(vStart, midPoint, vEnd);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineDashedMaterial({
        color: 0x168C8A,
        dashSize: 0.15,
        gapSize: 0.08,
        linewidth: 2,
        transparent: true,
        opacity: 0.9
      });

      const line = new THREE.Line(curveGeo, curveMat);
      line.computeLineDistances();
      arcGroup.add(line);
    });
    scene.add(arcGroup);

    // 7. Raycaster for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.values()).map(v => v.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        for (const entry of nodeMeshMap.values()) {
          if (entry.mesh === hitMesh) {
            setSelectedNode(entry.node);
            if (onSelectNode) onSelectNode(entry.node);
            break;
          }
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating) {
        globeMesh.rotation.y += 0.0012;
        nodeGroup.rotation.y += 0.0012;
        arcGroup.rotation.y += 0.0012;
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isRotating, onSelectNode]);

  return (
    <div className="relative w-full h-full min-h-[460px] card-slate-navy overflow-hidden border border-[#23303A]">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 font-mono space-y-2 select-none">
        <div className="bg-[#070A0D]/90 border border-[#23303A] p-3 rounded-md backdrop-blur-md">
          <span className="text-[10px] text-[#A8B2B7] uppercase font-bold tracking-wider block">SAIL GLOBAL MARITIME NETWORK</span>
          <span className="text-xs font-black text-[#EDF1F0] block mt-0.5">{selectedNode.name} ({selectedNode.country})</span>
          <span className="text-[10px] text-[#168C8A] font-bold block mt-0.5">TYPE: {selectedNode.type} • CONGESTION: {selectedNode.congestion}%</span>
        </div>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className="bg-[#10161B]/90 hover:bg-[#1B252C] border border-[#23303A] text-[#A8B2B7] hover:text-[#EDF1F0] text-[10px] font-bold px-3 py-1.5 rounded-md backdrop-blur-md transition"
        >
          {isRotating ? 'Pause Rotation' : 'Resume Rotation'}
        </button>
      </div>

      {/* Top Right Legend */}
      <div className="absolute top-4 right-4 z-10 bg-[#070A0D]/90 border border-[#23303A] p-3 rounded-md backdrop-blur-md font-mono text-[10px] space-y-1.5 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4B9A72] block" />
          <span className="text-[#EDF1F0]">Discharge Terminal (India)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B9783E] block" />
          <span className="text-[#EDF1F0]">Loading Origin (Global)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B7189] block" />
          <span className="text-[#EDF1F0]">Maritime Hub / Bunkering</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-[#23303A]">
          <span className="w-4 h-0.5 bg-[#168C8A] block" />
          <span className="text-[#168C8A] font-bold">Active Fleet Shipping Route</span>
        </div>
      </div>
    </div>
  );
}
