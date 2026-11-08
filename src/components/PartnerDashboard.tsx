import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  Eye, 
  PhoneCall, 
  CheckCircle2, 
  QrCode, 
  AlertCircle, 
  Plus, 
  Save, 
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { Listing, Booking, PartnerWallet } from '../types/index.ts';
import { formatVND, parseZaloAvailabilityCommand } from '../utils/rules.ts';

interface PartnerDashboardProps {
  partnerListing: Listing;
  bookings: Booking[];
  wallet: PartnerWallet;
  onUpdateAvailability: (roomId: string, newAvailable: number) => void;
  onConfirmBooking: (bookingId: string) => void;
  onCheckInBooking: (bookingId: string) => void;
  onCompleteBooking: (bookingId: string) => void;
  billingEnabled: boolean;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  partnerListing,
  bookings,
  wallet,
  onUpdateAvailability,
  onConfirmBooking,
  onCheckInBooking,
  onCompleteBooking,
  billingEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'wallet' | 'analytics'>('calendar');
  const [qrScanInput, setQrScanInput] = useState('');
  const [qrScanFeedback, setQrScanFeedback] = useState<string | null>(null);
  const [zaloCommandInput, setZaloCommandInput] = useState('Cuối tuần còn 3 phòng đôi');
  const [zaloCommandFeedback, setZaloCommandFeedback] = useState<string | null>(null);
  const [icalSyncedAt, setIcalSyncedAt] = useState<string>('Vừa đồng bộ 5 phút trước');
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState<boolean>(false);

  // Filter bookings for this partner
  const partnerBookings = bookings.filter(b => b.listingId === partnerListing.id || b.listingTitle.includes(partnerListing.title));

