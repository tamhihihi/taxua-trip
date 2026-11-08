import React, { useState } from 'react';
import { 
  X, 
  Bus, 
  MapPin, 
  Clock, 
  Armchair, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { BusTrip, RouteStop, Booking } from '../types/index.ts';
import { formatVND, estimatePickupTime, calculateMemberPoints } from '../utils/rules.ts';

interface BusBookingModalProps {
  trips: BusTrip[];
  onClose: () => void;
  onBookSuccess: (booking: Booking) => void;
}

export const BusBookingModal: React.FC<BusBookingModalProps> = ({
  trips,
  onClose,
  onBookSuccess
}) => {
  const [selectedTrip, setSelectedTrip] = useState<BusTrip>(trips[0]);
  const [pickupStopId, setPickupStopId] = useState<string>(
    trips[0].stops.find(s => s.type === 'pickup' || s.type === 'both')?.id || trips[0].stops[0].id
  );
  const [dropoffStopId, setDropoffStopId] = useState<string>(
    trips[0].stops.filter(s => s.type === 'dropoff' || s.type === 'both').slice(-1)[0]?.id || trips[0].stops[trips[0].stops.length - 1].id
  );
  const [selectedSeats, setSelectedSeats] = useState<number[]>([5]);
  const [travelDate, setTravelDate] = useState('2026-11-13');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active stops
  const currentPickup = selectedTrip.stops.find(s => s.id === pickupStopId) || selectedTrip.stops[0];
  const currentDropoff = selectedTrip.stops.find(s => s.id === dropoffStopId) || selectedTrip.stops[selectedTrip.stops.length - 1];

  // Estimated pickup time
  const estimatedPickup = estimatePickupTime(selectedTrip.departureTime, currentPickup.minuteOffset);
  const estimatedArrival = estimatePickupTime(selectedTrip.departureTime, currentDropoff.minuteOffset);

  // Dynamic Fare calculation
  const singleSeatFare = Math.max(250000, selectedTrip.baseFare + currentPickup.fareModifier + currentDropoff.fareModifier);
  const totalBusAmount = singleSeatFare * selectedSeats.length;
  const pointsEarned = calculateMemberPoints(totalBusAmount);

  const toggleSeat = (seatNum: number) => {
    if (selectedTrip.bookedSeats.includes(seatNum)) return; // already booked
    if (selectedSeats.includes(seatNum)) {
      if (selectedSeats.length > 1) {
        setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      }
    } else {
      setSelectedSeats([...selectedSeats, seatNum]);
    }
  };

  const handleTripChange = (trip: BusTrip) => {
    setSelectedTrip(trip);
    const pStop = trip.stops.find(s => s.type === 'pickup' || s.type === 'both');
    const dStop = trip.stops.filter(s => s.type === 'dropoff' || s.type === 'both').slice(-1)[0];
    if (pStop) setPickupStopId(pStop.id);
    if (dStop) setDropoffStopId(dStop.id);
    // Find first free seat
    const firstFree = Array.from({ length: trip.totalSeats }, (_, i) => i + 1).find(
      s => !trip.bookedSeats.includes(s)
    ) || 1;
    setSelectedSeats([firstFree]);
  };

  const handleConfirmBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerPhone.trim()) {
      alert('Vui lòng điền họ tên và số điện thoại liên hệ nhận vé!');
      return;
    }
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế ngồi!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newBooking: Booking = {
        id: `VE-TX-${Date.now().toString().slice(-4)}`,
        listingId: selectedTrip.id,
        listingTitle: `${selectedTrip.operatorName} (${selectedTrip.busType})`,
        category: 'bus',
        guestName: passengerName,
        guestPhone: passengerPhone,
        checkInDate: travelDate,
        checkOutDate: travelDate,
        guestsCount: selectedSeats.length,
        seatNumbers: selectedSeats,
        pickupStop: `${currentPickup.name} (~${estimatedPickup})`,
        dropoffStop: `${currentDropoff.name} (~${estimatedArrival})`,
        totalAmount: totalBusAmount,
        status: 'confirmed',
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BUS-TX-${Date.now()}`,
        platformFee: 50000,
        feeCharged: false,
        notes: `Điểm đón: ${currentPickup.name}. ${currentPickup.pickupNote || ''}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setIsSubmitting(false);
      onBookSuccess(newBooking);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Đặt Tuyến Xe Hà Nội - Tà Xùa Đón Tận Nơi
              </h2>
              <p className="text-xs text-slate-400">
                Linh hoạt chọn điểm đón & trả dọc tuyến • Tính giờ đón ước tính tự động
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Trip Selector, Route Stops & Seat Map */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Operator */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                1. Chọn Chuyến Xe & Khung Giờ
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {trips.map((trip) => {
                  const isSelected = trip.id === selectedTrip.id;
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => handleTripChange(trip)}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-500 shadow-md ring-1 ring-sky-500'
                          : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span className="text-sky-300">{trip.departureTime}</span>
                        <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                          {trip.busType.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {trip.operatorName}
                      </div>
                      <div className="text-[11px] text-teal-400 font-bold mt-1">
                        {formatVND(trip.baseFare)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Route Stops & Estimated Pickup Calculation */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  2. Điểm Đón & Điểm Trả Dọc Tuyến
                </span>
                <span className="text-xs text-sky-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Đón lúc: <strong>{estimatedPickup}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pickup stop */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Điểm đón (Lên xe)
                  </label>
                  <select
                    value={pickupStopId}
                    onChange={(e) => setPickupStopId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {selectedTrip.stops
                      .filter(s => s.type === 'pickup' || s.type === 'both')
                      .map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name} (+{stop.minuteOffset} phút)
                        </option>
                      ))}
                  </select>
                  {currentPickup.pickupNote && (
                    <p className="text-[10px] text-amber-300 mt-1">
                      * {currentPickup.pickupNote}
                    </p>
                  )}
                </div>

                {/* Dropoff stop */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Điểm trả (Xuống xe)
                  </label>
                  <select
                    value={dropoffStopId}
                    onChange={(e) => setDropoffStopId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {selectedTrip.stops
                      .filter(s => s.type === 'dropoff' || s.type === 'both')
                      .map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name} (~{estimatePickupTime(selectedTrip.departureTime, stop.minuteOffset)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Transit detail highlight */}
              <div className="text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-750 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{currentPickup.name} ➔ {currentDropoff.name}</span>
                </div>
                <div className="text-teal-400 font-bold">
                  {formatVND(singleSeatFare)}/ghế
                </div>
              </div>
            </div>

            {/* Step 3: Interactive Seat Map */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  3. Sơ Đồ Chọn Ghế Ngồi Trực Quan
                </label>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-slate-700 inline-block" /> Trống
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-teal-500 inline-block" /> Đang chọn
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-rose-600/50 inline-block" /> Đã đặt
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <div className="text-center text-xs text-slate-400 pb-2 mb-3 border-b border-slate-700">
                  🚗 Đầu xe / Tài xế
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-sm mx-auto">
                  {Array.from({ length: selectedTrip.totalSeats }, (_, idx) => {
                    const seatNum = idx + 1;
                    const isBooked = selectedTrip.bookedSeats.includes(seatNum);
                    const isChosen = selectedSeats.includes(seatNum);

                    return (
                      <button
                        key={seatNum}
                        type="button"
                        disabled={isBooked}
                        onClick={() => toggleSeat(seatNum)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                          isBooked
                            ? 'bg-rose-950/40 border border-rose-800/40 text-rose-500 cursor-not-allowed opacity-60'
                            : isChosen
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                            : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        <Armchair className="w-4 h-4 mb-0.5" />
                        <span>Ghế {seatNum}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-teal-300 font-semibold mt-3">
                  Đã chọn: Ghế {selectedSeats.join(', ')} ({selectedSeats.length} chỗ)
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Passenger Info & Checkout */}
          <div className="lg:col-span-5 bg-slate-850 border border-slate-750 rounded-3xl p-6 flex flex-col justify-between">
            <form onSubmit={handleConfirmBus} className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  Thông Tin Vé Đi Xe
                </h3>
                <p className="text-xs text-slate-400">
                  Nhà xe gọi điện xác nhận điểm đón trước giờ khởi hành 30 phút
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ngày khởi hành
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Name & Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ tên hành khách đại diện *
                </label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Minh Long"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Số điện thoại đón xe & Zalo *
                </label>
                <input
                  type="tel"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="Ví dụ: 0987 654 321"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Summary breakdown */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-750 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Nhà xe:</span>
                  <span className="text-white font-medium">{selectedTrip.operatorName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dự kiến đón:</span>
                  <span className="text-sky-300 font-bold">{estimatedPickup} ({travelDate})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Số lượng:</span>
                  <span className="text-white font-medium">{selectedSeats.length} vé ({selectedSeats.map(s => `Ghế ${s}`).join(', ')})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tích điểm thành viên:</span>
                  <span className="text-amber-300 font-semibold">+{pointsEarned} Điểm Mây</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-800">
                  <span className="text-white">Tổng tiền vé:</span>
                  <span className="text-teal-400 text-lg">{formatVND(totalBusAmount)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-xl shadow-sky-500/20 active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Đang giữ chỗ vé xe...</span>
                ) : (
                  <>
                    <span>Xác Nhận Giữ Vé & Lấy Mã QR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-center text-slate-400">
                📞 Hotline nhà xe: <a href={`tel:${selectedTrip.phone.replace(/\s+/g, '')}`} className="text-sky-400 font-bold">{selectedTrip.phone}</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
