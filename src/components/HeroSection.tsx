import React, { useState } from 'react';
import {
  Building2,
  Package,
  Bus,
  Bike,
  Calendar,
  Users,
  CheckCircle2,
  CloudSun,
  Eye,
  Car,
  MapPin,
  Search
} from 'lucide-react';
import { LocationArea } from '../types/index.ts';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  onlyCloudView: boolean;
  setOnlyCloudView: (val: boolean) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (val: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onExploreClick: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedArea,
  setSelectedArea,
  onlyCloudView,
  setOnlyCloudView,
  onlyAvailable,
  setOnlyAvailable,
  onExploreClick,
  onNavigateTab
}) => {
  const [checkInDate, setCheckInDate] = useState('2026-11-06');
  const [checkOutDate, setCheckOutDate] = useState('2026-11-08');
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [bedViewFilter, setBedViewFilter] = useState(false);
  const [carAccessFilter, setCarAccessFilter] = useState(false);

  const areas: (LocationArea | 'all')[] = [
    'all',
    'Đỉnh Gió',
    'Sống Lưng Khủng Long',
    'Khe Cải',
    'Trung Tâm Tà Xùa',
    'Mống Vàng',
    'Thảo Nguyên',
    'Bắc Yên'
  ];

  const handleSearchSubmit = () => {
    onExploreClick();
    const el = document.getElementById('verified-listings-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Deep Navy-to-Teal Hero Section matching https://taxuaslay1.vercel.app/ */}
      <div className="relative bg-gradient-to-br from-[#04244d] via-[#063366] to-[#084d5e] text-white pt-7 sm:pt-16 pb-24 sm:pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle atmospheric radial glow */}
        <div
          className="pointer-events-none absolute -top-24 right-0 w-[550px] h-[550px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)'
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          {/* Brand Title */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-3">
              <span>🏔️ Cổng đặt phòng & thông tin Tà Xùa</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
              TÀ XÙA TRIP
            </h1>
            <p className="font-script text-2xl sm:text-4xl text-teal-200 mt-1 mb-2 leading-tight">
              Đi thật. Biết trước.
            </p>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mb-4 max-w-lg">
              179+ homestay kiểm duyệt thực tế, minh bạch giá phòng và liên hệ trực tiếp chủ nhà không qua trung gian.
            </p>
          </div>
        </div>
      </div>

      {/* Floating White Search Console Card overlapping Hero & Light Canvas */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-20">
        <div className="bg-white rounded-3xl sm:rounded-[28px] shadow-[0_22px_50px_rgba(7,49,97,0.12)] border border-slate-200/90 overflow-hidden">
          {/* Top Service Tabs Row */}
          <div className="flex items-center border-b border-slate-200/80 overflow-x-auto no-scrollbar bg-slate-50/50">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'all' || selectedCategory === 'homestay'
                  ? 'bg-[#073161] text-white'
                  : 'text-slate-600 hover:text-[#073161]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Lưu trú</span>
              {(selectedCategory === 'all' || selectedCategory === 'homestay') && (
                <span className="absolute bottom-0 left-3 right-3 h-1 bg-amber-400 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('tour');
                handleSearchSubmit();
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'tour'
                  ? 'bg-[#073161] text-white'
                  : 'text-slate-500 hover:text-[#073161]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Combo & Trekking</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Thẩm định
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('bus');
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#073161] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Bus className="w-4 h-4" />
              <span>Xe khách</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đón dọc tuyến
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('motorbike');
                handleSearchSubmit();
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'motorbike'
                  ? 'bg-[#073161] text-white'
                  : 'text-slate-500 hover:text-[#073161]'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Xe máy</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Tà Xùa Biker
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('map');
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer ml-auto"
            >
              <MapPin className="w-4 h-4" />
              <span>Bản đồ tọa độ săn mây →</span>
            </button>
          </div>

          {/* Main Booking & Search Inputs: 2x2 compact grid on mobile, 12-col single row on desktop */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-4 items-center">
              {/* Check-in Date */}
              <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>NHẬN PHÒNG</span>
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-[#073161] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              {/* Check-out Date */}
              <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>TRẢ PHÒNG</span>
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-[#073161] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              {/* Guests Count */}
              <div className="col-span-1 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>SỐ KHÁCH</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                  aria-label="Số khách"
                  className="w-full text-xs sm:text-sm font-bold text-[#073161] bg-transparent focus:outline-none"
                />
              </div>

              {/* Rooms / Area Selector */}
              <div className="col-span-1 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>KHU VỰC</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    aria-label="Chọn khu vực Tà Xùa"
                    className="w-full text-xs sm:text-sm font-bold text-[#073161] bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="all">{roomCount} phòng · Toàn Tà Xùa</option>
                    {areas
                      .filter((a) => a !== 'all')
                      .map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Primary Search Button */}
              <div className="col-span-2 lg:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full min-h-[46px] bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold text-sm py-3 px-6 rounded-full shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  Tìm phòng
                </button>
              </div>
            </div>

            {/* Bottom Interest Filter Chips + Quick Keyword Input */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <span className="text-xs font-bold text-[#073161] mr-1 whitespace-nowrap shrink-0">
                  Bạn quan tâm:
                </span>

                <button
                  type="button"
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    onlyAvailable
                      ? 'bg-[#073161] text-white border-[#073161]'
                      : 'bg-white hover:bg-slate-50 text-[#073161] border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Đã thẩm định</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyCloudView(!onlyCloudView)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    onlyCloudView
                      ? 'bg-[#073161] text-white border-[#073161]'
                      : 'bg-white hover:bg-slate-50 text-[#073161] border-slate-200'
                  }`}
                >
                  <CloudSun className="w-3.5 h-3.5 text-teal-600" />
                  <span>Săn mây</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBedViewFilter(!bedViewFilter);
                    setOnlyCloudView(!bedViewFilter);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    bedViewFilter
                      ? 'bg-[#073161] text-white border-[#073161]'
                      : 'bg-white hover:bg-slate-50 text-[#073161] border-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>View từ giường</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCarAccessFilter(!carAccessFilter);
                    if (!carAccessFilter) {
                      setSelectedArea('Đỉnh Gió');
                    } else {
                      setSelectedArea('all');
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    carAccessFilter
                      ? 'bg-[#073161] text-white border-[#073161]'
                      : 'bg-white hover:bg-slate-50 text-[#073161] border-slate-200'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 text-teal-600" />
                  <span>Ô tô vào được</span>
                </button>
              </div>

              {/* Compact keyword search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên homestay, khu vực..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-2 sm:py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#073161]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
