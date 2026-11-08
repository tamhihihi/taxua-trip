import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Users,
  Cloud,
  ArrowRight,
  Gift,
  Send,
  Award,
  Building2,
  Tag
} from 'lucide-react';
import { Listing, RoomType, Booking, Review, PromoVoucher, ServiceRewardSetting } from '../types/index.ts';
import { formatVND, calculateMemberPoints, canBookingLeaveReview } from '../utils/rules.ts';

interface ListingDetailModalProps {
  listing: Listing | null;
  reviews?: Review[];
  userBookings?: Booking[];
  vouchers?: PromoVoucher[];
  rewardSettings?: ServiceRewardSetting[];
  onClose: () => void;
  onBookSuccess: (booking: Booking) => void;
  onAddReview?: (review: Review, bookingId?: string) => void;
  onCompleteBooking?: (bookingId: string) => void;
  onOpenDirectChat?: (listing: Listing) => void;
  onClaimListing?: (listing: Listing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  reviews = [],
  userBookings = [],
  vouchers = [],
  rewardSettings = [],
  onClose,
  onBookSuccess,
  onAddReview,
  onCompleteBooking,
  onOpenDirectChat,
  onClaimListing
}) => {
  if (!listing) return null;

  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(
    listing.roomTypes && listing.roomTypes.length > 0 ? listing.roomTypes[0] : null
  );
  const [checkIn, setCheckIn] = useState('2026-11-14');
  const [checkOut, setCheckOut] = useState('2026-11-15');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eligible completed bookings that haven't been reviewed yet
  const eligibleBookings = userBookings.filter((b) =>
    canBookingLeaveReview(b.status, b.reviewed)
  );
  // Active bookings (confirmed / checked_in) that can be marked completed
  const activeBookings = userBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'checked_in'
  );

  // Review Form State
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    eligibleBookings[0]?.id || ''
  );
  const [reviewerName, setReviewerName] = useState<string>(
    eligibleBookings[0]?.guestName || ''
  );
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (eligibleBookings.length > 0) {
      const current =
        eligibleBookings.find((b) => b.id === selectedBookingId) || eligibleBookings[0];
      setSelectedBookingId(current.id);
      if (!reviewerName.trim()) {
        setReviewerName(current.guestName);
      }
    } else {
      setSelectedBookingId('');
    }
  }, [userBookings.length, eligibleBookings.length]);

  // Promo Voucher & Admin Point Reward State
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<PromoVoucher | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const calculateBaseTotal = () => {
    if (!selectedRoom) return listing.minPrice;
    return selectedRoom.priceWeekend;
  };

  const baseTotal = calculateBaseTotal();
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percent') {
      discountAmount = Math.round((baseTotal * appliedVoucher.discountValue) / 100);
    } else {
      discountAmount = appliedVoucher.discountValue;
    }
  }
  const totalAmount = Math.max(0, baseTotal - discountAmount);

  // Point rate from admin reward setting or default 8%
  const rewardSetting = rewardSettings.find((r) => r.listingId === listing.id);
  const earnRatePercent = rewardSetting ? rewardSetting.pointEarnRatePercent : 8;
  const earnedPoints = Math.max(10, Math.round((totalAmount * (earnRatePercent / 100)) / 1000));

  const handleApplyVoucher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;
    const found = vouchers.find(
      (v) => v.code.toUpperCase() === code && v.isActive
    );
    if (!found) {
      setVoucherMessage({ type: 'error', text: 'Mã voucher không hợp lệ hoặc đã hết hạn.' });
      setAppliedVoucher(null);
      return;
    }
    if (baseTotal < found.minBookingAmount) {
      setVoucherMessage({
        type: 'error',
        text: `Mã này chỉ áp dụng cho đơn từ ${formatVND(found.minBookingAmount)}.`
      });
      setAppliedVoucher(null);
      return;
    }
    setAppliedVoucher(found);
    const disc = found.discountType === 'percent' ? Math.round((baseTotal * found.discountValue) / 100) : found.discountValue;
    setVoucherMessage({
      type: 'success',
      text: `Đã áp dụng mã ${found.code}: Giảm ${formatVND(disc)}!`
    });
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setBookingError('Vui lòng điền đầy đủ họ tên và số điện thoại liên hệ!');
      return;
    }
    setBookingError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const newBooking: Booking = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        listingId: listing.id,
        listingTitle: listing.title,
        category: listing.category,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestsCount,
        roomName: selectedRoom ? selectedRoom.name : 'Dịch vụ chuẩn',
        totalAmount,
        discountApplied: discountAmount > 0 ? discountAmount : undefined,
        voucherCodeApplied: appliedVoucher ? appliedVoucher.code : undefined,
        pointsEarned: earnedPoints,
        status: 'confirmed',
        reviewed: false,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX-CONFIRMED-${Date.now()}`,
        platformFee: 50000,
        feeCharged: false,
        notes,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setIsSubmitting(false);
      onBookSuccess(newBooking);
    }, 300);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eligibleBookings.length === 0) {
      setReviewError('Chỉ khách hàng đã hoàn tất đơn đặt phòng mới có thể gửi đánh giá.');
      return;
    }
    if (!reviewerName.trim()) {
      setReviewError('Vui lòng nhập tên hiển thị của bạn.');
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewError('Vui lòng nhập nội dung bình luận (tối thiểu 5 ký tự).');
      return;
    }

    const targetBooking =
      eligibleBookings.find((b) => b.id === selectedBookingId) || eligibleBookings[0];

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      listingId: listing.id,
      bookingId: targetBooking?.id,
      reviewerName: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      roomName: targetBooking?.roomName || (selectedRoom ? selectedRoom.name : undefined),
      createdAt: new Date().toISOString().slice(0, 10),
      isVerifiedStay: true
    };

    setReviewError(null);
    if (onAddReview) {
      onAddReview(newReview, targetBooking?.id);
    }
    setReviewComment('');
    setReviewRating(5);
    setReviewSuccessMessage(
      'Cảm ơn bạn! Đánh giá xác thực đã được đăng công khai và cộng +50 Điểm Mây.'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-900">
        {/* Close Button (44x44px touch hitbox on mobile) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-[#073161] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Header */}
        <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-slate-900">
          <img
            src={listing.coverImage}
            alt={listing.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041e42]/95 via-[#041e42]/40 to-transparent" />

          {/* Badges on Gallery */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-2.5 sm:gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                {listing.hasCloudView && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-teal-600 text-white shadow-xs">
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud View đã xác minh
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-white/95 text-[#073161] shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Thẩm định Cấp {listing.verificationTier}
                </span>
              </div>
              <h2
                id="listing-detail-title"
                className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug"
              >
                {listing.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-md text-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-extrabold text-[#073161] text-sm">{listing.rating}</span>
              <span className="text-slate-600 font-medium">
                ({listing.reviewCount} đánh giá thực tế)
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Quick-Jump Bar (< lg) */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('listing-rooms-section')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#073161] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Hạng phòng ({listing.roomTypes?.length || 1})
          </button>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('listing-reviews-section')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#073161] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            ⭐ Đánh giá ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('listing-booking-console')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="ml-auto px-3.5 py-1.5 rounded-full bg-[#073161] text-white text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đặt giữ chỗ ↓
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Details, Rooms, & Verified Guest Reviews */}
          <div className="lg:col-span-7 space-y-6">
            {/* Address & Public Contact Box */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5 text-slate-700 text-xs mb-3 font-medium">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  {listing.address} ({listing.area})
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    4 Kênh Liên Hệ Trực Tiếp Với Cơ Sở:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* 1. Web Direct Chat */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenDirectChat) onOpenDirectChat(listing);
                      }}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-teal-700" />
                      <span>Chat Web</span>
                    </button>

                    {/* 2. Hotline */}
                    <a
                      href={`tel:${listing.phone.replace(/\s+/g, '')}`}
                      className="bg-slate-100 hover:bg-slate-200 text-[#073161] border border-slate-200 px-3 py-2 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-700" />
                      <span>{listing.phone}</span>
                    </a>

                    {/* 3. Zalo */}
                    <a
                      href={`https://zalo.me/${listing.zalo.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Zalo</span>
                    </a>

                    {/* 4. FB */}
                    <a
                      href={listing.facebook || `https://facebook.com/search/top?q=${encodeURIComponent(listing.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="font-extrabold text-indigo-600">f</span>
                      <span>Facebook</span>
                    </a>
                  </div>
                </div>

                {/* Owner Claim Trigger */}
                {onClaimListing && (
                  <button
                    type="button"
                    onClick={() => onClaimListing(listing)}
                    className="w-full text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl py-2 px-3 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>Bạn Là Chủ Cơ Sở Này? Đăng Ký Thành Viên Để Xác Nhận Uy Tín →</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 mb-2">
                Hồ sơ thẩm định thực địa & Trải nghiệm
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Room Types Selector */}
            {listing.roomTypes && listing.roomTypes.length > 0 && (
              <div id="listing-rooms-section">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                    Chọn Hạng Phòng (Lịch trống thực tế)
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Xác minh: {listing.updatedCalendarDate}
                  </span>
                </div>

                <div className="space-y-3">
                  {listing.roomTypes.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-600 shadow-xs ring-1 ring-teal-600'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-[#073161] text-sm">
                                {room.name}
                              </h4>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                                {room.viewType}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                Tối đa {room.capacity} khách
                              </span>
                              <span className="text-emerald-700 font-bold">
                                Còn {room.availableRooms} phòng trống
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {room.amenities.map((am, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700 font-medium"
                                >
                                  {am}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="text-right sm:shrink-0">
                            <div className="text-base font-extrabold text-[#073161]">
                              {formatVND(room.priceWeekend)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Ngày thường: {formatVND(room.priceWeekday)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Benefits Box */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 text-xs">
              <h4 className="font-extrabold text-[#073161] mb-2.5 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-teal-700" />
                <span>Quyền lợi khi đặt phòng qua Tà Xùa Trip:</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    Tích lũy <strong>+{earnedPoints} Điểm Mây</strong> đổi ưu đãi
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Mã QR Check-in xác thực không sợ lừa cọc</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Hỗ trợ đổi cơ sở tương đương khi có sự cố</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Được để lại đánh giá xác thực gắn mã đơn</span>
                </li>
              </ul>
            </div>

            {/* ============================================================== */}
            {/* VERIFIED GUEST REVIEWS SECTION (NEW FEATURE)                   */}
            {/* ============================================================== */}
            <div
              id="listing-reviews-section"
              className="pt-6 border-t border-slate-200 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 block mb-1">
                    BẰNG CHỨNG LƯU TRÚ THỰC TẾ
                  </span>
                  <h3 className="text-lg font-extrabold text-[#073161] flex items-center gap-2">
                    <span>Đánh giá từ khách đã hoàn tất đặt phòng</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {listing.rating} ({listing.reviewCount})
                    </span>
                  </h3>
                </div>
              </div>

              {/* Review Submission Form for Completed Bookings */}
              {eligibleBookings.length > 0 ? (
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-[#f8fafc] border border-teal-200/90 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                        <Award className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#073161]">
                          Viết đánh giá kỳ nghỉ đã hoàn tất của bạn
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          Đơn đặt phòng của bạn tại cơ sở này đã hoàn tất. Hãy chia sẻ trải nghiệm thực tế!
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full shrink-0">
                      +50 Điểm Mây
                    </span>
                  </div>

                  {eligibleBookings.length > 1 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chọn đơn đặt phòng đã hoàn tất
                      </label>
                      <select
                        value={selectedBookingId}
                        onChange={(e) => {
                          setSelectedBookingId(e.target.value);
                          const found = eligibleBookings.find(
                            (b) => b.id === e.target.value
                          );
                          if (found) setReviewerName(found.guestName);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#073161]"
                      >
                        {eligibleBookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            Mã đơn #{b.id} — {b.roomName || b.listingTitle} ({b.checkInDate})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {eligibleBookings.length === 1 && (
                    <div className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 flex items-center justify-between">
                      <span>
                        Mã đơn xác thực: <strong className="text-[#073161]">#{eligibleBookings[0].id}</strong> ({eligibleBookings[0].roomName || 'Tiêu chuẩn'})
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        ✓ Đã hoàn tất
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="review-author-name"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Tên người đánh giá *
                      </label>
                      <input
                        id="review-author-name"
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="Nhập họ tên của bạn"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#073161]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Đánh giá sao (1 - 5 sao) *
                      </label>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (hoveredStar ?? reviewRating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(null)}
                              aria-label={`Chấm ${star} sao`}
                              className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  active
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="ml-2 text-xs font-extrabold text-[#073161]">
                          {reviewRating}/5 sao
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-comment-input"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Bình luận thực tế (view mây, độ ấm phòng, đường đi...) *
                    </label>
                    <textarea
                      id="review-comment-input"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm thực tế của bạn sau chuyến đi..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#073161]"
                      required
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs font-semibold text-rose-600">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Đánh Giá Xác Thực</span>
                  </button>
                </form>
              ) : (
                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#073161] mb-0.5">
                      Chỉ mở đánh giá cho khách đã hoàn tất đơn đặt phòng
                    </p>
                    <p className="text-slate-500">
                      {reviewSuccessMessage ||
                        'Để chống seeding ảo, hệ thống chỉ cho phép viết đánh giá khi đơn đặt phòng chuyển sang trạng thái Hoàn tất (Completed).'}
                    </p>
                  </div>

                  {activeBookings.length > 0 && onCompleteBooking && (
                    <button
                      type="button"
                      onClick={() => onCompleteBooking(activeBookings[0].id)}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Hoàn tất đơn #{activeBookings[0].id} để đánh giá
                    </button>
                  )}
                </div>
              )}

              {reviewSuccessMessage && eligibleBookings.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reviewSuccessMessage}</span>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                  Chưa có bình luận văn bản nào cho cơ sở này. Hãy là người đầu tiên hoàn tất lưu trú và để lại đánh giá!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#073161] text-white font-extrabold text-xs flex items-center justify-center uppercase">
                            {rev.reviewerName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-[#073161]">
                                {rev.reviewerName}
                              </span>
                              {rev.isVerifiedStay && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Đã lưu trú {rev.bookingId ? `(#${rev.bookingId})` : ''}
                                </span>
                              )}
                            </div>
                            {rev.roomName && (
                              <p className="text-[11px] text-slate-500">{rev.roomName}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center gap-0.5"
                            aria-label={`${rev.rating} trên 5 sao`}
                          >
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400">{rev.createdAt}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Form: Booking Console */}
          <div id="listing-booking-console" className="lg:col-span-5">
            <div className="bg-[#f8fafc] border border-slate-200 rounded-3xl p-5 sm:p-6 sticky top-6">
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#073161] mb-1">
                    Đặt Giữ Chỗ Trực Tuyến
                  </h3>
                  <p className="text-xs text-slate-500">
                    Xác nhận tức thì • Không phát sinh phụ phí ẩn
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày nhận phòng
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#073161]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày trả phòng
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#073161]"
                      required
                    />
                  </div>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số lượng khách
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#073161]"
                  >
                    <option value={1}>1 khách (Solo săn mây)</option>
                    <option value={2}>2 khách (Cặp đôi / Bạn thân)</option>
                    <option value={4}>4 khách (Nhóm bạn)</option>
                    <option value={6}>6 khách (Gia đình)</option>
                  </select>
                </div>

                {/* Guest Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên khách đại diện *
                  </label>
                  <input
                    id="booking-guest-name-input"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#073161]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại nhận mã QR & Zalo *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#073161]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú đặc biệt (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Cần view cao tầng, đón muộn 22h, chuẩn bị lẩu gà đen..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#073161]"
                  />
                </div>

                {/* Promo Voucher Code Field */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-teal-700" />
                      <span>Mã Voucher giảm giá (nếu có)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Gợi ý: TAXUA10, SANMAY50K</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã: TAXUA10 / SANMAY50K"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase font-bold text-slate-800 placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-[#073161]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyVoucher()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#073161] border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {voucherMessage && (
                    <p
                      className={`text-[11px] mt-1.5 font-semibold ${
                        voucherMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {voucherMessage.text}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Hạng phòng / Dịch vụ:</span>
                    <span className="text-slate-900 font-bold">
                      {selectedRoom?.name || 'Tiêu chuẩn'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Giá gốc niêm yết:</span>
                    <span className="text-slate-900 font-bold tabular-nums">
                      {formatVND(baseTotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Giảm giá Voucher ({appliedVoucher?.code}):</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Tích điểm thành viên ({earnRatePercent}%):</span>
                    <span className="text-teal-700 font-extrabold tabular-nums">
                      +{earnedPoints} Điểm Mây
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí dịch vụ nền tảng:</span>
                    <span className="text-emerald-700 font-bold">Miễn phí (Beta)</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-slate-200">
                    <span className="text-[#073161]">Tổng thanh toán:</span>
                    <span className="text-teal-700 text-lg tabular-nums">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Đang xử lý giữ phòng...</span>
                  ) : (
                    <>
                      <span>Xác Nhận Giữ Chỗ (+{earnedPoints} Điểm Mây)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-[11px] text-center text-slate-500">
                  🔒 Thông tin được bảo mật và chuyển thẳng đến chủ cơ sở
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Bottom Booking Bar (< lg) */}
        <div className="lg:hidden sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(7,49,97,0.08)]">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 truncate">
              {selectedRoom?.name || 'Hạng phòng tiêu chuẩn'}
            </div>
            <div className="text-base font-extrabold text-[#073161] tabular-nums">
              {formatVND(totalAmount)}{' '}
              <span className="text-xs font-normal text-slate-500">/ đêm</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('listing-booking-console');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              const input = document.getElementById('booking-guest-name-input');
              if (input) setTimeout(() => input.focus(), 350);
            }}
            className="min-h-[44px] bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Đặt phòng ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
