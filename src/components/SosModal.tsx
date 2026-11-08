import React from 'react';
import { 
  X, 
  ShieldAlert, 
  PhoneCall, 
  Wrench, 
  Cross, 
  MapPin, 
  AlertTriangle,
  HeartPulse,
  Compass
} from 'lucide-react';

interface SosModalProps {
  onClose: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({ onClose }) => {
  const emergencyContacts = [
    {
      title: 'Đội Cứu Hộ Đèo Chẹn & Dốc Núi Tà Xùa',
      category: 'Kéo xe sa lầy, thủng lốp, chết máy giữa đèo',
      phone: '0919 115 115',
      badge: 'Trực 24/7',
      isPrimary: true
    },
    {
      title: 'Trạm Y Tế Xã Tà Xùa',
      category: 'Sơ cứu chấn thương, sốt cao, tụt huyết áp vùng cao',
      phone: '0212 3851 456',
      badge: 'Khẩn cấp',
      isPrimary: false
    },
    {
      title: 'Công An & Dân Quân Tự Vệ Xã Tà Xùa',
      category: 'An ninh trật tự, lạc đường rừng, hỗ trợ tìm kiếm',
      phone: '0212 3851 123',
      badge: 'Công quyền',
      isPrimary: false
    },
    {
      title: 'Đội Xe Ôm & Thợ Sửa Xe Bản Địa (Ngã Ba Xã)',
      category: 'Thay săm lốp gấp, tiếp xăng xe máy giữa đèo',
      phone: '0988 991 223',
      badge: 'Hỗ trợ nhanh',
      isPrimary: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in text-white">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Cứu Hộ Khẩn Cấp Tà Xùa 24/7
            </h2>
            <p className="text-xs text-rose-300">
              Đường dây nóng hỗ trợ du khách khi gặp sự cố trên đèo
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                contact.isPrimary
                  ? 'bg-rose-950/40 border-rose-600/70'
                  : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-sm text-white">{contact.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{contact.category}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  contact.isPrimary ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {contact.badge}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                <span className="font-mono font-black text-sm text-rose-300">
                  {contact.phone}
                </span>
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-md transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Gọi khẩn cấp</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Essential Safety Protocol */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1.5">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Quy tắc an toàn khi gặp sự cố đường đèo sương mù:</span>
          </div>
          <p>1. Tấp xe sát lề phải, bật đèn xi nhan khẩn cấp hoặc đốt cành cây/đèn pin báo hiệu.</p>
          <p>2. Đứng phía sau hộ lan taluy dương, tuyệt đối không đứng gần mép vực taluy âm.</p>
          <p>3. Giữ ấm cơ thể và gọi ngay vào hotline cứu hộ ở trên để gửi định vị GPS.</p>
        </div>
      </div>
    </div>
  );
};
