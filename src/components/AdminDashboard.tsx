import React, { useState } from 'react';
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
  Building2,
  Lock,
  Bot,
  Database,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Gift,
  Tag,
  Award,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import {
  Listing,
  VerificationTier,
  BookingDispute,
  PromoVoucher,
  ServiceRewardSetting,
  PartnerClaimRequest
} from '../types/index.ts';
import { formatVND } from '../utils/rules.ts';

interface AdminDashboardProps {
  listings: Listing[];
  billingEnabled: boolean;
  onToggleBilling: () => void;
  onUpdateTier: (listingId: string, newTier: VerificationTier) => void;
  onApproveListing: (listingId: string) => void;
  onRejectListing: (listingId: string) => void;
  verifiedMembersCount: number;
  disputes?: BookingDispute[];
  onResolveDispute?: (disputeId: string, resolution: 'resolved' | 'refunded' | 'investigating', note: string) => void;
  vouchers?: PromoVoucher[];
  onToggleVoucher?: (voucherId: string) => void;
  onAddVoucher?: (voucher: PromoVoucher) => void;
  rewardSettings?: ServiceRewardSetting[];
  onUpdateRewardPercent?: (listingId: string, percent: number) => void;
  claimRequests?: PartnerClaimRequest[];
  onApproveClaim?: (claimId: string) => void;
  onRejectClaim?: (claimId: string) => void;
}

