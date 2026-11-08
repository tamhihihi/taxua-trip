import React, { useState } from 'react';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Thermometer, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  BellRing, 
  Check, 
  Info,
  Sliders,
  Compass
} from 'lucide-react';
import { CloudHuntingForecast } from '../types/index.ts';
import { calculateCloudProbability } from '../utils/rules.ts';

interface CloudForecastWidgetProps {
  forecasts: CloudHuntingForecast[];
}

export const CloudForecastWidget: React.FC<CloudForecastWidgetProps> = ({ forecasts }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(forecasts[0]?.location || 'Đỉnh Gió');
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');

  // Interactive Live Weather Simulator
  const [simHumidity, setSimHumidity] = useState(88);
  const [simWind, setSimWind] = useState(9);
  const [simTempDiff, setSimTempDiff] = useState(10);
  const [showSim, setShowSim] = useState(false);

  const activeForecast = forecasts.find(f => f.location === selectedLocation) || forecasts[0];

  const simulatedResult = calculateCloudProbability({
    humidity: simHumidity,
    windSpeed: simWind,
    tempDiff: simTempDiff
  });

  const handleSubscribeAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    setAlertSubscribed(true);
    setTimeout(() => {
      // keep subscribed message
    }, 4000);
  };

  return (
    <div className="bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 mb-2">
              <CloudSun className="w-3.5 h-3.5 text-sky-400" />
              <span>Dự báo khí tượng mây Tà Xùa độc quyền</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Bản Đồ Xác Suất Săn Mây Theo Thời Gian Thực
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Được tính toán từ độ ẩm thung lũng, hướng gió và hiện tượng nghịch nhiệt tại Tà Xùa. 
              Giúp bạn chọn đúng điểm đón mây không lo "hụt mây".
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSim(!showSim)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>{showSim ? 'Ẩn bộ mô phỏng' : 'Thử mô phỏng thời tiết'}</span>
            </button>
          </div>
        </div>

        {/* Location Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          {forecasts.map((f) => {
            const isSelected = f.location === selectedLocation;
            return (
              <button
                key={f.location}
                onClick={() => setSelectedLocation(f.location)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-lg shadow-sky-600/20'
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>{f.location}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  f.cloudProbability >= 85 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {f.cloudProbability}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Location Detail Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Forecast Card */}
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-800 via-slate-800/90 to-slate-850 border border-slate-700/80 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/70">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Tọa độ ngắm mây</span>
                <h3 className="text-2xl font-black text-white mt-0.5 flex items-center gap-2">
                  <span>{activeForecast.location}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {activeForecast.condition}
                  </span>
                </h3>
              </div>

              {/* Big Probability Gauge */}
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 px-4 py-2.5 rounded-2xl">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-medium">Khả năng có biển mây</div>
                  <div className="text-2xl font-black text-emerald-400 leading-none">
                    {activeForecast.cloudProbability}%
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold">
                  ☁️
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6">
              <div className="bg-slate-900/60 border border-slate-750 p-3.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Độ ẩm</span>
                </div>
                <div className="text-lg font-bold text-white">{activeForecast.humidity}%</div>
                <div className="text-[10px] text-emerald-400 font-medium">Lý tưởng ngưng tụ mây</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-750 p-3.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Wind className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tốc độ gió</span>
                </div>
                <div className="text-lg font-bold text-white">{activeForecast.windSpeedKmH} km/h</div>
                <div className="text-[10px] text-teal-400 font-medium">Gió nhẹ giữ mây yên</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-750 p-3.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nhiệt độ</span>
                </div>
                <div className="text-lg font-bold text-white">{activeForecast.tempMin}°C - {activeForecast.tempMax}°C</div>
                <div className="text-[10px] text-amber-300 font-medium">Se lạnh chuẩn vùng cao</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-750 p-3.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Giờ vàng săn mây</span>
                </div>
                <div className="text-sm font-bold text-rose-300 mt-1">{activeForecast.goldenHours}</div>
                <div className="text-[10px] text-slate-400 font-medium">Sáng sớm đẹp nhất</div>
              </div>
            </div>

            {/* Expert Advice Note */}
            <div className="bg-teal-950/40 border border-teal-800/60 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
                  Kinh nghiệm thực địa từ người bản xứ:
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeForecast.advice}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Alert Signup & Quick Packing tips */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Free SMS / Email Cloud Alert */}
            <div className="bg-gradient-to-br from-indigo-900/60 via-slate-800 to-slate-850 border border-indigo-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-sm">Bật Cảnh Báo "Săn Mây Đỉnh Chóp"</h4>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Nhận tin báo miễn phí khi đợt biển mây dày đặc (&gt;85%) sắp xuất hiện tại Tà Xùa vào dịp cuối tuần.
              </p>

              {alertSubscribed ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Đã đăng ký nhận cảnh báo mây thành công!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribeAlert} className="space-y-2.5">
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="Nhập email hoặc SĐT Zalo của bạn..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                  >
                    Đăng Ký Cảnh Báo Miễn Phí
                  </button>
                </form>
              )}
            </div>

            {/* Practical Mountain checklist */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 text-xs">
              <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Hành trang cần thiết săn mây:</span>
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Áo khoác gió ấm (sáng sớm trên đèo 12°C - 15°C)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Giày thể thao đế gai chống trơn khi xuống Sống Lưng</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Pin dự phòng (nhiệt độ lạnh làm điện thoại nhanh sụt pin)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Kính râm hoặc kính chống sương mù khi lái xe máy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Weather Simulator (Collapsible) */}
        {showSim && (
          <div className="mt-8 bg-slate-800/90 border border-teal-500/40 rounded-2xl p-6 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-teal-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  Bộ Thử Nghiệm Dự Báo Biển Mây (Dựa theo thuật toán khí tượng Tà Xùa)
                </h4>
                <p className="text-xs text-slate-400">
                  Kéo thử các thông số để xem cơ chế hình thành biển mây:
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Xác suất mô phỏng:</span>
                <div className="text-2xl font-black text-teal-400">{simulatedResult.score}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Độ ẩm:</span>
                  <span className="text-sky-300">{simHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={simHumidity}
                  onChange={(e) => setSimHumidity(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Tốc độ gió:</span>
                  <span className="text-indigo-300">{simWind} km/h</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={simWind}
                  onChange={(e) => setSimWind(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Chênh lệch nhiệt độ Ngày - Đêm:</span>
                  <span className="text-amber-300">{simTempDiff}°C</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="18"
                  value={simTempDiff}
                  onChange={(e) => setSimTempDiff(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                <strong>Kết luận:</strong> {simulatedResult.verdict}
              </span>
              <span className="text-slate-400 italic">Công thức chuẩn mục 1 & 6 trong kế hoạch</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
