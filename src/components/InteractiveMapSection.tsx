import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  CloudSun,
  Phone,
  Route
} from 'lucide-react';
import { Listing, CloudLandmark } from '../types/index.ts';
import {
  formatVND,
  calculateDistanceKm,
  estimateMountainTravelMinutes
} from '../utils/rules.ts';

interface InteractiveMapSectionProps {
  listings: Listing[];
  landmarks: CloudLandmark[];
  onSelectListing: (listing: Listing) => void;
}

type MapFilterType = 'all' | 'landmarks' | 'homestay' | 'coffee_food' | 'other';

export const InteractiveMapSection: React.FC<InteractiveMapSectionProps> = ({
  listings,
  landmarks,
  onSelectListing
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeFilter, setActiveFilter] = useState<MapFilterType>('all');
  const [mapStyle, setMapStyle] = useState<'dark' | 'terrain'>('terrain');
  const [selectedLandmark, setSelectedLandmark] = useState<CloudLandmark | null>(
    landmarks[0] || null
  );
  const [selectedMapListing, setSelectedMapListing] = useState<Listing | null>(null);
  const [targetCloudSpotId, setTargetCloudSpotId] = useState<string>('spot-dinh-gio');

  // Store latest callbacks in ref so Leaflet markers never use stale handlers
  const callbacksRef = useRef({
    onSelectListing,
    setSelectedLandmark,
    setSelectedMapListing
  });
  callbacksRef.current = {
    onSelectListing,
    setSelectedLandmark,
    setSelectedMapListing
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'homestay':
        return '🏡';
      case 'coffee':
        return '☕';
      case 'restaurant':
        return '🍲';
      case 'tour':
        return '🥾';
      case 'motorbike':
        return '🏍️';
      case 'photo':
        return '📸';
      case 'rescue':
        return '🚨';
      default:
        return '📍';
    }
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [21.335, 104.484],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true
    });

    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(osmUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Draw main Tà Xùa mountain road backbone (Khe Cải -> Đỉnh Gió -> Trung Tâm -> Thảo Nguyên -> Cây Cô Đơn -> Sống Lưng Khủng Long)
    const mainLoopCoords: [number, number][] = [
      [21.3188, 104.4685], // Khe Cải
      [21.3278, 104.4775], // Đỉnh Gió
      [21.3245, 104.4832], // Trung tâm xã Tà Xùa
      [21.3510, 104.4620], // Thảo Nguyên
      [21.3585, 104.4565], // Cây Cô Đơn
      [21.3695, 104.5132]  // Sống Lưng Khủng Long
    ];

    L.polyline(mainLoopCoords, {
      color: '#073161',
      weight: 3.5,
      opacity: 0.7,
      dashArray: '6, 8'
    })
      .bindTooltip('Trục đường săn mây chính Tà Xùa - Háng Đồng', { sticky: true })
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Markers & Active Route Line
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Render Cloud Hunting Landmarks
    if (activeFilter === 'all' || activeFilter === 'landmarks') {
      landmarks.forEach((spot) => {
        const isSelected = selectedLandmark?.id === spot.id && !selectedMapListing;
        const iconHtml = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 11px;
            border-radius: 9999px;
            background: ${isSelected ? '#073161' : '#0f172a'};
            border: 2px solid ${spot.cloudProbability >= 85 ? '#10b981' : '#38bdf8'};
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 6px 16px rgba(7,49,97,0.35);
            transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            <span>☁️</span>
            <span>${spot.area}</span>
            <span style="
              background: rgba(16, 185, 129, 0.25);
              color: #6ee7b7;
              padding: 1px 6px;
              border-radius: 999px;
              font-size: 10px;
            ">${spot.cloudProbability}%</span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: iconHtml,
          iconSize: [140, 32],
          iconAnchor: [70, 16]
        });

        const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
          icon: customIcon,
          zIndexOffset: 500
        });

        marker.on('click', () => {
          callbacksRef.current.setSelectedMapListing(null);
          callbacksRef.current.setSelectedLandmark(spot);
          map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 14, {
            duration: 0.7
          });
        });

        marker.addTo(markersLayer);
      });
    }

    // 2. Filter & Render Homestays and Services
    const filteredListings = listings.filter((item) => {
      if (activeFilter === 'landmarks') return false;
      if (activeFilter === 'homestay') return item.category === 'homestay';
      if (activeFilter === 'coffee_food') {
        return item.category === 'coffee' || item.category === 'restaurant';
      }
      if (activeFilter === 'other') {
        return (
          item.category === 'tour' ||
          item.category === 'motorbike' ||
          item.category === 'photo' ||
          item.category === 'rescue'
        );
      }
      return true;
    });

    filteredListings.forEach((item) => {
      const isSelected = selectedMapListing?.id === item.id;
      const emoji = getCategoryEmoji(item.category);
      const shortPrice =
        item.minPrice > 0 ? `${Math.round(item.minPrice / 1000)}k` : 'SOS';

      const bgColor =
        item.category === 'homestay'
          ? isSelected
            ? '#073161'
            : '#0d7a74'
          : item.category === 'rescue'
          ? '#e11d48'
          : isSelected
          ? '#073161'
          : '#ffffff';

      const textColor =
        item.category === 'homestay' || item.category === 'rescue' || isSelected
          ? '#ffffff'
          : '#073161';

      const pinHtml = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 9999px;
          background: ${bgColor};
          border: 2px solid ${isSelected ? '#f59e0b' : '#073161'};
          color: ${textColor};
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(7,49,97,0.22);
          transform: ${isSelected ? 'scale(1.14)' : 'scale(1)'};
          transition: all 0.2s ease;
        ">
          <span>${emoji}</span>
          <span>${shortPrice}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: pinHtml,
        iconSize: [76, 28],
        iconAnchor: [38, 14]
      });

      const marker = L.marker([item.coordinates.lat, item.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 200
      });

      marker.on('click', () => {
        callbacksRef.current.setSelectedMapListing(item);
        map.flyTo([item.coordinates.lat, item.coordinates.lng], 15, {
          duration: 0.7
        });
      });

      marker.addTo(markersLayer);
    });

    // 3. Draw Route Line between Selected Homestay and Target Cloud Landmark
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const activeCloudTarget =
      landmarks.find((l) => l.id === targetCloudSpotId) || landmarks[0];

    if (selectedMapListing && activeCloudTarget) {
      const poly = L.polyline(
        [
          [selectedMapListing.coordinates.lat, selectedMapListing.coordinates.lng],
          [activeCloudTarget.coordinates.lat, activeCloudTarget.coordinates.lng]
        ],
        {
          color: '#0d7a74',
          weight: 3.5,
          dashArray: '5, 7',
          opacity: 0.95
        }
      ).addTo(map);
      routeLineRef.current = poly;
    }
  }, [
    listings,
    landmarks,
    activeFilter,
    selectedLandmark,
    selectedMapListing,
    targetCloudSpotId
  ]);

  const handleFlyToLandmark = (spot: CloudLandmark) => {
    setSelectedMapListing(null);
    setSelectedLandmark(spot);
    setTargetCloudSpotId(spot.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.coordinates.lat, spot.coordinates.lng], 14, {
        duration: 0.7
      });
    }
  };

  const handleFlyToListing = (item: Listing) => {
    setSelectedMapListing(item);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.coordinates.lat, item.coordinates.lng], 15, {
        duration: 0.7
      });
    }
  };

  const handleResetOverview = () => {
    setSelectedMapListing(null);
    setSelectedLandmark(landmarks[0] || null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.338, 104.484], 13, {
        duration: 0.7
      });
    }
  };

  const dinhGioSpot = landmarks.find((l) => l.id === 'spot-dinh-gio') || landmarks[0];
  const songLungSpot = landmarks.find((l) => l.id === 'spot-song-lung') || landmarks[1];

  const distToDinhGio =
    selectedMapListing && dinhGioSpot
      ? calculateDistanceKm(selectedMapListing.coordinates, dinhGioSpot.coordinates)
      : 0;
  const minsToDinhGio = estimateMountainTravelMinutes(distToDinhGio);

  const distToSongLung =
    selectedMapListing && songLungSpot
      ? calculateDistanceKm(selectedMapListing.coordinates, songLungSpot.coordinates)
      : 0;
  const minsToSongLung = estimateMountainTravelMinutes(distToSongLung);

  return (
    <section
      id="interactive-map-section"
      className="bg-[#f8fafc] border-y border-slate-200/80 py-14 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header matching taxuaslay1.vercel.app editorial style */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
              BẢN ĐỒ ĐỊNH HƯỚNG & TỌA ĐỘ SĂN MÂY
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#073161] tracking-tight">
              Định vị Homestay, Đỉnh Gió & Sống Lưng Khủng Long
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Kiểm tra vị trí thực tế, độ cao, đường vào đã thẩm định và khoảng cách di chuyển từ nơi lưu trú tới các tọa độ săn mây chính.
            </p>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetOverview}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#073161] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-700" />
              <span>Toàn cảnh Tà Xùa</span>
            </button>

            {landmarks.slice(0, 3).map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => handleFlyToLandmark(spot)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  selectedLandmark?.id === spot.id && !selectedMapListing
                    ? 'bg-[#073161] text-white border-[#073161] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-[#073161] border-slate-200'
                }`}
              >
                <CloudSun className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {spot.area} ({spot.cloudProbability}%)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar & Map Style Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 p-3 rounded-2xl mb-6 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#073161] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả vị trí ({landmarks.length + listings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('landmarks')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'landmarks'
                  ? 'bg-[#073161] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ☁️ Điểm Săn Mây ({landmarks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('homestay')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'homestay'
                  ? 'bg-[#073161] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🏡 Homestay ({listings.filter((l) => l.category === 'homestay').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('coffee_food')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'coffee_food'
                  ? 'bg-[#073161] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ☕ Cà phê & Ẩm thực (
              {listings.filter((l) => l.category === 'coffee' || l.category === 'restaurant').length}
              )
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('other')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'other'
                  ? 'bg-[#073161] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🏍️ Xe máy, Tour & Cứu hộ
            </button>
          </div>

          {/* Map Layer Mode */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => setMapStyle('terrain')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mapStyle === 'terrain'
                  ? 'bg-[#073161] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản đồ Địa hình (OSM)
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mapStyle === 'dark'
                  ? 'bg-[#073161] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chế độ Đêm
            </button>
          </div>
        </div>

        {/* Main Interactive Map & Inspector Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Canvas Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100 h-[440px] sm:h-[520px]">
              <div
                ref={mapContainerRef}
                data-testid="taxua-interactive-map"
                className={`w-full h-full z-10 ${mapStyle === 'dark' ? 'map-theme-dark' : ''}`}
              />

              {/* Floating Map Legend */}
              <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 shadow-lg pointer-events-none space-y-1">
                <div className="font-extrabold text-[#073161] mb-1">Chú giải bản đồ Tà Xùa:</div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>☁️ Tọa độ săn mây chính + Chỉ số Cloud View</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-700"></span>
                  <span>🏡 Homestay & dịch vụ đã thẩm định</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 border-b-2 border-dashed border-[#073161]"></span>
                  <span>Trục đường đèo Đỉnh Gió – Háng Đồng</span>
                </div>
              </div>
            </div>

            {/* Horizontal Quick Directory of Cloud Hunting Landmarks */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {landmarks.map((spot) => {
                const isSelected = selectedLandmark?.id === spot.id && !selectedMapListing;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => handleFlyToLandmark(spot)}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#073161] text-white border-[#073161] shadow-md'
                        : 'bg-white border-slate-200 hover:border-[#073161]/40 text-slate-800'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between text-[11px] font-bold mb-1 ${
                        isSelected ? 'text-teal-200' : 'text-teal-700'
                      }`}
                    >
                      <span>⛰️ {spot.altitude}</span>
                      <span>{spot.cloudProbability}%</span>
                    </div>
                    <div
                      className={`text-xs font-extrabold line-clamp-1 ${
                        isSelected ? 'text-white' : 'text-[#073161]'
                      }`}
                    >
                      {spot.area}
                    </div>
                    <div
                      className={`text-[11px] line-clamp-1 mt-0.5 ${
                        isSelected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {spot.distanceFromCenter}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Inspector & Orientation Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {selectedMapListing ? (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col">
                <div className="relative h-44 w-full">
                  <img
                    src={selectedMapListing.coverImage}
                    alt={selectedMapListing.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#073161] text-white">
                      {selectedMapListing.area}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <h3 className="text-base font-extrabold line-clamp-1">
                      {selectedMapListing.title}
                    </h3>
                    <p className="text-xs text-slate-200">{selectedMapListing.address}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Distance Orientation Box */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#073161]">
                      <Route className="w-4 h-4 text-teal-700" />
                      <span>Khoảng cách di chuyển đường đèo:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setTargetCloudSpotId('spot-dinh-gio')}
                        className={`text-left p-2.5 rounded-xl border cursor-pointer transition-all ${
                          targetCloudSpotId === 'spot-dinh-gio'
                            ? 'bg-[#073161] border-[#073161] text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div
                          className={`text-[10px] ${
                            targetCloudSpotId === 'spot-dinh-gio'
                              ? 'text-slate-200'
                              : 'text-slate-500'
                          }`}
                        >
                          Tới Đỉnh Gió:
                        </div>
                        <div className="font-extrabold text-sm tabular-nums">{distToDinhGio} km</div>
                        <div
                          className={`text-[10px] ${
                            targetCloudSpotId === 'spot-dinh-gio'
                              ? 'text-teal-200'
                              : 'text-teal-700'
                          }`}
                        >
                          ~{minsToDinhGio} phút xe máy
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetCloudSpotId('spot-song-lung')}
                        className={`text-left p-2.5 rounded-xl border cursor-pointer transition-all ${
                          targetCloudSpotId === 'spot-song-lung'
                            ? 'bg-[#073161] border-[#073161] text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div
                          className={`text-[10px] ${
                            targetCloudSpotId === 'spot-song-lung'
                              ? 'text-slate-200'
                              : 'text-slate-500'
                          }`}
                        >
                          Tới Sống Lưng:
                        </div>
                        <div className="font-extrabold text-sm tabular-nums">{distToSongLung} km</div>
                        <div
                          className={`text-[10px] ${
                            targetCloudSpotId === 'spot-song-lung'
                              ? 'text-teal-200'
                              : 'text-teal-700'
                          }`}
                        >
                          ~{minsToSongLung} phút xe máy
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Price & Public Phone */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Giá ghi nhận:</span>
                      <span className="text-sm font-extrabold text-[#073161] tabular-nums">
                        {selectedMapListing.minPrice > 0
                          ? formatVND(selectedMapListing.minPrice)
                          : 'Hỗ trợ 24/7'}
                      </span>
                    </div>
                    <a
                      href={`tel:${selectedMapListing.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-[#073161] font-bold px-3 py-1.5 rounded-full border border-slate-200"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-700" />
                      <span>{selectedMapListing.phone}</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectListing(selectedMapListing)}
                    className="w-full bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold py-3 rounded-full text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Xem hồ sơ thẩm định & Đặt phòng →
                  </button>
                </div>
              </div>
            ) : selectedLandmark ? (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col">
                <div className="relative h-44 w-full">
                  <img
                    src={selectedLandmark.imageUrl}
                    alt={selectedLandmark.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#073161] text-white">
                      ⛰️ Độ cao {selectedLandmark.altitude}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-700 text-white">
                      ☁️ {selectedLandmark.cloudProbability}% Cloud View
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <h3 className="text-base font-extrabold">{selectedLandmark.name}</h3>
                    <p className="text-xs text-teal-200 font-medium">
                      {selectedLandmark.distanceFromCenter}
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  <p className="text-slate-600 leading-relaxed">{selectedLandmark.description}</p>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Khung giờ ngắm mây:</span>
                      <span className="text-[#073161] font-bold">{selectedLandmark.bestTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tọa độ GPS:</span>
                      <span className="font-mono text-slate-700 tabular-nums">
                        {selectedLandmark.coordinates.lat.toFixed(4)}°N,{' '}
                        {selectedLandmark.coordinates.lng.toFixed(4)}°E
                      </span>
                    </div>
                  </div>

                  <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3 text-slate-700">
                    <strong className="text-[#073161] block mb-0.5">Đường vào đã thẩm định:</strong>
                    {selectedLandmark.roadCondition}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Directory List of Homestays on Map */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 flex-1 shadow-2xs">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#073161] mb-3 flex items-center justify-between">
                <span>Cơ sở trên bản đồ</span>
                <span className="text-slate-400 font-normal">Bấm để định vị</span>
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {listings.map((item) => {
                  const isCurrent = selectedMapListing?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleFlyToListing(item)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#073161] border-[#073161] text-white'
                          : 'bg-slate-50 border-slate-200/80 hover:border-[#073161]/40 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{getCategoryEmoji(item.category)}</span>
                        <div className="truncate">
                          <div
                            className={`text-xs font-bold truncate ${
                              isCurrent ? 'text-white' : 'text-[#073161]'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div
                            className={`text-[10px] ${
                              isCurrent ? 'text-slate-200' : 'text-slate-500'
                            }`}
                          >
                            {item.area} · ⭐ {item.rating}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-extrabold shrink-0 tabular-nums ${
                          isCurrent ? 'text-teal-200' : 'text-teal-700'
                        }`}
                      >
                        {item.minPrice > 0 ? `${Math.round(item.minPrice / 1000)}k` : '24/7'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