const TEN_MODULES = [
  { id: 1, name: 'Danh tính & Phân quyền', tables: 'users, roles, verifications', status: 'Hoạt động (RLS)' },
  { id: 2, name: 'Danh bạ dịch vụ (Versioning)', tables: 'listings, listing_versions, media', status: 'Hoạt động' },
  { id: 3, name: 'Lịch trống & Giá (Ưu tiên #1)', tables: 'availability, pricing_rules', status: 'Hoạt động + Zalo Bot' },
  { id: 4, name: 'Booking & Ví đối tác (50k)', tables: 'bookings, payments, wallet_ledger', status: 'Hoạt động' },
  { id: 5, name: 'Cộng đồng & Chat (9 không gian)', tables: 'conversations, messages, message_versions', status: '2 mức lưu trữ' },
  { id: 6, name: 'Review xác thực & Uy tín', tables: 'reviews, trust_scores', status: 'Gắn booking_id' },
  { id: 7, name: 'Nội dung & Bảng tin Mây 24h', tables: 'posts, comments, weather_reports', status: 'Hoạt động' },
  { id: 8, name: 'Lớp AI (6 Trợ lý chuyên biệt)', tables: 'ai_runs, embeddings', status: 'Cổng kiểm quyền' },
  { id: 9, name: 'Quản trị, Khiếu nại & Kiểm toán', tables: 'tickets, disputes, access_logs, legal_holds', status: 'Hoạt động' },
  { id: 10, name: 'Nền tảng dữ liệu & Lưu trữ lạnh', tables: 'warehouse, vectors (pgvector), archive (R2/S3)', status: 'Đồng bộ 1 chiều' }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  listings,
  billingEnabled,
  onToggleBilling,
  onUpdateTier,
  onApproveListing,
  onRejectListing,
  verifiedMembersCount,
  disputes = [],
  onResolveDispute,
  vouchers = [],
  onToggleVoucher,
  onAddVoucher,
  rewardSettings = [],
  onUpdateRewardPercent,
  claimRequests = [],
  onApproveClaim,
  onRejectClaim
}) => {
  const targetMembers = 10000;
  const progressPercent = Math.min(100, Math.round((verifiedMembersCount / targetMembers) * 100));

  // Admin Tab Switcher
  const [adminTab, setAdminTab] = useState<
    'listings' | 'disputes' | 'vouchers_rewards' | 'claims' | 'evidence_audit' | 'ai_killswitch' | 'master_architecture'
  >('listings');

  // Section 4.6: Admin Evidence Chat Access Audit Log State
  const [ticketIdInput, setTicketIdInput] = useState('TK-409');
  const [accessReasonInput, setAccessReasonInput] = useState('');
  const [unlockedEvidence, setUnlockedEvidence] = useState(false);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      actor: string;
      ticketId: string;
      object: string;
      reason: string;
      timestamp: string;
    }>
  >([
    {
      id: 'log-101',
      actor: 'admin_cskh_01',
      ticketId: 'TK-409',
      object: 'conversation:space-evidence-dm (seq #1..#3)',
      reason: 'Kiểm tra Thẻ báo giá 550.000đ/đêm theo yêu cầu đối soát của khách Nguyễn Minh Anh',
      timestamp: '2026-11-05 08:30:12'
    }
  ]);

  // Section 5 & 9: Emergency Kill Switch for each of the 6 AI Assistants
  const [aiKillSwitches, setAiKillSwitches] = useState([
    { id: 'concierge', name: '1. Concierge Khách (Báo giá & Giữ chỗ 30p)', enabled: true },
    { id: 'partner', name: '2. Trợ Lý Đối Tác (Gợi ý giá & Dịch đa ngữ)', enabled: true },
    { id: 'admin_copilot', name: '3. Admin Copilot (Tóm tắt tranh chấp)', enabled: true },
    { id: 'mod_bot', name: '4. Bot Kiểm Duyệt Lớp 1 (Lọc lừa đảo & Che PII)', enabled: true },
    { id: 'share_matcher', name: '5. Trợ Lý Ghép Đi Chung (Kèo ghép & Trust Score)', enabled: true },
    { id: 'seo_bot', name: '6. Trợ Lý Nội Dung & SEO (#hỏi-đáp)', enabled: true }
  ]);

  const handleUnlockEvidenceChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketIdInput.trim() || !accessReasonInput.trim()) return;

    const newLog = {
      id: `log-${Date.now()}`,
      actor: 'admin_current_session',
      ticketId: ticketIdInput.trim(),
      object: 'conversation:space-evidence-dm (Evidence Tier · 3 năm)',
      reason: accessReasonInput.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setUnlockedEvidence(true);
    setAccessReasonInput('');
  };

  return (
    <div className="bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-white min-h-[700px]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-850 to-slate-900 border border-indigo-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                BẢNG ĐIỀU KHIỂN QUẢN TRỊ TOÀN DIỆN (10 MODULE · MASTER PLAN)
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/40 font-bold">
                Admin & Audit Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Quản Trị Hệ Thống, Kiểm Toán Chat Bằng Chứng & Công Tắc AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Mọi lần đọc chat mức bằng chứng đều bắt buộc có mã Ticket và ghi vào `access_logs` trước khi hiển thị.
            </p>
          </div>

          {/* Feature Flag Toggle: billing_enabled */}
          <div className="bg-slate-900/90 border border-slate-750 p-4 rounded-2xl shrink-0 w-full md:w-auto">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <span className="text-xs font-bold text-white block">Cờ Thu Phí `billing_enabled`:</span>
                <span className="text-[11px] text-slate-400">50.000đ mỗi booking hoàn tất</span>
              </div>
              <button
                type="button"
                onClick={onToggleBilling}
                className="text-2xl text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                title="Bật / Tắt tính phí đối tác"
              >
                {billingEnabled ? (
                  <ToggleRight className="w-8 h-8 text-teal-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-500" />
                )}
              </button>
            </div>
            <div
              className={`text-xs font-bold px-2.5 py-1 rounded-xl text-center ${
                billingEnabled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {billingEnabled ? '🔴 ĐÃ BẬT THU PHÍ (50K/ĐƠN)' : '🟢 MIỄN PHÍ TOÀN BỘ ĐỐI TÁC (BETA)'}
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Cột Mốc Miễn Phí: 10.000 Thành Viên Đã Xác Minh (Hướng tới 100.000 Member)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Theo cam kết văn bản với 200 nhà cung cấp: Miễn phí thu sàn cho đến khi đạt 10.000 thành viên đã xác minh.
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-teal-300">
                {verifiedMembersCount.toLocaleString()} / {targetMembers.toLocaleString()} members ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-750">
            <div
              className="bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Admin Sub-Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdminTab('listings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'listings'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            1. Hồ Sơ Cơ Sở ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('disputes')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'disputes'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            2. Trọng Tài Khiếu Nại ({disputes.length})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('vouchers_rewards')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'vouchers_rewards'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            3. Tích Điểm % & Vouchers ({vouchers.length})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('claims')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'claims'
                ? 'bg-indigo-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            4. Duyệt Chính Chủ ({claimRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('evidence_audit')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'evidence_audit'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            5. Kiểm Toán Bằng Chứng
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('ai_killswitch')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'ai_killswitch'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            6. Công Tắc AI
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('master_architecture')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
              adminTab === 'master_architecture'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            7. Kiến Trúc 10 Module
          </button>
        </div>

        {/* TAB 1: Listings Approval Queue & Tier Assignment */}
        {adminTab === 'listings' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span>Danh Sách Cơ Sở & Phân Cấp Huy Hiệu ({listings.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Cấp 1: Cơ bản • Cấp 2: Đã xác minh • Cấp 3: Đối tác sáng lập (Không bán thứ hạng)
              </span>
            </div>

            <div className="space-y-3">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="bg-slate-900 border border-slate-750 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={l.coverImage}
                      alt={l.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{l.title}</h4>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{l.area}</span>
                        <span>•</span>
                        <span>Hotline: {l.phone}</span>
                        <span>•</span>
                        <span className="text-teal-400 font-semibold">{l.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Huy hiệu:</span>
                      <select
                        value={l.verificationTier}
                        onChange={(e) => onUpdateTier(l.id, Number(e.target.value) as VerificationTier)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                      >
                        <option value={1}>Cấp 1: Cơ bản</option>
                        <option value={2}>Cấp 2: Đã xác thực giấy tờ</option>
                        <option value={3}>Cấp 3: Đối tác sáng lập</option>
                      </select>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                        l.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {l.status === 'approved' ? 'Đã duyệt công khai' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Dispute & Mediation Management */}
        {adminTab === 'disputes' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-rose-400" />
                  <span>Trung Tâm Trọng Tài & Giải Quyết Khiếu Nại Booking ({disputes.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin làm trung gian can thiệp trực tiếp giữa Du Khách và Chủ Cơ Sở để bảo vệ sự thật và quyền lợi du khách.
                </p>
              </div>
            </div>

            {disputes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có khiếu nại nào phát sinh trên hệ thống. Mọi chuyến đi đang diễn ra thuận lợi!
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((disp) => {
                  const getIssueLabel = (t: string) => {
                    switch (t) {
                      case 'false_photo':
                        return 'Ảnh không đúng thực tế';
                      case 'pricing_scam':
                        return 'Gian lận giá / Phụ thu';
                      case 'room_mismatch':
                        return 'Sai hạng phòng cam kết';
                      case 'service_attitude':
                        return 'Thái độ phục vụ / Sự cố';
                      case 'cancellation_refund':
                        return 'Yêu cầu huỷ & hoàn cọc';
                      default:
                        return 'Khiếu nại dịch vụ';
                    }
                  };

                  return (
                    <div
                      key={disp.id}
                      className="bg-slate-900 border border-slate-750 rounded-2xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            #{disp.id}
                          </span>
                          <span className="text-xs font-bold text-white">
                            Đơn đặt: #{disp.bookingId}
                          </span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-xs font-bold text-teal-400">
                            {disp.listingTitle}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                            disp.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : disp.status === 'refunded'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {disp.status === 'resolved'
                            ? '✓ Đã hòa giải thỏa đáng'
                            : disp.status === 'refunded'
                            ? '💰 Đã hoàn tiền cọc'
                            : disp.status === 'investigating'
                            ? '🔍 Đang đối soát 3 bên'
                            : '⏳ Mới mở khiếu nại'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 block">Khách khiếu nại:</span>
                          <span className="font-bold text-white">{disp.guestName}</span> (SĐT: {disp.guestPhone})
                        </div>
                        <div>
                          <span className="text-slate-500 block">Loại tranh chấp:</span>
                          <span className="font-bold text-rose-300">
                            {getIssueLabel(disp.issueType)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-slate-400 block mb-1">Nội dung phản ánh từ khách:</strong>
                        {disp.description}
                      </div>

                      {/* Admin Actions */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-[11px] text-slate-500">
                          Khởi tạo: {disp.createdAt} {disp.adminAssigned && `· Phụ trách: ${disp.adminAssigned}`}
                        </div>

                        {onResolveDispute && disp.status !== 'resolved' && disp.status !== 'refunded' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onResolveDispute(disp.id, 'investigating', 'Đã liên hệ chủ cơ sở đối soát biên lai')
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 cursor-pointer"
                            >
                              Đang đối soát
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onResolveDispute(disp.id, 'resolved', 'Hai bên đã đồng thuận thỏa đáng, hỗ trợ thêm voucher')
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                            >
                              Xác nhận Hòa giải
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onResolveDispute(disp.id, 'refunded', 'Buộc hoàn cọc 100% cho du khách do vi phạm cam kết')
                              }
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                            >
                              Hoàn tiền 100%
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Points Reward % & Promo Vouchers Engine */}
        {adminTab === 'vouchers_rewards' && (
          <div className="space-y-6">
            {/* Section 3.1: Config % Tích Điểm cho từng bên dịch vụ */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Cấu Hình Tỷ Lệ Tích Điểm Mây (% Tùy Setup Từng Cơ Sở Dịch Vụ)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Khi khách đặt dịch vụ qua website/admin, du khách sẽ nhận được % Điểm Mây tương ứng để đổi ưu đãi lần sau.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listings.map((l) => {
                  const currentSetting = rewardSettings.find((r) => r.listingId === l.id);
                  const currentPercent = currentSetting ? currentSetting.pointEarnRatePercent : 8;

                  return (
                    <div
                      key={l.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{l.title}</div>
                        <div className="text-[11px] text-slate-400">{l.area} · {l.category}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">Tích điểm:</span>
                        <select
                          value={currentPercent}
                          onChange={(e) => {
                            if (onUpdateRewardPercent) {
                              onUpdateRewardPercent(l.id, Number(e.target.value));
                            }
                          }}
                          className="bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-amber-400"
                        >
                          <option value={3}>3% giá trị đơn</option>
                          <option value={5}>5% giá trị đơn</option>
                          <option value={8}>8% giá trị đơn</option>
                          <option value={10}>10% giá trị đơn</option>
                          <option value={12}>12% giá trị đơn</option>
                          <option value={15}>15% giá trị đơn (Đặc biệt)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3.2: Quản lý Promo Voucher Giảm Giá */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-emerald-400" />
                    <span>Quản Lý Voucher Giảm Giá Theo Thời Điểm (Bật / Tắt Khi Hoạt Động)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admin có toàn quyền kích hoạt hoặc tạm dừng các mã giảm giá cho mùa cao điểm / kích cầu du lịch.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {vouchers.map((v) => (
                  <div
                    key={v.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between gap-3 ${
                      v.isActive ? 'border-emerald-500/50' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {v.code}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            v.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {v.isActive ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{v.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{v.description}</p>
                      <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                        <div>
                          Giảm:{' '}
                          <strong className="text-amber-300">
                            {v.discountType === 'percent' ? `${v.discountValue}%` : formatVND(v.discountValue)}
                          </strong>
                        </div>
                        <div>Đơn tối thiểu: {formatVND(v.minBookingAmount)}</div>
                        <div>Hạn dùng: {v.validUntil}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleVoucher) onToggleVoucher(v.id);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        v.isActive
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {v.isActive ? 'Tắt Mã Voucher' : 'Kích Hoạt Hoạt Động'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Partner Claim Requests ("Bạn Là Chủ Cơ Sở Này") */}
        {adminTab === 'claims' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Hồ Sơ Đăng Ký Xác Nhận Chính Chủ Cơ Sở ({claimRequests.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các chủ homestay, nhà xe, tiệm trang phục gửi thông tin CCCD và giấy phép để nhận huy hiệu đối tác uy tín.
              </p>
            </div>

            {claimRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Chưa có yêu cầu xác nhận chính chủ nào đang chờ duyệt.
              </div>
            ) : (
              <div className="space-y-3">
                {claimRequests.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-900 border border-slate-850 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-white text-sm">{c.listingTitle}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : c.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {c.status === 'verified' ? 'Đã duyệt chính chủ' : c.status === 'rejected' ? 'Từ chối' : 'Chờ xác minh'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Chủ cơ sở: <strong>{c.ownerName}</strong> · SĐT: {c.ownerPhone} · Zalo: {c.zalo}
                      </div>
                      <div className="text-xs text-slate-400">
                        CCCD/MST: <strong>{c.cccdOrTax}</strong>
                      </div>
                      <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        Chứng từ: {c.proofDocumentNote}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (onApproveClaim) onApproveClaim(c.id);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Duyệt Chính Chủ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onRejectClaim) onRejectClaim(c.id);
                            }}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Section 4.6 Admin Evidence Chat Access Audit Workflow */}
        {adminTab === 'evidence_audit' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Quy Trình Admin Xem Chat Riêng Mức Bằng Chứng (Mục 4.6 Master Plan)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                1. Chỉ mở chat mức bằng chứng khi có Ticket hoặc Khiếu nại. 2. Admin bắt buộc nhập lý do; hệ thống ghi vào bảng `access_logs` (INSERT-ONLY) trước khi hiển thị nội dung. 3. Xuất PDF cần 2 người duyệt.
              </p>
            </div>

            <form
              onSubmit={handleUnlockEvidenceChat}
              className="bg-slate-900 border border-slate-750 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mã Ticket / Khiếu nại *
                </label>
                <input
                  type="text"
                  value={ticketIdInput}
                  onChange={(e) => setTicketIdInput(e.target.value)}
                  placeholder="Ví dụ: TK-409"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Lý do truy cập (Bắt buộc ghi vào `access_logs`) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accessReasonInput}
                    onChange={(e) => setAccessReasonInput(e.target.value)}
                    placeholder="Nhập lý do cụ thể để mở khóa hội thoại bằng chứng..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    Ghi Log & Mở Xem
                  </button>
                </div>
              </div>
            </form>

            {unlockedEvidence && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-xs space-y-2">
                <div className="font-extrabold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã ghi `access_logs` và mở quyền đọc tạm thời cho Ticket #{ticketIdInput}:</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                  <div>[seq #1 | ev_1_...]: Khách Nguyễn Minh Anh hỏi phòng Bungalow Kính đêm 06–08/11.</div>
                  <div>[seq #2 | ev_2_...]: Mẩy Homestay gửi Thẻ Báo Giá 550.000đ/đêm (Giữ chỗ 30p #TX-2026-8891).</div>
                  <div>[seq #3 | ev_3_...]: Khách xác nhận đặt chỗ theo đúng giá niêm yết trên thẻ.</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Nhật Ký Kiểm Toán Truy Cập Bất Biến (`access_logs` — Chỉ Ghi Thêm):
              </h4>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-amber-300">[{log.ticketId}]</span>{' '}
                    <span className="font-bold text-white">{log.actor}</span> ➔{' '}
                    <span className="text-teal-300">{log.object}</span>
                    <div className="text-slate-400 mt-0.5">Lý do: “{log.reason}”</div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Emergency Kill Switch for 6 AI Assistants */}
        {adminTab === 'ai_killswitch' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-400" />
                <span>Công Tắc Tắt Khẩn Cấp Cho Từng Trợ Lý AI (Mục 5 & Mục 9 Tiêu Chí Nghiệm Thu)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Khi phát hiện bất thường về chi phí token hoặc độ trễ, Admin có thể ngắt từng trợ lý độc lập mà không làm gián đoạn hệ thống đặt phòng chính.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiKillSwitches.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-750 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-extrabold text-white">{item.name}</div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        item.enabled ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.enabled ? '● Đang hoạt động qua Cổng kiểm quyền' : '○ Đã ngắt khẩn cấp (Chuyển về CSKH)'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAiKillSwitches((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, enabled: !x.enabled } : x))
                      )
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      item.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {item.enabled ? 'Đang BẬT' : 'Đang TẮT'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 10-Module Architecture & 5-Layer Data Pipeline */}
        {adminTab === 'master_architecture' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <span>Kiến Trúc 10 Module Hợp Nhất & 5 Tầng Dữ Liệu (PostgreSQL Single Source of Truth)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                PostgreSQL là nguồn sự thật duy nhất; tìm kiếm (FTS/Meilisearch), chỉ mục vector (`pgvector` đã che SĐT/CCCD), kho phân tích (ClickHouse/BigQuery) và lưu trữ bằng chứng (R2/S3 Object Lock) đồng bộ một chiều từ Postgres.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEN_MODULES.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-extrabold text-white">
                      Module #{m.id}: {m.name}
                    </div>
                    <div className="text-[11px] font-mono text-sky-300 mt-0.5">Bảng: {m.tables}</div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
