import React, { useState } from 'react';
import {
  Users,
  Car,
  Bed,
  AlertTriangle,
  MessageCircle,
  ThumbsUp,
  Phone,
  Plus,
  CheckCircle2,
  Send,
  Calendar,
  MapPin,
  ShieldCheck,
  Lock,
  FileText,
  Hash,
  Sparkles,
  QrCode,
  Copy,
  Check,
  Eye,
  Flag,
  Camera,
  Compass,
  Share2,
  Award
} from 'lucide-react';
import { CommunityPost } from '../types/index.ts';
import {
  computeMessageHash,
  verifyEvidenceHashChain,
  classifyChatMessageAI,
  checkChatPermission,
  maskSensitivePII,
  buildCommunityUtmUrl,
  ChatActorRole
} from '../utils/rules.ts';

interface CommunitySectionProps {
  posts: CommunityPost[];
  onAddPost: (post: CommunityPost) => void;
}

interface ChatMessageItem {
  id: string;
  seq: number;
  senderId: string;
  senderName: string;
  senderRole: 'member' | 'moderator' | 'partner' | 'admin' | 'ai';
  senderBadge: string;
  body: string;
  createdAt: string;
  minutesAgo: number;
  prevHash: string;
  hash: string;
  pinned?: boolean;
  quoteCard?: {
    roomName: string;
    dates: string;
    price: string;
    holdMinutes: number;
    bookingRef: string;
  };
  versions?: Array<{ version: number; oldBody: string; editedAt: string }>;
  aiModeration?: {
    flagged: boolean;
    labels: string[];
    reason: string;
  };
}

interface ChatRoomSpace {
  id: string;
  name: string;
  typeLabel: string;
  spaceType:
    | 'announcement'
    | 'topic'
    | 'partner_group'
    | 'trip_room'
    | 'share_room'
    | 'listing_dm'
    | 'multi_party_booking'
    | 'support_ticket'
    | 'dispute_room';
  tier: 'social' | 'evidence';
  retentionLabel: string;
  lifecycleLabel: string;
  participantsLabel: string;
  isReadOnlyForMember?: boolean;
  legalHoldActive?: boolean;
}

interface ShareTripDeal {
  id: string;
  category: 'room' | 'tour' | 'photo';
  categoryLabel: string;
  title: string;
  dateRange: string;
  routeOrArea: string;
  slotsLeft: number;
  totalSlots: number;
  costSplitRule: string;
  ownerName: string;
  ownerTrustScore: number;
  ownerVerifiedTrips: number;
  ownerPhone: string;
  description: string;
  applicants: Array<{
    id: string;
    name: string;
    phoneVerified: boolean;
    completedTrips: number;
    verifiedReviews: number;
    trustScore: number;
    badge: string;
    status: 'pending' | 'approved';
    privatePhone: string;
  }>;
}

interface LiveCloudReport {
  id: string;
  spotName: string;
  reporterName: string;
  reporterRole: 'Moderator địa phương' | 'Khách tại chỗ (GPS xác thực)';
  reportedAt: string;
  expiresIn: string;
  cloudDensity: string;
  visibilityNote: string;
  imageUrl: string;
  gpsVerified: boolean;
}

const CHAT_SPACES: ChatRoomSpace[] = [
  {
    id: 'space-san-may-24h',
    name: '☁️ #san-may-24h',
    typeLabel: 'Không gian săn mây thời gian thực & góc chụp đẹp',
    spaceType: 'topic',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Tương tác tự do · Moderator trực 24/7',
    participantsLabel: 'Mọi thành viên & Hướng dẫn viên bản địa'
  },
  {
    id: 'space-ghep-xe-di-chung',
    name: '🚐 #ghep-xe-di-chung',
    typeLabel: 'Ghép xe Limousine, Taxi & Xe máy phượt đèo',
    spaceType: 'trip_room',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Ghép chuyến đi chung · Giảm chi phí',
    participantsLabel: 'Member & Đối tác vận chuyển'
  },
  {
    id: 'space-ghep-phong-homestay',
    name: '🏡 #ghep-phong-homestay',
    typeLabel: 'Ghép phòng homestay & Nhượng cọc view mây',
    spaceType: 'share_room',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Tự do tìm bạn cùng phòng · Hỗ trợ nhượng cọc',
    participantsLabel: 'Member & Đối tác lưu trú'
  },
  {
    id: 'space-review-thuc-te',
    name: '⭐ #review-thuc-te',
    typeLabel: 'Đánh giá chân thực & Ảnh gốc không filter',
    spaceType: 'topic',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Member chia sẻ trải nghiệm thực tế',
    participantsLabel: 'Tất cả du khách đã đến Tà Xùa'
  },
  {
    id: 'space-canh-bao-duong-deo',
    name: '⚠️ #canh-bao-duong-deo',
    typeLabel: 'Cảnh báo đường đèo Chẹn, thời tiết & sương mù',
    spaceType: 'topic',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Cập nhật tình hình đường xá tức thì',
    participantsLabel: 'Đội cứu hộ địa phương & Bác tài'
  },
  {
    id: 'space-cho-do-thue-do',
    name: '🎒 #cho-do-thue-do',
    typeLabel: 'Chợ đồ, thuê trang phục Mông/Boho & máy ảnh',
    spaceType: 'partner_group',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Thuê đồ sống ảo, flycam, lens góc rộng',
    participantsLabel: 'Member & Đối tác dịch vụ'
  },
  {
    id: 'space-announcement',
    name: '📢 #thong-bao-chung',
    typeLabel: 'Thông báo chính thức từ BQT',
    spaceType: 'announcement',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Cố định · Chỉ Admin đăng',
    participantsLabel: 'Mọi member đã xác minh',
    isReadOnlyForMember: true
  },
  {
    id: 'space-evidence-dm',
    name: '🔒 Chat 1-1: Mẩy Homestay (Booking #TX-2026-8891)',
    typeLabel: 'Chat 1-1 gắn Booking',
    spaceType: 'listing_dm',
    tier: 'evidence',
    retentionLabel: 'Bằng chứng · Lưu 3 năm (INSERT-ONLY)',
    lifecycleLabel: 'Chuỗi Hash SHA-256 · Không thể sửa/xóa',
    participantsLabel: 'Khách Nguyễn Minh Anh & Chủ Mẩy Homestay'
  },
  {
    id: 'space-multi-booking',
    name: '🔗 Phòng Phối Hợp 3 Bên (#TX-2026-8891)',
    typeLabel: 'Phòng booking nhiều bên',
    spaceType: 'multi_party_booking',
    tier: 'evidence',
    retentionLabel: 'Bằng chứng · Lưu 3 năm (INSERT-ONLY)',
    lifecycleLabel: 'Tự tạo khi booking có ≥ 2 nhà cung cấp',
    participantsLabel: 'Khách + Mẩy Homestay + Limousine Khánh Thịnh'
  },
  {
    id: 'space-dispute',
    name: '⚖️ Phòng Khiếu Nại & Hỗ Trợ #TK-409',
    typeLabel: 'Giải quyết tranh chấp',
    spaceType: 'dispute_room',
    tier: 'evidence',
    retentionLabel: 'Bằng chứng · Khóa pháp lý (Legal Hold)',
    lifecycleLabel: 'Admin trung gian · Đóng băng các chat liên quan',
    participantsLabel: 'Khách, Chủ cơ sở & Admin CSKH',
    legalHoldActive: true
  }
];

