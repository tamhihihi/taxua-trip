import React, { useState } from 'react';
import {
  X,
  CalendarCheck,
  QrCode,
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  Copy,
  Check,
  Sparkles,
  Star,
  MapPin,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Booking, Listing } from '../types/index.ts';
import {
  formatVND,
  buildVietQrPaymentPayload,
  canBookingLeaveReview
} from '../utils/rules.ts';

interface MyTripsModalProps {
  isOpen: boolean;
  bookings: Booking[];
  listings: Listing[];
  onClose: () => void;
  onSelectListingForReview: (listing: Listing) => void;
  onSimulateCompleteBooking: (bookingId: string) => void;
  onConfirmDepositPaid: (bookingId: string) => void;
  onOpenDispute?: (booking: Booking) => void;
  onOpenReviewModal?: (booking: Booking) => void;
}

export const MyTripsModal: React.FC<MyTripsModalProps> = ({
  isOpen,
  bookings,
  listings,
  onClose,
  onSelectListingForReview,
  onSimulateCompleteBooking,
  onConfirmDepositPaid,
  onOpenDispute,
  onOpenReviewModal
}) => {
  const [lookupQuery, setLookupQuery] = useState('');
  const [activeVietQrBookingId, setActiveVietQrBookingId] = useState<string | null>(null);
  const [activeVoucherBookingId, setActiveVoucherBookingId] = useState<string | null>(null);
  const [copiedMemoId, setCopiedMemoId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredBookings = bookings.filter((b) => {
    if (!lookupQuery.trim()) return true;
    const q = lookupQuery.trim().toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.listingTitle.toLowerCase().includes(q) ||
      b.guestPhone.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
            <Clock className="w-3 h-3" />
            <span>Giữ chỗ 30 phút · Chờ cọc</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã xác nhận giữ phòng</span>
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900">
            <ShieldCheck className="w-3 h-3" />
            <span>Đã Check-in tại cơ sở</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã hoàn tất chuyến đi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            Đã hủy
          </span>
        );
    }
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMemoId(id);
      setTimeout(() => setCopiedMemoId(null), 2500);
    } catch {
      setCopiedMemoId(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Quản lý Đơn đặt & Chuyến đi của tôi"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl sm:my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#04244d] via-[#073161] to-[#0a6b6e] text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold truncate">
                Chuyến Đi & Đơn Đặt Của Tôi ({bookings.length})
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-1">
                Tra cứu mã giữ chỗ, quét mã VietQR đặt cọc tự động, mở Phiếu nhận phòng E-Voucher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ Chuyến đi của tôi"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Nhập mã đặt chỗ (VD: bk-101), tên homestay hoặc SĐT..."
              aria-label="Tìm kiếm mã đặt chỗ hoặc số điện thoại"
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#073161]"
            />
          </div>
          <div className="text-[11px] font-bold text-slate-500">
            Hiển thị {filteredBookings.length}/{bookings.length} đơn đặt
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {filteredBookings.map((booking) => {
            const matchedListing = listings.find((l) => l.id === booking.listingId);
            const vietQr = buildVietQrPaymentPayload(booking.id, booking.totalAmount, 50);
            const isVietQrOpen = activeVietQrBookingId === booking.id;
            const isVoucherOpen = activeVoucherBookingId === booking.id;
            const eligibleForReview = canBookingLeaveReview(booking.status, booking.reviewed);

            return (
              <div
                key={booking.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-[#073161] text-white font-mono text-xs font-extrabold uppercase">
                      #{booking.id}
                    </span>
                    {getStatusBadge(booking.status)}
                    <span className="text-xs text-slate-500 font-medium">
                      Đặt ngày: {booking.createdAt}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Tổng chi phí ghi nhận</span>
                    <span className="text-base font-extrabold text-[#073161] tabular-nums">
                      {formatVND(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-7 space-y-1">
                    <h3 className="text-base font-extrabold text-[#073161]">
                      {booking.listingTitle}
                    </h3>
                    {booking.roomName && (
                      <div className="text-xs font-bold text-teal-700">
                        Hạng phòng / Dịch vụ: {booking.roomName}
                      </div>
                    )}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span>
                        📅 Nhận phòng: <strong>{booking.checkInDate}</strong>
                      </span>
                      <span>
                        📅 Trả phòng: <strong>{booking.checkOutDate}</strong>
                      </span>
                      <span>
                        👥 Số lượng: <strong>{booking.guestsCount} khách/ghế</strong>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveVoucherBookingId(null);
                        setActiveVietQrBookingId(isVietQrOpen ? null : booking.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        isVietQrOpen
                          ? 'bg-[#073161] text-white border-[#073161]'
                          : 'bg-slate-50 hover:bg-slate-100 text-[#073161] border-slate-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Mã VietQR Cọc (50%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveVietQrBookingId(null);
                        setActiveVoucherBookingId(isVoucherOpen ? null : booking.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        isVoucherOpen
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Phiếu Check-in QR</span>
                    </button>

                    {/* Dispute / Trọng tài khiếu nại Button */}
                    {onOpenDispute && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDispute(booking);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                          booking.hasDispute
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                        <span>{booking.hasDispute ? 'Đang khiếu nại (Admin hỗ trợ)' : 'Khiếu nại dịch vụ'}</span>
                      </button>
                    )}

                    {eligibleForReview && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenReviewModal) {
                            onOpenReviewModal(booking);
                          } else if (matchedListing) {
                            onSelectListingForReview(matchedListing);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Viết Đánh Giá (+20 Điểm Mây)</span>
                      </button>
                    )}

                    {booking.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => onSimulateCompleteBooking(booking.id)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                      >
                        ✓ Đánh dấu Hoàn tất lưu trú
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Panel 1: Dynamic VietQR Payment */}
                {isVietQrOpen && (
                  <div className="bg-[#f8fafc] border border-teal-200 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-4 flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200">
                      <img
                        src={vietQr.qrImageUrl}
                        alt={`Mã VietQR chuyển khoản ${vietQr.transferMemo}`}
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                      <span className="text-[10px] font-bold text-slate-500 mt-1.5">
                        Quét bằng App Ngân hàng bất kỳ (Napas 247)
                      </span>
                    </div>

                    <div className="sm:col-span-8 space-y-2.5 text-xs">
                      <div className="inline-flex items-center gap-1.5 text-teal-800 font-extrabold bg-teal-100/80 px-3 py-1 rounded-full text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thanh toán Cọc Bảo Đảm 50% qua VietQR tự động</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Ngân hàng thụ hưởng:</span>
                          <span className="font-extrabold text-[#073161]">{vietQr.bankCode} Bank</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Số tài khoản:</span>
                          <span className="font-mono font-extrabold text-[#073161]">
                            {vietQr.accountNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Số tiền đặt cọc (50%):</span>
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {formatVND(vietQr.depositAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Thanh toán khi nhận phòng:</span>
                          <span className="font-bold text-slate-700">
                            {formatVND(vietQr.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Nội dung chuyển khoản tự động:
                          </span>
                          <span className="font-mono font-extrabold text-[#073161]">
                            {vietQr.transferMemo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(vietQr.transferMemo, booking.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#073161] font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedMemoId === booking.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy nội dung</span>
                            </>
                          )}
                        </button>
                      </div>

                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => onConfirmDepositPaid(booking.id)}
                          className="w-full bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          Xác nhận đã chuyển khoản cọc → Chuyển sang Đã giữ phòng
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Expandable Panel 2: Digital Check-in E-Voucher */}
                {isVoucherOpen && (
                  <div className="bg-gradient-to-br from-[#04244d] to-[#073161] text-white rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-8 space-y-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-teal-300">
                        PHIẾU NHẬN PHÒNG ĐIỆN TỬ · TÀ XÙA TRIP E-VOUCHER
                      </div>
                      <div className="text-base font-extrabold">{booking.listingTitle}</div>
                      <div className="text-xs text-slate-200">
                        Khách lưu trú: <strong>{booking.guestName}</strong> ({booking.guestPhone})
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="bg-white/10 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-300 block">NHẬN PHÒNG (từ 14:00)</span>
                          <span className="font-extrabold">{booking.checkInDate}</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-300 block">TRẢ PHÒNG (trước 12:00)</span>
                          <span className="font-extrabold">{booking.checkOutDate}</span>
                        </div>
                      </div>
                      {matchedListing && (
                        <div className="text-[11px] text-teal-200 pt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Khu vực: {matchedListing.area} · SĐT Chủ nhà: {matchedListing.phone} (Lưu sẵn khi mất sóng)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-4 bg-white text-slate-900 rounded-2xl p-4 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                        <QrCode className="w-16 h-16 text-[#073161]" />
                      </div>
                      <div className="font-mono text-xs font-extrabold text-[#073161]">
                        {booking.id.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Đưa mã này cho chủ cơ sở khi nhận phòng
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
