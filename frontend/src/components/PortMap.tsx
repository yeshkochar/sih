import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Import leaflet styles locally or override
import 'leaflet/dist/leaflet.css';

interface Port {
  id: number;
  name: string;
  country: string;
  coast: string;
  latitude: float;
  longitude: float;
  max_loa: float;
  max_beam: float;
  max_draft: float;
  berth_capacity: int;
  cargo_handling_capacity: float;
  congestion_score: float;
  status: string;
}

interface PortMapProps {
  ports: Port[];
  selectedOrigin?: string;
  selectedDestination?: string;
  onSelectPort?: (portName: string) => void;
}

// Custom glowing markers using divIcon to bypass Vite pathing issues
const createGlowingIcon = (color: string, isBig: boolean = false) => {
  const size = isBig ? 16 : 12;
  const shadowSize = isBig ? 12 : 8;
  return L.divIcon({
    className: 'glowing-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${color};
          z-index: 2;
        "></div>
        <div class="pulse-glow" style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: ${size + 8}px;
          height: ${size + 8}px;
          border-radius: 50%;
          background-color: ${color};
          opacity: 0.4;
          z-index: 1;
          animation: soft-pulse 2s infinite ease-in-out;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function PortMap({ ports, selectedOrigin, selectedDestination, onSelectPort }: PortMapProps) {
  // Find coordinates for polyline
  const originPort = ports.find(p => p.name === selectedOrigin);
  const destPort = ports.find(p => p.name === selectedDestination);
  
  const polylineCoords: [number, number][] = [];
  if (originPort && destPort) {
    polylineCoords.push([originPort.latitude, originPort.longitude]);
    
    // Add midpoint to make a nice route curve (arc representation)
    const midLat = (originPort.latitude + destPort.latitude) / 2;
    const midLng = (originPort.longitude + destPort.longitude) / 2;
    
    // Push slightly bent coordinates for visuals
    const bentLat = midLat + (originPort.longitude > destPort.longitude ? 5 : -5);
    polylineCoords.push([bentLat, midLng]);
    polylineCoords.push([destPort.latitude, destPort.longitude]);
  }

  // Center on India East Coast by default
  const defaultCenter: [number, number] = [17.68, 83.21];
  const defaultZoom = 4;

  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {ports.map((port) => {
          const isOrigin = port.name === selectedOrigin;
          const isDest = port.name === selectedDestination;
          
          let markerColor = '#94a3b8'; // Default gray
          if (port.coast === 'East Coast') {
            markerColor = '#e11d48'; // Indian East Coast ports (Rose/Red)
          } else if (port.coast === 'Overseas') {
            markerColor = '#10b981'; // Green for overseas cargo origins
          }
          
          if (isOrigin) markerColor = '#3b82f6'; // Bright blue for active selection
          if (isDest) markerColor = '#a855f7'; // Purple for active destination

          const icon = createGlowingIcon(markerColor, isOrigin || isDest);

          return (
            <Marker
              key={port.id}
              position={[port.latitude, port.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectPort && onSelectPort(port.name),
              }}
            >
              <Popup>
                <div className="text-slate-900 font-sans p-1">
                  <div className="font-bold text-sm border-b pb-1 mb-1 text-slate-800 flex justify-between gap-4">
                    <span>{port.name}</span>
                    <span className="text-xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border">
                      {port.coast}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 mt-2">
                    <div>Country:</div>
                    <div className="font-medium text-slate-800">{port.country}</div>
                    
                    <div>Congestion:</div>
                    <div className={`font-semibold ${port.congestion_score > 50 ? 'text-amber-600' : 'text-green-600'}`}>
                      {port.congestion_score}%
                    </div>
                    
                    <div>Max Draft:</div>
                    <div className="font-medium text-slate-800">{port.max_draft}m</div>
                    
                    <div>Max LOA:</div>
                    <div className="font-medium text-slate-800">{port.max_loa}m</div>
                    
                    <div>Berths:</div>
                    <div className="font-medium text-slate-800">{port.berth_capacity}</div>
                    
                    <div>Status:</div>
                    <div className={`font-semibold uppercase ${port.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {port.status}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {polylineCoords.length > 0 && (
          <Polyline
            positions={polylineCoords}
            color="#3b82f6"
            weight={3}
            dashArray="10, 10"
            opacity={0.8}
          />
        )}
      </MapContainer>
      
      {/* Map Legend overlay */}
      <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800 p-3 rounded-lg text-xs space-y-1.5 z-[1000] shadow-xl backdrop-blur">
        <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800 mb-1">Route Indicators</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
          <span className="text-slate-400">Overseas Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
          <span className="text-slate-400">SAIL East Coast Port</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
          <span className="text-slate-400">Selected Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white" />
          <span className="text-slate-400">Selected Destination</span>
        </div>
      </div>
    </div>
  );
}
