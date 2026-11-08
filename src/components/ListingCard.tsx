import React from 'react';
import {
  Star,
  MapPin,
  Heart,
  Sparkles,
  MessageSquare,
  Camera
} from 'lucide-react';
import { Listing } from '../types/index.ts';
import { formatVND } from '../utils/rules.ts';

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  lowDataMode?: boolean;
  onOpenDirectChat?: (listing: Listing) => void;
  onClaimListing?: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onSelect,
  isSaved = false,
  onToggleSave,
  lowDataMode = false
}) => {
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'homestay':
        return 'Homestay';
      case 'bus':
        return 'Xe khách VIP';
      case 'taxi':
        return 'Taxi Tà Xùa';
      case 'motorbike':
        return 'Thuê xe máy';
      case 'coffee':
        return 'Cà phê săn mây';
      case 'restaurant':
        return 'Nhà hàng';
      case 'tour':
        return 'Tour trekking';
      case 'photo':
        return 'Photographer';
      default:
        return 'Dịch vụ';
    }
  };

  const firstRoom = listing.roomTypes?.[0];
  const photoCount = listing.images?.length || 1;

  // Build a concise 1-line highlight text instead of long verbose paragraphs
  const highlightSnippet = firstRoom
    ? `${firstRoom.name} · ${firstRoom.availableRooms} phòng trống`
    : (listing.tags?.slice(0, 2).join(' · ') || `${listing.area} · Tà Xùa`);

  return (
    <article
      onClick={() => onSelect(listing)}
      className="bg-white border border-slate-200/90 hover:border-[#073161]/50 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
    >
      {/* 1. Large Immersive Cloud View Image Container (h-56 sm:h-64) */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-100">
        <img
          src={listing.coverImage}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            lowDataMode ? 'contrast-95' : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />
        {/* Soft atmospheric gradient scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

        {/* Top Badges & Heart Save Button */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {listing.hasCloudView && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-teal-900/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-300/30 shadow-xs">
                <span>☁️ View Biển Mây</span>
              </span>
            )}

            {listing.verificationTier === 3 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-[#073161]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Cấp 3</span>
              </span>
            ) : listing.verificationTier === 2 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-xs">
                <span>Cấp 2</span>
              </span>
            ) : null}
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(listing.id);
              }}
              className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xs transition-colors cursor-pointer shrink-0"
              aria-label={`Lưu ${listing.title} vào danh sách yêu thích`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isSaved ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </button>
          )}
        </div>

        {/* Bottom Image Overlay: Area & Rating & Photo Count */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10 text-white">
          <div className="flex items-center gap-1 text-xs font-semibold drop-shadow-xs truncate">
            <MapPin className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span className="truncate">{listing.area}</span>
            <span aria-hidden="true" className="opacity-60">·</span>
            <span className="text-white/80 font-normal truncate">{getCategoryLabel(listing.category)}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {photoCount > 1 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-white/90">
                <Camera className="w-3 h-3" />
                <span>{photoCount} ảnh</span>
              </span>
            )}

            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-black tabular-nums shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{listing.rating}</span>
              <span className="text-white/70 text-[10px] font-normal">({listing.reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card Content Body: Streamlined & Focused */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Homestay Title */}
          <h3
            className="text-base sm:text-lg font-black text-[#073161] group-hover:text-teal-700 transition-colors line-clamp-1 mb-1.5"
            title={listing.title}
          >
            {listing.title}
          </h3>

          {/* Short 1-line key highlight (concise text, no paragraphs) */}
          <p className="text-xs text-slate-500 line-clamp-1 mb-4 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
            <span className="truncate">{highlightSnippet}</span>
          </p>
        </div>

        {/* 3. High-Contrast, Prominent Pricing & Direct CTAs */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {/* Prominent Price Display */}
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block leading-tight">
              Giá niêm yết
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-[#073161] tabular-nums tracking-tight">
                {listing.minPrice > 0 ? formatVND(listing.minPrice) : 'Liên hệ'}
              </span>
              {listing.minPrice > 0 && (
                <span className="text-xs text-slate-600 font-bold">/ đêm</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://zalo.me/${listing.zalo.replace(/\s+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer border border-blue-200/80 shadow-2xs"
              title="Nhắn tin Zalo với chủ homestay"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">Zalo</span>
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(listing);
              }}
              className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-xs"
            >
              Xem phòng →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