function buildInitialEvidenceMessages(): ChatMessageItem[] {
  const m1Time = '2026-11-05 08:15:00';
  const m1Body =
    'Chào Mẩy Homestay, mình muốn đặt 1 căn Bungalow Kính Mặt Trời đêm 06/11 - 08/11 cho 2 người. Phòng có nhìn thẳng ra biển mây từ giường không ạ?';
  const h1 = computeMessageHash('GENESIS_EVIDENCE_00000000', 1, 'guest-minh-anh', m1Body, m1Time);

  const m2Time = '2026-11-05 08:17:20';
  const m2Body =
    'Dạ chào bạn Minh Anh! Căn Bungalow Kính #01 nhìn thẳng 180 độ ra thung lũng mây Đỉnh Gió ngay từ chân giường. Mình gửi Thẻ Báo Giá & Giữ Chỗ 30 phút trên hệ thống nhé:';
  const h2 = computeMessageHash(h1, 2, 'host-may-homestay', m2Body, m2Time);

  const m3Time = '2026-11-05 08:20:05';
  const m3Body =
    'Mình đã bấm xác nhận đặt trên web với mã #TX-2026-8891. Giá chốt 550.000đ/đêm trong thẻ báo giá này được lưu làm bằng chứng bảo vệ hai bên.';
  const h3 = computeMessageHash(h2, 3, 'guest-minh-anh', m3Body, m3Time);

  return [
    {
      id: 'ev-msg-1',
      seq: 1,
      senderId: 'guest-minh-anh',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'member',
      senderBadge: 'Member Đã Xác Minh SĐT',
      body: m1Body,
      createdAt: m1Time,
      minutesAgo: 25,
      prevHash: 'GENESIS_EVIDENCE_00000000',
      hash: h1
    },
    {
      id: 'ev-msg-2',
      seq: 2,
      senderId: 'host-may-homestay',
      senderName: 'Mẩy Homestay (Chủ cơ sở)',
      senderRole: 'partner',
      senderBadge: 'Đối tác sáng lập · Cấp 3',
      body: m2Body,
      createdAt: m2Time,
      minutesAgo: 22,
      prevHash: h1,
      hash: h2,
      quoteCard: {
        roomName: 'Bungalow Kính Mặt Trời #01 (View Biển Mây)',
        dates: '06/11/2026 → 08/11/2026 (2 đêm)',
        price: '1.100.000 ₫ (550.000 ₫/đêm)',
        holdMinutes: 30,
        bookingRef: 'TX-2026-8891'
      }
    },
    {
      id: 'ev-msg-3',
      seq: 3,
      senderId: 'guest-minh-anh',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'member',
      senderBadge: 'Member Đã Xác Minh SĐT',
      body: m3Body,
      createdAt: m3Time,
      minutesAgo: 18,
      prevHash: h2,
      hash: h3,
      pinned: true
    }
  ];
}

const INITIAL_SOCIAL_MESSAGES: ChatMessageItem[] = [
  {
    id: 'soc-msg-1',
    seq: 1,
    senderId: 'mod-giang-pao',
    senderName: 'Giàng A Páo (Moderator Địa Phương)',
    senderRole: 'moderator',
    senderBadge: 'Moderator Thường Trực Tà Xùa',
    body: '🌤️ Bản tin 06:00 sáng nay tại Đỉnh Gió & Sống Lưng Khủng Long: Độ ẩm 92%, gió nhẹ 7km/h, biển mây đang tràn dày đặc qua thung lũng Mị Ơi! Đường đèo Bắc Yên - Tà Xùa khô ráo, ô tô 16 chỗ và xe máy đi tốt.',
    createdAt: '2026-11-05 06:02:00',
    minutesAgo: 45,
    prevHash: 'SOCIAL_STREAM',
    hash: 'soc_1_a92f',
    pinned: true
  },
  {
    id: 'soc-msg-2',
    seq: 2,
    senderId: 'member-hoang-nam',
    senderName: 'Hoàng Nam',
    senderRole: 'member',
    senderBadge: 'Thợ Săn Mây Cấp 2',
    body: 'Cảm ơn anh Páo! Đoàn mình 4 người đang từ Thanh Sơn lên, khoảng 10h tới Đỉnh Gió. Quán Bếp H\'Mông trưa nay còn nhận đặt lẩu gà đen không ạ?',
    createdAt: '2026-11-05 07:40:00',
    minutesAgo: 8,
    prevHash: 'soc_1_a92f',
    hash: 'soc_2_b81c',
    versions: [
      {
        version: 1,
        oldBody: 'Đoàn mình 3 người đang từ Thanh Sơn lên, khoảng 10h tới Đỉnh Gió.',
        editedAt: '07:42 (Lưu ẩn cho Moderator kiểm tra)'
      }
    ]
  }
];