  const handleScanQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrScanInput.trim()) return;

    const matchedBooking = bookings.find(b => 
      b.id.toLowerCase() === qrScanInput.trim().toLowerCase() ||
      b.id.includes(qrScanInput.trim())
    );

    if (matchedBooking) {
      if (matchedBooking.status === 'confirmed') {
        onCheckInBooking(matchedBooking.id);
        setQrScanFeedback(`✅ Quét thành công! Khách ${matchedBooking.guestName} đã được Check-in.`);
      } else if (matchedBooking.status === 'checked_in') {
        onCompleteBooking(matchedBooking.id);
        setQrScanFeedback(`🎉 Khách đã trả phòng & Hoàn tất! Phí 50.000đ được ghi nhận vào ví.`);
      } else {
        setQrScanFeedback(`Thông báo: Booking này đang ở trạng thái "${matchedBooking.status}".`);
      }
    } else {
      setQrScanFeedback('❌ Không tìm thấy mã booking. Vui lòng kiểm tra lại!');
    }

    setQrScanInput('');
    setTimeout(() => setQrScanFeedback(null), 5000);
  };

  return (
    <div className="bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-white min-h-[700px]">
      <div className="max-w-6xl mx-auto">
        {/* Host Header */}
        <div className="bg-gradient-to-r from-slate-850 to-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={partnerListing.coverImage}
              alt={partnerListing.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Cổng Chủ Cơ Sở & Đối Tác
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  Huy hiệu Cấp {partnerListing.verificationTier}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {partnerListing.title}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Khu vực: {partnerListing.area} • Hotline: {partnerListing.phone} • Lịch cập nhật: {partnerListing.updatedCalendarDate}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-750 p-3.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Số dư ví nạp trước:</span>
              <span className="text-lg font-black text-teal-400">
                {formatVND(wallet.balance)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Lịch Trống & Số Phòng Còn (Ưu tiên)</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>2. Quét QR & Đơn Đặt ({partnerBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'wallet'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>3. Ví Đối Tác & Phí 50.000đ</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>4. Hiệu Quả & Lượt Bấm Gọi</span>
          </button>
        </div>

        {/* TAB 1: Fast Room Availability Management (Core Priority from PDF) */}
        {activeTab === 'calendar' && (
          <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  <span>Quản Lý Lịch Trống Siêu Nhanh Trên Điện Thoại</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chỉ cần 1 chạm để tăng/giảm số phòng còn trống. Giúp khách tìm thấy bạn ngay và AI tự nhận booking!
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Huy hiệu: "Lịch cập nhật hôm nay"</span>
              </div>
            </div>

            {/* Room Availability Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partnerListing.roomTypes?.map((room) => (
                <div
                  key={room.id}
                  className="bg-slate-900 border border-slate-750 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-bold text-white text-base">{room.name}</h4>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Tổng cơ sở: {room.totalRooms} phòng • {room.viewType}
                      </div>
                      <div className="text-xs text-teal-400 font-semibold mt-1">
                        Giá cuối tuần: {formatVND(room.priceWeekend)}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      room.availableRooms > 0 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {room.availableRooms > 0 ? `Còn ${room.availableRooms} phòng` : 'ĐÃ HẾT PHÒNG'}
                    </span>
                  </div>

                  {/* Quick +/- Buttons */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">
                      Điều chỉnh số phòng còn trống:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateAvailability(room.id, Math.max(0, room.availableRooms - 1))}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base flex items-center justify-center transition-colors border border-slate-700"
                        title="Giảm 1 phòng"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-black text-teal-300">
                        {room.availableRooms}
                      </span>
                      <button
                        onClick={() => onUpdateAvailability(room.id, Math.min(room.totalRooms, room.availableRooms + 1))}
                        className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base flex items-center justify-center transition-colors shadow-sm"
                        title="Tăng 1 phòng"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Zalo OA Bot Availability Updater & iCal Sync (PDF 1 Section 3 & PDF 3 Section 5) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-sky-950/40 border border-sky-800/60 rounded-2xl p-4 text-xs text-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sky-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    <span>Cập Nhật Lịch Qua Tin Nhắn Zalo OA</span>
                  </span>
                  <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded-full text-sky-300 font-bold">
                    Không cần mở web
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Chủ cơ sở lớn tuổi chỉ cần nhắn câu tự nhiên cho Zalo OA Tà Xùa Trip, bot sẽ tự động cập nhật số phòng trống phía trên:
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseZaloAvailabilityCommand(zaloCommandInput);
                    if (parsed.matched && parsed.availableCount !== null && partnerListing.roomTypes?.[0]) {
                      onUpdateAvailability(partnerListing.roomTypes[0].id, parsed.availableCount);
                      setZaloCommandFeedback(
                        `✅ Bot Zalo OA đã ghi lịch: Cập nhật "${partnerListing.roomTypes[0].name}" thành CÒN ${parsed.availableCount} PHÒNG.`
                      );
                    } else {
                      setZaloCommandFeedback(
                        '💡 Gợi ý cú pháp: Nhắn "Cuối tuần còn 2 phòng đôi" hoặc "Hôm nay hết phòng".'
                      );
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={zaloCommandInput}
                    onChange={(e) => setZaloCommandInput(e.target.value)}
                    placeholder="Ví dụ: Cuối tuần còn 2 phòng đôi"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    Gửi Zalo OA
                  </button>
                </form>
                {zaloCommandFeedback && (
                  <div className="text-[11px] font-bold text-emerald-300 bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/30">
                    {zaloCommandFeedback}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-750 rounded-2xl p-4 text-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-teal-300">
                      Đồng Bộ iCal 2 Chiều & AI Tự Xác Nhận (Giữ Chỗ 30 Phút)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">{icalSyncedAt}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Chống đặt trùng phòng với Booking.com / Airbnb / Agoda. Khi lịch đạt độ tin cậy cao, bạn có thể bật chế độ để AI tự xác nhận giữ chỗ 30 phút.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIcalSyncedAt('Vừa đồng bộ tức thì (' + new Date().toTimeString().slice(0, 5) + ')')}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    🔄 Đồng bộ iCal ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoConfirmEnabled(!autoConfirmEnabled)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer ${
                      autoConfirmEnabled
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {autoConfirmEnabled
                      ? '🤖 AI Tự Xác Nhận: ĐANG BẬT'
                      : '✋ Xác Nhận 1 Chạm (Mặc định an toàn)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Bookings & QR Check-in */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Quick QR check-in input */}
            <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-400" />
                <span>Xác Nhận Check-In Bằng Mã QR Hoặc Mã Booking</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Nhập mã Booking khách xuất trình khi đến nhận phòng để xác nhận Check-in và hoàn tất dịch vụ.
              </p>

              <form onSubmit={handleScanQr} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={qrScanInput}
                  onChange={(e) => setQrScanInput(e.target.value)}
                  placeholder="Ví dụ: TX-2026-8891"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Xác nhận mã
                </button>
              </form>

              {qrScanFeedback && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-750 text-xs font-semibold text-teal-300">
                  {qrScanFeedback}
                </div>
              )}
            </div>

            {/* Bookings list */}
            <div className="space-y-3">
              {partnerBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-850 border border-slate-750 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-sky-400">{b.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.status === 'checked_in'
                          ? 'bg-sky-500/20 text-sky-300'
                          : b.status === 'confirmed'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{b.guestName} ({b.guestPhone})</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hạng: {b.roomName || 'Tiêu chuẩn'} • Ngày: {b.checkInDate} - {b.checkOutDate} • Số khách: {b.guestsCount}
                    </p>
                    {b.notes && (
                      <p className="text-[11px] text-amber-300 mt-1 italic">* {b.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right sm:mr-2">
                      <div className="text-sm font-black text-teal-400">{formatVND(b.totalAmount)}</div>
                      <div className="text-[10px] text-slate-500">Phí sàn: {b.status === 'completed' ? (billingEnabled ? '50.000đ' : '0đ (Miễn phí)') : 'Chưa tính'}</div>
                    </div>

                    {b.status === 'pending' && (
                      <button
                        onClick={() => onConfirmBooking(b.id)}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Xác nhận phòng
                      </button>
                    )}

                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => onCheckInBooking(b.id)}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Check-in khách
                      </button>
                    )}

                    {b.status === 'checked_in' && (
                      <button
                        onClick={() => onCompleteBooking(b.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Hoàn tất & Trả phòng
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Partner Wallet & 50.000đ fee transparency */}
        {activeTab === 'wallet' && (
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-750">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-teal-400" />
                  <span>Ví Trả Trước Đối Tác & Đối Soát Phí Sàn</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chính sách chuẩn Mục 2 trong kế hoạch: Chỉ trừ 50.000đ khi booking hoàn tất thực tế.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Trạng thái tính phí hệ thống:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  billingEnabled 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {billingEnabled ? 'Đang bật thu phí (50k/booking)' : 'Miễn phí hoàn toàn (Giai đoạn Beta)'}
                </span>
              </div>
            </div>

            {/* Wallet cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Số dư khả dụng ví:</span>
                <div className="text-xl font-black text-teal-400 mt-1">{formatVND(wallet.balance)}</div>
                <button className="mt-3 text-xs bg-teal-600/30 hover:bg-teal-600/40 text-teal-300 font-bold px-3 py-1.5 rounded-xl border border-teal-500/30">
                  Nạp thêm qua QR payOS
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Số booking hoàn tất:</span>
                <div className="text-xl font-black text-white mt-1">{wallet.completedBookingsCount} đơn</div>
                <span className="text-[11px] text-emerald-400">Khách đã đến & check-in thực tế</span>
              </div>

              <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl">
                <span className="text-xs text-slate-400">Tổng phí nền tảng ghi nhận:</span>
                <div className="text-xl font-black text-amber-400 mt-1">
                  {formatVND(wallet.completedBookingsCount * 50000)}
                </div>
                <span className="text-[11px] text-slate-400">Chưa trừ tiền thực tế nếu cờ tắt</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-850 border border-slate-700 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>Tổng lượt xem trang</span>
                <Eye className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">{partnerListing.stats.views.toLocaleString()}</div>
              <span className="text-xs text-emerald-400 mt-1 block">Tăng 34% so với tuần trước</span>
            </div>

            <div className="bg-slate-850 border border-slate-700 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>Lượt bấm gọi Hotline & Zalo</span>
                <PhoneCall className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-400">{partnerListing.stats.callClicks} lượt</div>
              <span className="text-xs text-slate-400 mt-1 block">Liên hệ công khai minh bạch</span>
            </div>

            <div className="bg-slate-850 border border-slate-700 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>Đơn đặt qua web</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-300">{partnerListing.stats.bookingsCount} đơn</div>
              <span className="text-xs text-slate-400 mt-1 block">Tỷ lệ hoàn tất 95%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
