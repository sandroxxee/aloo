import React, { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import { maskContact } from '../utils/textProcessor';
import L from 'leaflet';
import { type ScannedBusiness } from './GoogleMapsScanner';
import {
  MapPin,
  Fuel,
  Truck,
  Wrench,
  Store,
  Briefcase,
  Building2,
  Phone,
  CheckCircle,
  Sparkles,
  Target,
  Navigation,
  RefreshCw
} from 'lucide-react';

interface LeafletScannerMapProps {
  center: { lat: number; lng: number };
  cityName: string;
  radiusKm: number;
  businesses: ScannedBusiness[];
  activeBusiness: ScannedBusiness | null;
  onSelectBusiness: (business: ScannedBusiness) => void;
  onManualPointScan: (lat: number, lng: number, label: string) => void;
  onSaveSingleLead?: (business: ScannedBusiness) => void;
  mapViewStyle: 'roadmap' | 'satellite';
  isScanning: boolean;
}

// Error Boundary for Leaflet Map
class MapErrorBoundary extends Component<{ children: ReactNode; fallbackProps: LeafletScannerMapProps }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallbackProps: LeafletScannerMapProps }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('MapErrorBoundary caught an error in Leaflet:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { cityName, radiusKm, businesses, activeBusiness, onSelectBusiness, isScanning } = this.props.fallbackProps;
      return (
        <div className="w-full flex-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="z-10 text-center max-w-md space-y-3">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Navigation className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold text-blue-300">
              Radar Geográfico Radar Visual - {cityName}
            </h4>
            <p className="text-xs text-slate-400">
              Modo de Varredura Visual Ativado ({businesses.length} empresas mapeadas no raio de {radiusKm}km).
            </p>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar Mapa 3D</span>
              </button>
            </div>
          </div>

          {/* Fallback pin representation */}
          <div className="mt-8 w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-2 z-10 max-h-48 overflow-y-auto scrollbar-thin">
            {businesses.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBusiness(b)}
                className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                  activeBusiness?.id === b.id
                    ? 'bg-blue-600 text-white border-blue-400 font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <div className="truncate font-bold">{b.name}</div>
                <div className="text-xs text-slate-400 truncate">{maskContact(b.phone)}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LeafletScannerMapInner: React.FC<LeafletScannerMapProps> = ({
  center,
  cityName,
  radiusKm,
  businesses,
  activeBusiness,
  onSelectBusiness,
  onManualPointScan,
  onSaveSingleLead,
  mapViewStyle,
  isScanning
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const manualMarkerRef = useRef<L.Marker | null>(null);
  const markersMapRef = useRef<Map<string, { marker: L.Marker; business: ScannedBusiness }>>(new Map());
  const activeMarkerIdRef = useRef<string | null>(null);

  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(10);

  // Initialize Leaflet Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon paths in Vite/ESM environment & patch L.Canvas context safety
    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Safely patch L.Canvas prototype to prevent 'clearRect' undefined error
      if (L.Canvas && (L.Canvas.prototype as any)) {
        const proto = L.Canvas.prototype as any;
        if (proto._clear && !proto._clear_patched) {
          const origClear = proto._clear;
          proto._clear = function () {
            if (!this._ctx) return;
            try {
              origClear.call(this);
            } catch (err) {
              console.warn('Protected Leaflet canvas clear:', err);
            }
          };
          proto._clear_patched = true;
        }
      }
    } catch {
      // ignore
    }

    // Clean previous instance if any
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Leaflet map remove error:', err);
      }
      mapInstanceRef.current = null;
    }

    // Reset internal Leaflet DOM marker
    if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const safeLat = (center && typeof center.lat === 'number' && !isNaN(center.lat)) ? center.lat : -23.5505;
    const safeLng = (center && typeof center.lng === 'number' && !isNaN(center.lng)) ? center.lng : -46.6333;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [safeLat, safeLng],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: false,
        wheelPxPerZoomLevel: 120
      });

      mapInstanceRef.current = map;

      // Force recalculating map dimensions after DOM layout stabilizes
      setTimeout(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {
            // ignore
          }
        }
      }, 200);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      map.on('zoomend', () => {
        if (mapInstanceRef.current) {
          try {
            setZoomLevel(map.getZoom());
          } catch {
            // ignore
          }
        }
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!e || !e.latlng) return;
        const { lat, lng } = e.latlng;
        setClickedPoint({ lat, lng });

        try {
          if (manualMarkerRef.current) {
            manualMarkerRef.current.setLatLng([lat, lng]);
          } else if (mapInstanceRef.current) {
            const manualIcon = L.divIcon({
              className: 'manual-pin-icon',
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <div class="absolute -bottom-1 w-2 h-2 bg-rose-600 rotate-45"></div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            });

            manualMarkerRef.current = L.marker([lat, lng], { icon: manualIcon }).addTo(mapInstanceRef.current);
          }
        } catch (clickErr) {
          console.warn('Manual pin error:', clickErr);
        }
      });
    } catch (mapErr) {
      console.warn('Error creating Leaflet map instance:', mapErr);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Update Tile Layer safely
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const tileUrl =
        mapViewStyle === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      tileLayerRef.current = tileLayer;
    } catch (tileErr) {
      console.warn('Leaflet tile layer error:', tileErr);
    }
  }, [mapViewStyle]);

  // Update Center & Radius Circle safely
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const safeLat = (center && typeof center.lat === 'number' && !isNaN(center.lat)) ? center.lat : -23.5505;
    const safeLng = (center && typeof center.lng === 'number' && !isNaN(center.lng)) ? center.lng : -46.6333;

    try {
      map.setView([safeLat, safeLng]);

      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }

      const radiusMeters = (radiusKm || 50) * 1000;
      const circle = L.circle([safeLat, safeLng], {
        radius: radiusMeters,
        color: '#2563eb',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#3b82f6',
        fillOpacity: mapViewStyle === 'satellite' ? 0.2 : 0.12
      }).addTo(map);

      circleRef.current = circle;

      try {
        map.fitBounds(circle.getBounds(), { padding: [20, 20] });
      } catch {
        // ignore
      }
    } catch (circleErr) {
      console.warn('Leaflet circle/center error:', circleErr);
    }
  }, [center?.lat, center?.lng, radiusKm, mapViewStyle]);

  // Helper function to create marker divIcon efficiently
  const createBusinessIcon = (categoryType: string, saved: boolean, isSelected: boolean): L.DivIcon => {
    let bgColor = 'bg-blue-600';
    let iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';

    if (categoryType === 'posto') {
      bgColor = 'bg-amber-600';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>';
    } else if (categoryType === 'transportadora') {
      bgColor = 'bg-indigo-600';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';
    } else if (categoryType === 'pecas') {
      bgColor = 'bg-emerald-600';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
    } else if (categoryType === 'concessionaria') {
      bgColor = 'bg-rose-600';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7"/></svg>';
    }

    if (saved) {
      bgColor = 'bg-emerald-600 ring-2 ring-emerald-300';
    }

    const divHtml = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <div class="w-7 h-7 rounded-full ${bgColor} text-white border-2 border-white shadow-md flex items-center justify-center transition-transform ${
          isSelected ? 'scale-125 ring-4 ring-amber-400  animate-bounce' : 'hover:scale-110'
        }">
          ${iconSvg}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-business-icon',
      html: divHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  // Render Business Markers safely
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    try {
      markersGroup.clearLayers();
      markersMapRef.current.clear();
      activeMarkerIdRef.current = null;

      businesses.forEach((b) => {
        if (!b || typeof b.lat !== 'number' || typeof b.lng !== 'number' || isNaN(b.lat) || isNaN(b.lng)) {
          return;
        }

        const isSelected = activeBusiness?.id === b.id;
        if (isSelected) {
          activeMarkerIdRef.current = b.id;
        }
        const markerIcon = createBusinessIcon(b.categoryType, !!b.saved, isSelected);
        const marker = L.marker([b.lat, b.lng], { icon: markerIcon });

        if (isSelected) {
          marker.setZIndexOffset(1000);
        }

        const popupContent = `
          <div style="font-family: sans-serif; padding: 2px; min-width: 180px;">
            <div style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform:;">${b.category}</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${b.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">📍 ${b.city} - ${b.address}</div>
            <div style="font-size: 11px; font-weight: 700; color: #16a34a; margin-top: 4px;">📞 ${maskContact(b.phone)} (${b.phoneType})</div>
            ${b.distributor ? `<div style="font-size: 10px; font-weight: 800; color: #4338ca; margin-top: 2px;">🏢 ${b.distributor}</div>` : ''}
            <div style="margin-top: 8px; text-align: right;">
              <button id="btn-popup-select-${b.id}" style="background-color: #2563eb; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">Ver Detalhes</button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          onSelectBusiness(b);
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-popup-select-${b.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectBusiness(b);
            };
          }
        });

        markersGroup.addLayer(marker);
        markersMapRef.current.set(b.id, { marker, business: b });
      });
    } catch (markerErr) {
      console.warn('Leaflet marker render error:', markerErr);
    }
  }, [businesses]);

  // Effect 2: Update selected active business marker without recreating all markers!
  useEffect(() => {
    const newActiveId = activeBusiness?.id || null;
    const prevActiveId = activeMarkerIdRef.current;

    if (newActiveId === prevActiveId) return;

    // Reset previous active marker icon
    if (prevActiveId && markersMapRef.current.has(prevActiveId)) {
      const { marker, business } = markersMapRef.current.get(prevActiveId)!;
      marker.setIcon(createBusinessIcon(business.categoryType, !!business.saved, false));
      marker.setZIndexOffset(0);
    }

    // Set new active marker icon
    if (newActiveId && markersMapRef.current.has(newActiveId)) {
      const { marker, business } = markersMapRef.current.get(newActiveId)!;
      marker.setIcon(createBusinessIcon(business.categoryType, !!business.saved, true));
      marker.setZIndexOffset(1000);
    }

    activeMarkerIdRef.current = newActiveId;
  }, [activeBusiness]);

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Map Control Floating Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold">
          <Navigation className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{cityName}</span>
          <span className="text-blue-300  bg-blue-900/60 px-2 py-0.5 rounded border border-blue-500/30 text-xs">
            Raio {radiusKm} km
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 rounded-xl shadow-lg flex items-center p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                try {
                  mapInstanceRef.current?.zoomIn();
                } catch {
                  // ignore
                }
              }}
              className="px-2 py-0.5 hover:bg-slate-800 rounded text-slate-200 cursor-pointer"
              title="Aumentar Zoom"
            >
              +
            </button>
            <span className="text-xs text-slate-400 px-1 font-mono">{zoomLevel}x</span>
            <button
              type="button"
              onClick={() => {
                try {
                  mapInstanceRef.current?.zoomOut();
                } catch {
                  // ignore
                }
              }}
              className="px-2 py-0.5 hover:bg-slate-800 rounded text-slate-200 cursor-pointer"
              title="Diminuir Zoom"
            >
              -
            </button>
          </div>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current && circleRef.current) {
                try {
                  mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
                } catch {
                  // ignore
                }
              }
            }}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-slate-200 text-sm font-bold rounded-xl border border-slate-700/80 shadow-lg cursor-pointer flex items-center gap-1"
            title="Centralizar no Raio da Cidade"
          >
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Recentralizar</span>
          </button>
        </div>
      </div>

      {/* Actual Leaflet Map Canvas Container */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-800 min-h-[460px] z-10"
      />

      {/* Floating Manual Click extraction banner */}
      {clickedPoint && (
        <div className="absolute bottom-12 left-4 right-4 z-[400] bg-slate-900/95 border border-rose-500/50 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 rounded-xl text-white shrink-0 shadow-md animate-pulse">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span>PONTO CLICADO NO MAPA</span>
                <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-1.5 rounded font-mono">
                  {clickedPoint.lat.toFixed(4)}, {clickedPoint.lng.toFixed(4)}
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Deseja extrair contatos de empresas ao redor destas coordenadas exatas?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onManualPointScan(
                  clickedPoint.lat,
                  clickedPoint.lng,
                  `Ponto (${clickedPoint.lat.toFixed(3)}, ${clickedPoint.lng.toFixed(3)})`
                );
                setClickedPoint(null);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white  text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Extrair Neste Ponto</span>
            </button>

            <button
              type="button"
              onClick={() => setClickedPoint(null)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Bottom Hint Bar */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
        <span className="flex items-center gap-1 text-slate-400 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Dica: Clique em qualquer lugar do mapa para extrair contatos de um ponto específico</span>
        </span>
        <span className="font-mono text-slate-500">Leaflet OpenStreetMap / Esri</span>
      </div>
    </div>
  );
};

export const LeafletScannerMap: React.FC<LeafletScannerMapProps> = React.memo(
  (props) => {
    return (
      <MapErrorBoundary fallbackProps={props}>
        <LeafletScannerMapInner {...props} />
      </MapErrorBoundary>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.center?.lat === nextProps.center?.lat &&
      prevProps.center?.lng === nextProps.center?.lng &&
      prevProps.radiusKm === nextProps.radiusKm &&
      prevProps.cityName === nextProps.cityName &&
      prevProps.mapViewStyle === nextProps.mapViewStyle &&
      prevProps.isScanning === nextProps.isScanning &&
      prevProps.activeBusiness?.id === nextProps.activeBusiness?.id &&
      prevProps.businesses === nextProps.businesses
    );
  }
);