const INITIAL_SHARE_DEALS: ShareTripDeal[] = [
  {
    id: 'KP-102',
    category: 'room',
    categoryLabel: 'Ghép Phòng Homestay',
    title: 'Tìm 2 bạn nữ ghép căn Villa Kính 2 Phòng Ngủ tại Pơ Mu Cloud Villa',
    dateRange: '14/11/2026 – 16/11/2026 (Cuối tuần)',
    routeOrArea: 'Khu Đỉnh Gió Tà Xùa',
    slotsLeft: 2,
    totalSlots: 4,
    costSplitRule: 'Chia đều hóa đơn thực tế trên web (340.000đ/người/đêm · Không thu cọc ngoài)',
    ownerName: 'Lê Thu Trang',
    ownerTrustScore: 98,
    ownerVerifiedTrips: 4,
    ownerPhone: '0988 712 345',
    description:
      'Nhóm mình đã có 2 nữ làm văn phòng ở Hà Nội, đã giữ chỗ căn Villa Kính tại Pơ Mu Cloud Villa trên Tà Xùa Trip. Tìm thêm 2 bạn nữ lịch sự ghép chung để chia sẻ chi phí phòng và chụp ảnh săn mây.',
    applicants: [
      {
        id: 'app-1',
        name: 'Trần Ngọc Mai',
        phoneVerified: true,
        completedTrips: 3,
        verifiedReviews: 3,
        trustScore: 96,
        badge: 'Thợ săn mây Cấp 2 · Đã xác minh SĐT',
        status: 'pending',
        privatePhone: '0915 668 234'
      },
      {
        id: 'app-2',
        name: 'Phạm Khánh Linh',
        phoneVerified: true,
        completedTrips: 5,
        verifiedReviews: 4,
        trustScore: 99,
        badge: 'Thành viên Kim Cương · Đã xác minh SĐT',
        status: 'approved',
        privatePhone: '0972 331 890'
      }
    ]
  },
  {
    id: 'KP-105',
    category: 'tour',
    categoryLabel: 'Ghép Đoàn Trekking',
    title: 'Ghép đoàn Trekking Sống Lưng Khủng Long & Đỉnh U Bò (Có Porter H\'Mông dẫn đường)',
    dateRange: '15/11/2026 (05:00 sáng – 15:00 chiều)',
    routeOrArea: 'Háng Đồng ➔ Sống Lưng ➔ Đỉnh U Bò',
    slotsLeft: 3,
    totalSlots: 6,
    costSplitRule: 'Chia đều phí Porter & ăn trưa bản địa (350.000đ/người · Thanh toán khi gặp tại Tà Xùa)',
    ownerName: 'Đỗ Quang Minh',
    ownerTrustScore: 95,
    ownerVerifiedTrips: 6,
    ownerPhone: '0904 556 789',
    description:
      'Đoàn đã có 3 anh em có kinh nghiệm leo núi, thuê Porter Giàng A Lử dẫn đường. Cần tìm thêm 2-3 bạn thể lực tốt đi cùng cho vui và giảm chi phí Porter.',
    applicants: []
  },
  {
    id: 'KP-108',
    category: 'photo',
    categoryLabel: 'Ghép Gói Chụp Ảnh Săn Mây',
    title: 'Share gói Photographer chụp bình minh Đỉnh Gió + Flycam (05:30 – 08:00)',
    dateRange: '15/11/2026 (Khung giờ vàng bình minh)',
    routeOrArea: 'Đỉnh Gió & Tiệm Cà Phê Mị Ơi',
    slotsLeft: 1,
    totalSlots: 3,
    costSplitRule: 'Chia 3 gói chụp 1.200.000đ = 400.000đ/người (Nhận toàn bộ file gốc + 15 ảnh chỉnh màu)',
    ownerName: 'Vũ Hà Vy',
    ownerTrustScore: 97,
    ownerVerifiedTrips: 2,
    ownerPhone: '0936 112 998',
    description:
      'Mình đã đặt lịch thợ ảnh bản địa có cả máy cơ và Flycam quay biển mây. Cần thêm 1 bạn ghép cùng khung giờ 5h30 sáng để chia tiền thợ.',
    applicants: []
  }
];

const INITIAL_LIVE_CLOUD_REPORTS: LiveCloudReport[] = [
  {
    id: 'cloud-rep-1',
    spotName: 'Đỉnh Gió (Trước hiên Mị Ơi & Mẩy Homestay)',
    reporterName: 'Giàng A Páo',
    reporterRole: 'Moderator địa phương',
    reportedAt: '06:10 sáng nay',
    expiresIn: 'Còn hiệu lực 21 giờ (Tự lưu lịch sử sau 24h)',
    cloudDensity: 'Biển mây đặc 95% · Đứng gió',
    visibilityNote: 'Mây tràn sát lan can gỗ, nắng sớm đã lên rực rỡ, nhiệt độ ngoài trời 13.5°C.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    gpsVerified: true
  },
  {
    id: 'cloud-rep-2',
    spotName: 'Sống Lưng Khủng Long (Háng Đồng)',
    reporterName: 'Trần Hoàng Tuấn',
    reporterRole: 'Khách tại chỗ (GPS xác thực)',
    reportedAt: '06:35 sáng nay',
    expiresIn: 'Còn hiệu lực 22 giờ (Tự lưu lịch sử sau 24h)',
    cloudDensity: 'Thác mây 2 bên sườn núi (90%)',
    visibilityNote: 'Đường xuống dốc đầu tiên hơi ẩm sương, nên đi giày bám gai hoặc thuê xe ôm bản địa.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    gpsVerified: true
  }
];

