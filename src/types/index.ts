export type UserRole = 'traveler' | 'partner' | 'admin';

export type ServiceCategory = 
  | 'homestay'
  | 'coffee'
  | 'restaurant'
  | 'bus'
  | 'taxi'
  | 'motorbike'
  | 'tour'
  | 'photo'
  | 'costume'
  | 'camera'
  | 'sales'
  | 'rescue';

export type LocationArea = 
  | 'Đỉnh Gió'
  | 'Sống Lưng Khủng Long'
  | 'Khe Cải'
  | 'Trung Tâm Tà Xùa'
  | 'Mống Vàng'
  | 'Thảo Nguyên'
  | 'Háng Đồng'
  | 'Bắc Yên';

export type VerificationTier = 1 | 2 | 3; // 1: Cơ bản, 2: Xác thực giấy phép, 3: Đối tác sáng lập/Thẩm định thực tế

export interface RoomType {
  id: string;
  name: string;
  capacity: number; // số người
  priceWeekend: number;
  priceWeekday: number;
  totalRooms: number;
  availableRooms: number;
  viewType: 'Biển mây tràn' | 'Thung lũng' | 'Đỉnh núi' | 'Sân vườn';
  amenities: string[];
  imageUrl: string;
  bookedDateRanges?: Array<{
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
  }>;
}

export interface DirectChatMessage {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'traveler' | 'partner' | 'admin';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface PartnerClaimRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  ownerName: string;
  ownerPhone: string;
  zalo: string;
  cccdOrTax: string;
  proofDocumentNote: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface BookingDispute {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestPhone: string;
  issueType: 'false_photo' | 'pricing_scam' | 'room_mismatch' | 'service_attitude' | 'cancellation_refund';
  description: string;
  status: 'opening' | 'investigating' | 'resolved' | 'refunded';
  resolutionNote?: string;
  adminAssigned?: string;
  createdAt: string;
}

export interface ServiceRewardSetting {
  listingId: string;
  pointEarnRatePercent: number; // e.g., 5% or 10%
  pointRedemptionAllowed: boolean;
}

export interface PromoVoucher {
  id: string;
  code: string;
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number; // e.g. 10% or 100,000 VND
  minBookingAmount: number;
  applicableCategory: ServiceCategory | 'all';
  applicableListingId?: string; // Optional specific listing
  isActive: boolean;
  validUntil: string;
  description: string;
}

export interface Listing {
  id: string;
  title: string;
  category: ServiceCategory;
  area: LocationArea;
  address: string;
  phone: string;
  zalo: string;
  facebook?: string;
  rating: number;
  reviewCount: number;
  hasCloudView: boolean;
  minPrice: number;
  priceNote?: string;
  description: string;
  coverImage: string;
  images: string[];
  verificationTier: VerificationTier;
  updatedCalendarDate: string; // YYYY-MM-DD
  isInstantBooking: boolean;
  roomTypes?: RoomType[];
  tags: string[];
  status: 'approved' | 'pending' | 'draft' | 'rejected';
  partnerId: string;
  claimedByOwner?: boolean;
  ownerVerificationStatus?: 'unclaimed' | 'pending_verification' | 'verified_owner';
  coordinates: {
    lat: number;
    lng: number;
  };
  stats: {
    views: number;
    callClicks: number;
    bookingsCount: number;
  };
}

export interface CloudLandmark {
  id: string;
  name: string;
  area: LocationArea;
  altitude: string; // e.g., "1.650m"
  cloudProbability: number; // %
  bestTime: string;
  description: string;
  roadCondition: string;
  distanceFromCenter: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
}

export interface RouteStop {
  id: string;
  name: string;
  type: 'pickup' | 'dropoff' | 'both';
  minuteOffset: number; // minutes from departure
  fareModifier: number; // VND difference from base
  pickupNote?: string;
}

export interface BusTrip {
  id: string;
  operatorName: string;
  busType: 'Limousine 9 chỗ VIP' | 'Limousine 11 chỗ' | 'Giường nằm Cabin Đôi' | 'Giường nằm Cabin Đơn';
  departureTime: string; // e.g., "06:30" or "22:00"
  route: string; // "Hà Nội - Tà Xùa"
  originCity: string;
  destinationCity: string;
  baseFare: number;
  totalSeats: number;
  bookedSeats: number[];
  stops: RouteStop[];
  phone: string;
  zalo: string;
  rating: number;
  amenities: string[];
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  category: ServiceCategory;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomName?: string;
  totalAmount: number;
  discountApplied?: number;
  voucherCodeApplied?: string;
  pointsEarned?: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  qrCodeUrl: string;
  platformFee: number; // 50,000 VND when completed
  feeCharged: boolean;
  notes?: string;
  createdAt: string;
  seatNumbers?: number[];
  pickupStop?: string;
  dropoffStop?: string;
  reviewed?: boolean;
  hasDispute?: boolean;
  disputeId?: string;
}

export interface Review {
  id: string;
  listingId: string;
  bookingId?: string;
  reviewerName: string;
  rating: number; // 1 - 5
  comment: string;
  roomName?: string;
  createdAt: string;
  isVerifiedStay: boolean;
}


export interface CloudHuntingForecast {
  location: LocationArea;
  cloudProbability: number; // 0 - 100%
  condition: 'Biển mây dày đặc' | 'Mây luồn bồng bềnh' | 'Mây thưa - Nắng sớm' | 'Sương mù dày' | 'Mưa lạnh';
  humidity: number; // %
  windSpeedKmH: number; // km/h
  tempMin: number;
  tempMax: number;
  goldenHours: string; // "05:30 - 07:30"
  ratingStar: number;
  advice: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  isVerifiedMember: boolean;
  type: 'carpool' | 'share_room' | 'road_alert' | 'review';
  title: string;
  content: string;
  departureDate?: string;
  route?: string;
  contactPhone: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  cloudPoints: number; // Điểm "Mây"
  membershipTier: 'Tân Binh Săn Mây' | 'Thợ Săn Mây Bạc' | 'Chuyên Gia Săn Mây Vàng';
  savedListings: string[];
  bookingHistory: Booking[];
}

export interface PartnerWallet {
  partnerId: string;
  partnerName: string;
  balance: number; // Số dư ví trả trước
  pendingFeeTotal: number;
  completedBookingsCount: number;
  billingEnabled: boolean; // cờ tính phí
}