export const CommunitySection: React.FC<CommunitySectionProps> = ({ posts, onAddPost }) => {
  // Main 4-Module Navigation derived from PDF 1 & PDF 2
  const [activeMainTab, setActiveMainTab] = useState<
    'chat_spaces' | 'share_deals' | 'live_cloud_forum' | 'omnichannel_funnel'
  >('chat_spaces');

  // Module 1: Chat Spaces State
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('space-evidence-dm');
  const [actorRole, setActorRole] = useState<ChatActorRole>('member');
  const [evidenceMessages, setEvidenceMessages] = useState<ChatMessageItem[]>(
    buildInitialEvidenceMessages
  );
  const [socialMessages, setSocialMessages] = useState<ChatMessageItem[]>(INITIAL_SOCIAL_MESSAGES);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [chatFeedback, setChatFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [hashVerificationResult, setHashVerificationResult] = useState<{
    checked: boolean;
    valid: boolean;
    message: string;
  } | null>(null);
  const [exportedPdfCode, setExportedPdfCode] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState<string>('');

  // Module 2: Safe Trip Sharing State (5-step workflow)
  const [shareDeals, setShareDeals] = useState<ShareTripDeal[]>(INITIAL_SHARE_DEALS);
  const [shareFilter, setShareFilter] = useState<'all' | 'room' | 'tour' | 'photo'>('all');
  const [joinedDealIds, setJoinedDealIds] = useState<string[]>([]);

  // Module 3: Live Cloud 24h & Topic Forum State
  const [liveReports, setLiveReports] = useState<LiveCloudReport[]>(INITIAL_LIVE_CLOUD_REPORTS);
  const [filter, setFilter] = useState<'all' | 'carpool' | 'share_room' | 'road_alert'>('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'carpool' | 'share_room' | 'road_alert'>('road_alert');
  const [route, setRoute] = useState('Đỉnh Gió ➔ Sống Lưng Khủng Long');
  const [departureDate, setDepartureDate] = useState('2026-11-15');
  const [contactPhone, setContactPhone] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Module 4: Omnichannel Funnel & UTM Builder State
  const [utmChannel, setUtmChannel] = useState<
    'zalo_oa' | 'zalo_group' | 'fb_page' | 'fb_group' | 'tiktok' | 'qr_offline'
  >('zalo_oa');
  const [utmCampaign, setUtmCampaign] = useState('ban_tin_may_6h_sang');
  const [copiedUtm, setCopiedUtm] = useState(false);
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: 'Đăng ký tên đồng bộ cho Page, Group, TikTok, YouTube, Zalo OA & Google Business Profile', done: true },
    { id: 2, text: 'Soạn quy chế cộng đồng 1 trang và mẫu nhãn "Đối tác" trung lập', done: true },
    { id: 3, text: 'Lập nhóm Zalo đối tác chung và các nhóm theo loại (homestay, nhà xe, xe ôm)', done: true },
    { id: 4, text: 'Mời 30–50 đối tác sáng lập và nhập liệu hồ sơ thẩm định Cấp 3 giúp họ', done: true },
    { id: 5, text: 'Tuyển 2–3 Moderator địa phương thường trực tại Tà Xùa (cam kết phản hồi < 1 giờ)', done: true },
    { id: 6, text: 'Dựng bản tin dự báo mây tự động lúc 06:00 sáng hằng ngày trên Zalo OA & Web', done: true },
    { id: 7, text: 'In tem QR dẫn về trang đăng ký Member & tích Điểm Mây tại quầy homestay/nhà xe', done: false }
  ]);

  const currentSpace =
    CHAT_SPACES.find((s) => s.id === selectedSpaceId) || CHAT_SPACES[6];
  const activeMessages =
    currentSpace.tier === 'evidence' ? evidenceMessages : socialMessages;

  // Send message handler with Layer-1 AI Moderation & Chained Hash
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageBody.trim()) return;

    const canSend = checkChatPermission(actorRole, 'send_message', {
      tier: currentSpace.tier,
      isReadOnlyRoom: currentSpace.isReadOnlyForMember
    });

    if (!canSend) {
      setChatFeedback({
        type: 'error',
        text: 'Phòng #thông-báo-chung chỉ cho phép Admin hoặc Moderator đăng tin chính thức.'
      });
      return;
    }

    const aiCheck = classifyChatMessageAI(newMessageBody);
    const piiMasked = maskSensitivePII(newMessageBody);

    const nextSeq = activeMessages.length + 1;
    const prevHash =
      activeMessages.length > 0
        ? activeMessages[activeMessages.length - 1].hash
        : currentSpace.tier === 'evidence'
        ? 'GENESIS_EVIDENCE_00000000'
        : 'SOCIAL_STREAM';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const nextHash =
      currentSpace.tier === 'evidence'
        ? computeMessageHash(prevHash, nextSeq, `user-${actorRole}`, newMessageBody.trim(), nowStr)
        : `soc_${nextSeq}_${Math.random().toString(16).slice(2, 6)}`;

    const roleDisplayMap: Record<ChatActorRole, { name: string; badge: string }> = {
      member: { name: 'Bạn (Member Đã Xác Minh)', badge: 'Member Đã Xác Minh SĐT' },
      moderator: { name: 'Giàng A Páo (Moderator)', badge: 'Moderator Địa Phương' },
      room_owner: { name: 'Chủ Phòng Kèo', badge: 'Chủ Kèo Đã Xác Minh' },
      admin: { name: 'Admin Tà Xùa Trip', badge: 'Quản Trị Viên Hệ Thống' },
      ai: { name: 'Bot Kiểm Duyệt & Trợ Lý AI', badge: 'AI Hệ Thống' }
    };

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      seq: nextSeq,
      senderId: `user-${actorRole}`,
      senderName: roleDisplayMap[actorRole].name,
      senderRole: actorRole === 'room_owner' ? 'member' : actorRole,
      senderBadge: roleDisplayMap[actorRole].badge,
      body: newMessageBody.trim(),
      createdAt: nowStr,
      minutesAgo: 0,
      prevHash,
      hash: nextHash,
      aiModeration: aiCheck.flagged
        ? {
            flagged: true,
            labels: aiCheck.labels,
            reason: `${aiCheck.reason} · Bản lập chỉ mục AI đã tự động che PII: "${piiMasked.maskedText}"`
          }
        : undefined
    };

    if (currentSpace.tier === 'evidence') {
      setEvidenceMessages((prev) => [...prev, newMsg]);
    } else {
      setSocialMessages((prev) => [...prev, newMsg]);
    }

    setNewMessageBody('');
    if (aiCheck.flagged) {
      setChatFeedback({
        type: 'warning',
        text: `⚠️ Lớp 1 AI Kiểm Duyệt Tức Thì đã gắn cờ tin nhắn (${aiCheck.labels.join(
          ', '
        )}): ${aiCheck.reason}. Đã chuyển vào hàng chờ Moderator xử lý trong < 1 giờ.`
      });
    } else {
      setChatFeedback({
        type: 'success',
        text:
          currentSpace.tier === 'evidence'
            ? `Đã ghi tin nhắn #${nextSeq} vào chuỗi bằng chứng (Hash: ${nextHash}). Không ai có thể sửa hoặc xóa.`
            : `Đã gửi tin nhắn vào ${currentSpace.name}.`
      });
    }
  };

  const handleSaveEditMessage = (msgId: string) => {
    const canEdit = checkChatPermission(actorRole, 'edit_or_delete_own', {
      tier: currentSpace.tier,
      minutesSinceSent: 5
    });

    if (!canEdit) {
      setChatFeedback({
        type: 'error',
        text: '🔒 Vi phạm quy tắc lưu trữ: Tin nhắn ở mức Bằng Chứng (Evidence Tier) chỉ cho phép INSERT, nghiêm cấm UPDATE hoặc DELETE!'
      });
      setEditingMsgId(null);
      return;
    }

    setSocialMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const prevVersions = m.versions || [];
        return {
          ...m,
          body: editingBody,
          versions: [
            ...prevVersions,
            {
              version: prevVersions.length + 1,
              oldBody: m.body,
              editedAt: 'Vừa sửa (Bản gốc vẫn lưu ẩn trong message_versions cho Moderator)'
            }
          ]
        };
      })
    );
    setEditingMsgId(null);
    setChatFeedback({
      type: 'success',
      text: 'Đã cập nhật tin nhắn (Mức Xã hội < 15 phút). Bản gốc đã được lưu vào bảng message_versions.'
    });
  };

  const handleVerifyHashChain = () => {
    const check = verifyEvidenceHashChain(evidenceMessages);
    setHashVerificationResult({
      checked: true,
      valid: check.valid,
      message: check.valid
        ? `✅ Chuỗi băm hợp lệ 100% (${evidenceMessages.length} tin nhắn nối tiếp từ GENESIS_EVIDENCE_00000000). Không có dấu hiệu chỉnh sửa trái phép trong CSDL.`
        : `❌ Phát hiện sai lệch chuỗi băm tại tin nhắn seq #${check.brokenAtSeq}!`
    });
  };

  const handleExportEvidencePdf = () => {
    const code = `TX-VERIFY-${Date.now().toString(36).toUpperCase()}`;
    setExportedPdfCode(code);
  };

  const handleApproveApplicant = (dealId: string, applicantId: string) => {
    setShareDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        return {
          ...deal,
          slotsLeft: Math.max(0, deal.slotsLeft - 1),
          applicants: deal.applicants.map((a) =>
            a.id === applicantId ? { ...a, status: 'approved' } : a
          )
        };
      })
    );
  };

  const handleRequestJoinDeal = (dealId: string) => {
    if (joinedDealIds.includes(dealId)) return;
    setJoinedDealIds((prev) => [...prev, dealId]);
    setShareDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        return {
          ...deal,
          applicants: [
            ...deal.applicants,
            {
              id: `app-${Date.now()}`,
              name: 'Bạn (Member Đã Xác Minh SĐT)',
              phoneVerified: true,
              completedTrips: 2,
              verifiedReviews: 2,
              trustScore: 95,
              badge: 'Thợ săn mây · 180 Điểm Mây',
              status: 'pending',
              privatePhone: '0989 123 456'
            }
          ]
        };
      })
    );
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: authorName.trim() || 'Thành viên Tà Xùa Trip',
      authorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isVerifiedMember: true,
      type,
      title,
      content,
      departureDate,
      route,
      contactPhone: contactPhone.trim() || '0981 234 567',
      likes: 1,
      commentsCount: 0,
      createdAt: 'Vừa xong'
    };

    onAddPost(newPost);
    setTitle('');
    setContent('');
    setContactPhone('');
    setAuthorName('');
    setShowForm(false);
  };

  const filteredPosts = posts.filter((p) => filter === 'all' || p.type === filter);
  const generatedUtmUrl = buildCommunityUtmUrl(
    'https://ais-pre-mlhtuj5y2k2v53an42jljx-996009501228.asia-east1.run.app',
    utmChannel,
    utmCampaign
  );

  return (
    <div className="bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-br from-[#04244d] via-[#073161] to-[#0a5c66] rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 text-teal-200 border border-white/15">
                <Users className="w-3.5 h-3.5 text-teal-300" />
                <span>HỆ SINH THÁI CỘNG ĐỒNG & CHAT BẰNG CHỨNG TÀ XÙA TRIP</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Website là nhà chung. Mọi cuộc trò chuyện đều minh bạch & bảo vệ bạn.
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Tích hợp đầy đủ 9 không gian chat phân quyền (Mức Xã hội 12 tháng & Mức Bằng chứng 3 năm có chuỗi Hash chống sửa xóa), luồng Kèo ghép đi chung 5 bước có Hồ sơ tin cậy, Bảng tin “Mây hôm nay” 24h và Bản đồ kênh 100.000 thành viên.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0 text-left">
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5">
                <div className="text-[11px] text-teal-200 font-bold uppercase">Mục tiêu Cộng đồng</div>
                <div className="text-xl font-black text-white mt-0.5">100.000+</div>
                <div className="text-[11px] text-slate-300">Member & 200 Nhà cung cấp</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5">
                <div className="text-[11px] text-amber-200 font-bold uppercase">Cam kết Phản hồi</div>
                <div className="text-xl font-black text-white mt-0.5">&lt; 1 Giờ</div>
                <div className="text-[11px] text-slate-300">Moderator bản địa trực tại Tà Xùa</div>
              </div>
            </div>
          </div>

          {/* 4 Main Architecture Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-7 pt-6 border-t border-white/15">
            <button
              type="button"
              onClick={() => setActiveMainTab('chat_spaces')}
              className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'chat_spaces'
                  ? 'bg-white text-[#073161] border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>1. Hệ Thống Chat (9 Không Gian)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-white">
                  2 Mức lưu
                </span>
              </div>
              <p className={`text-[11px] ${activeMainTab === 'chat_spaces' ? 'text-slate-600' : 'text-slate-300'}`}>
                Xã hội (12th) & Bằng chứng (3 năm, Hash chuỗi)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('share_deals')}
              className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'share_deals'
                  ? 'bg-white text-[#073161] border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>2. Kèo Ghép Đi Chung An Toàn</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                  5 Bước
                </span>
              </div>
              <p className={`text-[11px] ${activeMainTab === 'share_deals' ? 'text-slate-600' : 'text-slate-300'}`}>
                Ghép phòng, tour, chụp ảnh · Duyệt Hồ sơ tin cậy
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('live_cloud_forum')}
              className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'live_cloud_forum'
                  ? 'bg-white text-[#073161] border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>3. “Mây Hôm Nay” & Hỏi Đáp</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                  Live 24h
                </span>
              </div>
              <p className={`text-[11px] ${activeMainTab === 'live_cloud_forum' ? 'text-slate-600' : 'text-slate-300'}`}>
                Ảnh thực địa xác thực GPS & Diễn đàn SEO
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('omnichannel_funnel')}
              className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'omnichannel_funnel'
                  ? 'bg-white text-[#073161] border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>4. Bản Đồ Kênh & Link UTM</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-bold">
                  Zalo OA
                </span>
              </div>
              <p className={`text-[11px] ${activeMainTab === 'omnichannel_funnel' ? 'text-slate-600' : 'text-slate-300'}`}>
                Phễu Zalo/FB/TikTok về Web & Checklist 30 ngày
              </p>
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: 9 CHAT SPACES & 2 STORAGE TIERS (SOCIAL vs EVIDENCE)
           ===================================================================== */}
        {activeMainTab === 'chat_spaces' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: 9 Spaces grouped by Tier */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 block">
                  MỨC 1: LƯU TRỮ BẰNG CHỨNG (3 NĂM)
                </span>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Chỉ ghi thêm (INSERT-ONLY), nối chuỗi Hash, xuất PDF có mã xác thực.
                </p>
                <div className="space-y-1.5">
                  {CHAT_SPACES.filter((s) => s.tier === 'evidence').map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpaceId(space.id);
                        setChatFeedback(null);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedSpaceId === space.id
                          ? 'bg-[#073161] text-white border-[#073161] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                        <span className="truncate">{space.name}</span>
                        <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          selectedSpaceId === space.id ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {space.typeLabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#073161] block">
                  MỨC 2: LƯU TRỮ XÃ HỘI (12 THÁNG)
                </span>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Cho phép sửa/xóa trong 15 phút (lưu bản gốc ẩn vào `message_versions`).
                </p>
                <div className="space-y-1.5">
                  {CHAT_SPACES.filter((s) => s.tier === 'social').map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpaceId(space.id);
                        setChatFeedback(null);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedSpaceId === space.id
                          ? 'bg-[#073161] text-white border-[#073161] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                        <span className="truncate">{space.name}</span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          selectedSpaceId === space.id ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {space.typeLabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Chat Window */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
              {/* Room Header & Role RBAC Simulator */}
              <div className="border-b border-slate-200 pb-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-extrabold text-[#073161]">{currentSpace.name}</h2>
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          currentSpace.tier === 'evidence'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {currentSpace.retentionLabel}
                      </span>
                      {currentSpace.legalHoldActive && (
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          ⚖️ Đang Khóa Pháp Lý (Legal Hold)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong>Vòng đời:</strong> {currentSpace.lifecycleLabel} ·{' '}
                      <strong>Thành viên:</strong> {currentSpace.participantsLabel}
                    </p>
                  </div>

                  {/* Evidence Actions: Hash Verification & PDF Export */}
                  {currentSpace.tier === 'evidence' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyHashChain}
                        className="bg-slate-100 hover:bg-slate-200 text-[#073161] font-extrabold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Hash className="w-3.5 h-3.5 text-teal-700" />
                        <span>Kiểm tra Chuỗi Hash</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportEvidencePdf}
                        className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Xuất PDF Bằng Chứng</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Role Switcher to test Section 3.4 Permission Matrix */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">
                    Đang đóng vai (Kiểm tra phân quyền Mục 3.4):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'member', label: 'Thành viên' },
                        { id: 'moderator', label: 'Moderator địa phương' },
                        { id: 'room_owner', label: 'Chủ phòng kèo' },
                        { id: 'admin', label: 'Admin' }
                      ] as Array<{ id: ChatActorRole; label: string }>
                    ).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActorRole(r.id)}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                          actorRole === r.id
                            ? 'bg-[#073161] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hashVerificationResult && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-3 text-xs font-bold flex items-center justify-between">
                    <span>{hashVerificationResult.message}</span>
                    <button
                      type="button"
                      onClick={() => setHashVerificationResult(null)}
                      className="text-emerald-800 underline ml-2 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                )}

                {exportedPdfCode && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl p-3.5 text-xs space-y-1">
                    <div className="font-extrabold flex items-center justify-between">
                      <span>
                        📄 Đã tạo Bản Xuất Hội Thoại Bằng Chứng PDF (Mã xác thực: {exportedPdfCode})
                      </span>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold cursor-pointer"
                      >
                        In / Lưu PDF ngay
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      Bản xuất bao gồm đầy đủ chuỗi băm `prev_hash` ➔ `hash`, timestamp máy chủ và chữ ký xác thực đối chiếu với dữ liệu gốc trong PostgreSQL.
                    </p>
                  </div>
                )}
              </div>

              {/* Messages Stream */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 border ${
                      msg.aiModeration?.flagged
                        ? 'bg-rose-50/70 border-rose-300'
                        : msg.pinned
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#073161]">
                          {msg.senderName}
                        </span>
                        {(() => {
                          const badge = msg.senderBadge || '';
                          if (badge.includes('Homestay') || badge.includes('Lưu Trú') || badge.includes('Mẩy') || badge.includes('Chủ')) {
                            return (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                                [LƯU TRÚ] {badge}
                              </span>
                            );
                          }
                          if (badge.includes('Xe') || badge.includes('Taxi') || badge.includes('Di Chuyển') || badge.includes('Limousine') || badge.includes('Bác tài')) {
                            return (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                                [DI CHUYỂN] {badge}
                              </span>
                            );
                          }
                          if (badge.includes('Tour') || badge.includes('Photo') || badge.includes('Trang Phục') || badge.includes('Máy Ảnh') || badge.includes('Sales') || badge.includes('Cứu hộ') || badge.includes('Đối Tác')) {
                            return (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                                [DỊCH VỤ KHÁC] {badge}
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                              {badge}
                            </span>
                          );
                        })()}
                        {msg.pinned && (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            📌 Đã ghim
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>seq #{msg.seq}</span>
                        <span>·</span>
                        <span>{msg.createdAt}</span>
                      </div>
                    </div>

                    {/* Message Body or Edit Input */}
                    {editingMsgId === msg.id ? (
                      <div className="space-y-2 my-2">
                        <input
                          type="text"
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditMessage(msg.id)}
                            className="bg-[#073161] text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer"
                          >
                            Lưu bản sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="text-xs text-slate-500 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{msg.body}</p>
                    )}

                    {/* Binding Quote Card inside Evidence Chat (Section 3.5) */}
                    {msg.quoteCard && (
                      <div className="mt-3 bg-white border-2 border-teal-600 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-extrabold text-teal-800">
                          <span>📋 THẺ BÁO GIÁ & GIỮ CHỖ RÀNG BUỘC TRONG CHAT</span>
                          <span className="font-mono">#{msg.quoteCard.bookingRef}</span>
                        </div>
                        <div className="text-xs text-slate-800 font-bold">
                          {msg.quoteCard.roomName}
                        </div>
                        <div className="text-xs text-slate-600">
                          Ngày: {msg.quoteCard.dates} · Giá chốt:{' '}
                          <strong className="text-[#073161]">{msg.quoteCard.price}</strong>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          ✓ Giá chốt trong thẻ này có giá trị ràng buộc pháp lý và khớp 100% với đơn booking.
                        </div>
                      </div>
                    )}

                    {/* AI Layer-1 Moderation Alert */}
                    {msg.aiModeration?.flagged && (
                      <div className="mt-2.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl p-2.5 text-[11px] font-semibold">
                        🤖 <strong>AI Kiểm Duyệt Lớp 1:</strong> {msg.aiModeration.reason}
                      </div>
                    )}

                    {/* Hidden Version History (Visible to Moderator/Admin per Section 3.2 & 4.2) */}
                    {msg.versions &&
                      msg.versions.length > 0 &&
                      (actorRole === 'moderator' || actorRole === 'admin') && (
                        <div className="mt-2 bg-slate-200/70 rounded-xl p-2.5 text-[11px] text-slate-700">
                          <strong>🕵️ Lịch sử sửa tin (`message_versions` chỉ Moderator/Admin thấy):</strong>
                          {msg.versions.map((v) => (
                            <div key={v.version} className="mt-0.5">
                              v{v.version} ({v.editedAt}): <em>"{v.oldBody}"</em>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Footer: Cryptographic Hash & Actions */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-mono truncate max-w-md" title={`prev: ${msg.prevHash} -> hash: ${msg.hash}`}>
                        Hash: {msg.hash} (prev: {msg.prevHash.slice(0, 14)}...)
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditingBody(msg.body);
                          }}
                          className="text-[#073161] font-bold hover:underline cursor-pointer"
                        >
                          {currentSpace.tier === 'evidence'
                            ? 'Thử sửa tin (Test chặn RLS)'
                            : 'Sửa tin (< 15p)'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Send Message Form & Quick Scam/PII Test Buttons */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                {chatFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-bold ${
                      chatFeedback.type === 'error'
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : chatFeedback.type === 'warning'
                        ? 'bg-amber-50 border border-amber-300 text-amber-900'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    }`}
                  >
                    {chatFeedback.text}
                  </div>
                )}

                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    placeholder={`Nhắn tin vào ${currentSpace.name} (AI tự động lọc lừa đảo & che PII)...`}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#073161]"
                  />
                  <button
                    type="submit"
                    className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi tin</span>
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-semibold">Thử nhanh bộ lọc AI Lớp 1:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMessageBody(
                        'Bạn chuyển khoản ngoài cọc riêng 300k vào STK: 1903888999123 cho mình nhé!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    + Mẫu tin gạ cọc ngoài & lộ STK
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMessageBody(
                        'Mình xác nhận đặt phòng qua web Tà Xùa Trip để nhận Điểm Mây và bảo vệ đặt chỗ.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold hover:bg-teal-100 cursor-pointer"
                  >
                    + Mẫu tin nhắn hợp lệ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: SAFE TRIP SHARING 5-STEP WORKFLOW (MỤC 3.3 & SPRINT 9)
           ===================================================================== */}
        {activeMainTab === 'share_deals' && (
          <div className="space-y-6">
            {/* Safety & Legal Guardrail Banner from PDF 2 Section 3.3 & Section 11 */}
            <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>NGUYÊN TẮC AN TOÀN & PHÁP LÝ KÈO GHÉP ĐI CHUNG (MỤC 3.3 & SPRINT 9)</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  1. Chỉ Member <strong>đã xác minh SĐT OTP</strong> mới được đăng kèo hoặc xin ghép. 2. Ưu tiên mở trước <strong>Ghép phòng, Ghép tour trekking, Ghép chụp ảnh</strong> (không thu lợi kinh doanh vận tải trái phép). 3. <strong>Ẩn số điện thoại cá nhân</strong> cho đến khi Chủ kèo xem <em>Hồ sơ tin cậy (Trust Profile)</em> và bấm Duyệt!
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(['all', 'room', 'tour', 'photo'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setShareFilter(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                      shareFilter === cat
                        ? 'bg-[#073161] text-white'
                        : 'bg-white border border-amber-300 text-slate-700'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Tất cả kèo'
                      : cat === 'room'
                      ? '🏡 Ghép phòng'
                      : cat === 'tour'
                      ? '🥾 Ghép tour'
                      : '📸 Ghép chụp ảnh'}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Share Deals List */}
            <div className="grid grid-cols-1 gap-6">
              {shareDeals
                .filter((d) => shareFilter === 'all' || d.category === shareFilter)
                .map((deal) => {
                  const hasApprovedApplicant = deal.applicants.some((a) => a.status === 'approved');
                  return (
                    <div
                      key={deal.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                              {deal.categoryLabel} · #{deal.id}
                            </span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              Còn {deal.slotsLeft}/{deal.totalSlots} chỗ trống
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-[#073161] mt-1">{deal.title}</h3>
                          <p className="text-xs text-slate-600">{deal.description}</p>
                        </div>

                        {/* Owner Trust Profile Badge */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs shrink-0 space-y-1">
                          <div className="font-extrabold text-[#073161] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Chủ kèo: {deal.ownerName}</span>
                          </div>
                          <div className="text-slate-600">
                            Điểm tin cậy: <strong className="text-emerald-700">{deal.ownerTrustScore}/100</strong> ·{' '}
                            {deal.ownerVerifiedTrips} chuyến hoàn tất
                          </div>
                          <div className="text-[11px] font-bold text-slate-700">
                            SĐT liên hệ:{' '}
                            {hasApprovedApplicant ? (
                              <span className="text-emerald-700 font-mono">{deal.ownerPhone} (Đã mở sau khi duyệt)</span>
                            ) : (
                              <span className="text-amber-800">🔒 Ẩn đến khi 2 bên chấp nhận</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metadata Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-500 block">Thời gian:</span>
                          <strong className="text-slate-900">{deal.dateRange}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Khu vực / Lộ trình:</span>
                          <strong className="text-slate-900">{deal.routeOrArea}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Nguyên tắc chia chi phí:</span>
                          <strong className="text-teal-800">{deal.costSplitRule}</strong>
                        </div>
                      </div>

                      {/* Applicants & Trust Profile Approval Queue */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#073161]">
                            Danh sách thành viên Xin Ghép & Hồ sơ tin cậy ({deal.applicants.length}):
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRequestJoinDeal(deal.id)}
                              disabled={joinedDealIds.includes(deal.id)}
                              className="bg-[#073161] hover:bg-[#0a3f7c] disabled:opacity-60 text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer"
                            >
                              {joinedDealIds.includes(deal.id)
                                ? '✓ Đã gửi yêu cầu Xin Ghép'
                                : '+ Bấm Xin Ghép Kèo Này'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSpaceId('space-share-room');
                                setActiveMainTab('chat_spaces');
                              }}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                            >
                              Mở Phòng Chat Kèo →
                            </button>
                          </div>
                        </div>

                        {deal.applicants.length === 0 ? (
                          <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">
                            Chưa có yêu cầu xin ghép mới. Hãy bấm "+ Bấm Xin Ghép Kèo Này" để kiểm thử luồng duyệt Hồ sơ tin cậy!
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {deal.applicants.map((app) => (
                              <div
                                key={app.id}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-[#073161] flex items-center gap-1.5">
                                    <span>{app.name}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      Trust {app.trustScore}/100
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600">{app.badge}</div>
                                  <div className="text-[11px] text-slate-600">
                                    Đã đi {app.completedTrips} chuyến · {app.verifiedReviews} review xác thực
                                  </div>
                                  <div className="text-[11px] font-bold">
                                    SĐT:{' '}
                                    {app.status === 'approved' ? (
                                      <span className="text-emerald-700 font-mono">{app.privatePhone}</span>
                                    ) : (
                                      <span className="text-slate-400">09xx xxx xxx (Ẩn trước khi duyệt)</span>
                                    )}
                                  </div>
                                </div>

                                {app.status === 'approved' ? (
                                  <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shrink-0">
                                    ✓ Đã duyệt vào phòng
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveApplicant(deal.id, app.id)}
                                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer"
                                  >
                                    Duyệt & Mở SĐT
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: BẢNG TIN "MÂY HÔM NAY" (LIVE 24H) & DIỄN ĐÀN HỎI ĐÁP SEO
           ===================================================================== */}
        {activeMainTab === 'live_cloud_forum' && (
          <div className="space-y-8">
            {/* Live 24h Cloud Reports Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                    THÔNG TIN THỜI GIAN THỰC · TỰ HẾT HẠN SAU 24 GIỜ
                  </span>
                  <h2 className="text-xl font-extrabold text-[#073161]">
                    Bảng Tin “Mây Hôm Nay” Do Khách Tại Chỗ & Moderator Báo Cáo
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextReport: LiveCloudReport = {
                      id: `cloud-rep-${Date.now()}`,
                      spotName: 'Đồi Thảo Nguyên Tà Xùa',
                      reporterName: 'Bạn (Khách tại chỗ)',
                      reporterRole: 'Khách tại chỗ (GPS xác thực)',
                      reportedAt: 'Vừa xong',
                      expiresIn: 'Còn hiệu lực 24 giờ',
                      cloudDensity: 'Mây luồn thung lũng 85% · Nắng ấm',
                      visibilityNote: 'Đường lên Thảo Nguyên khô ráo, biển mây đang dâng lên từ phía Thủy điện Suối Sập.',
                      imageUrl:
                        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
                      gpsVerified: true
                    };
                    setLiveReports((prev) => [nextReport, ...prev]);
                  }}
                  className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>+ Báo Mây Thực Tế Kèm Ảnh GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {liveReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between"
                  >
                    <div className="relative h-48">
                      <img
                        src={rep.imageUrl}
                        alt={rep.spotName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/80 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                        📍 {rep.spotName}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                        ✓ AI Đã Kiểm Ảnh & Tọa Độ GPS
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#073161]">
                          {rep.reporterName} ({rep.reporterRole})
                        </span>
                        <span className="text-teal-700 font-bold">{rep.reportedAt}</span>
                      </div>
                      <div className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        ☁️ {rep.cloudDensity}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rep.visibilityNote}</p>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                        ⏱️ {rep.expiresIn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Community Forum Posts with SEO Tags */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#073161]">
                    Diễn Đàn Hỏi Đáp Có Thẻ Theo Chủ Đề (Giữ Câu Trả Lời Lâu Dài Tạo Traffic SEO)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Nội dung trên website được Google lập chỉ mục và làm nguồn tri thức cho Trợ lý AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showForm ? 'Đóng form' : 'Đăng Câu Hỏi / Báo Đường'}</span>
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={handleSubmitPost}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="road_alert">#đường-đi · Cảnh báo đường đèo</option>
                      <option value="share_room">#ghép-phòng · Tìm bạn ghép phòng</option>
                      <option value="carpool">#hỏi-đáp · Kinh nghiệm & Đi chung</option>
                    </select>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Tên của bạn *"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="SĐT xác minh *"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tiêu đề câu hỏi hoặc cảnh báo đường đi *"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    required
                  />
                  <textarea
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nội dung chi tiết *"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#073161] text-white font-extrabold text-xs px-5 py-2 rounded-xl cursor-pointer"
                  >
                    Đăng lên diễn đàn
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#073161]">{post.authorName}</span>
                      <span className="text-slate-500">{post.createdAt}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">{post.title}</h4>
                    <p className="text-xs text-slate-600">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: OMNICHANNEL MAP, ZALO OA, UTM BUILDER & 30-DAY CHECKLIST (PDF 1)
           ===================================================================== */}
        {activeMainTab === 'omnichannel_funnel' && (
          <div className="space-y-6">
            {/* UTM Link & Offline Homestay QR Generator (PDF 1 Section 2, 7, 13) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                  PHỄU KÉO TRAFFIC VỀ WEBSITE (MỤC 2 & MỤC 7 KẾ HOẠCH CỘNG ĐỒNG)
                </span>
                <h2 className="text-xl font-extrabold text-[#073161]">
                  Trình Tạo Liên Kết Theo Dõi Nguồn (UTM) & Tem QR Dán Tại Cơ Sở
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  "Website là nhà, Zalo/Facebook/TikTok là cửa vào." Mọi liên kết từ nhóm ngoài đều gắn UTM để đo chính xác kênh nào mang lại Member đăng ký và Booking hoàn tất.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn kênh nguồn (Source)
                  </label>
                  <select
                    value={utmChannel}
                    onChange={(e) => setUtmChannel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-[#073161]"
                  >
                    <option value="zalo_oa">Zalo OA Tà Xùa Trip (Bản tin 6h sáng)</option>
                    <option value="zalo_group">Nhóm Zalo Chuyến Cuối Tuần</option>
                    <option value="fb_group">Facebook Group "Cộng đồng Tà Xùa"</option>
                    <option value="fb_page">Facebook Page Chính Thức</option>
                    <option value="tiktok">TikTok / Reels / Shorts (3-4 video/tuần)</option>
                    <option value="qr_offline">Tem QR Offline tại Homestay / Bến xe</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên chiến dịch / Bản tin (Campaign)
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="font-mono text-xs font-bold text-[#073161] break-all">
                  {generatedUtmUrl}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedUtmUrl);
                    setCopiedUtm(true);
                    setTimeout(() => setCopiedUtm(false), 2000);
                  }}
                  className="shrink-0 bg-[#073161] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedUtm ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUtm ? 'Đã sao chép UTM!' : 'Sao chép Link UTM'}</span>
                </button>
              </div>
            </div>

            {/* 30-Day Launch Checklist (PDF 1 Section 13) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#073161]">
                  Checklist Việc Cần Làm Trong 30 Ngày Đầu (Mục 13 Kế Hoạch Cộng Đồng)
                </h3>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  Hoàn thành {checklistItems.filter((i) => i.done).length}/{checklistItems.length} hạng mục
                </span>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        setChecklistItems((prev) =>
                          prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x))
                        )
                      }
                      className="w-4 h-4 accent-[#073161]"
                    />
                    <span
                      className={`text-xs font-bold ${
                        item.done ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
