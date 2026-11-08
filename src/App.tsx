import React, { useState, useEffect } from 'react';
import {
  INITIAL_LISTINGS,
  BUS_TRIPS,
  CLOUD_FORECASTS,
  COMMUNITY_POSTS,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_USER_PROFILE,
  INITIAL_PARTNER_WALLET,
  CLOUD_LANDMARKS,
  INITIAL_CLAIM_REQUESTS,
  INITIAL_DISPUTES,
  INITIAL_VOUCHERS,
  INITIAL_REWARD_SETTINGS
} from './data/mockData.ts';
import {
  Listing,
  Booking,
  Review,
  UserRole,
  CommunityPost,
  VerificationTier,
  PartnerClaimRequest,
  BookingDispute,
  PromoVoucher,
  ServiceRewardSetting
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ListingCard } from './components/ListingCard.tsx';
import { ListingDetailModal } from './components/ListingDetailModal.tsx';
import { BusBookingModal } from './components/BusBookingModal.tsx';
import { CloudForecastWidget } from './components/CloudForecastWidget.tsx';
import { AIItineraryGenerator } from './components/AIItineraryGenerator.tsx';
import { CommunitySection } from './components/CommunitySection.tsx';
import { PartnerDashboard } from './components/PartnerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SosModal } from './components/SosModal.tsx';
import { BookingSuccessModal } from './components/BookingSuccessModal.tsx';
import { PointsModal } from './components/PointsModal.tsx';
import { InteractiveMapSection } from './components/InteractiveMapSection.tsx';
import { AITravelAdvisorModal } from './components/AITravelAdvisorModal.tsx';
import {
  CompareFloatingBar,
  CompareHomestaysModal,
  WishlistDrawerModal
} from './components/CompareAndWishlistModals.tsx';
import { MyTripsModal } from './components/MyTripsModal.tsx';
import { DirectChatModal } from './components/DirectChatModal.tsx';
import { PartnerClaimModal } from './components/PartnerClaimModal.tsx';
import { DisputeModal } from './components/DisputeModal.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AuthUser, DEMO_ACCOUNTS } from './types/auth.ts';
import {
  calculateMemberPoints,
  calculateUpdatedRating,
  QUICK_SUGGESTIONS,
  matchesQuickSuggestion,
  QuickSuggestionId,
  isHomestayAvailableInDateRange,
  buildDeepLinkSearchParams,
  parseDeepLinkSearchParams
} from './utils/rules.ts';
import {
  Bus,
  CloudSun,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Info,
  Compass,
  BedDouble,
  Bike,
  Package,
  Eye,
  Route,
  Building2,
  SlidersHorizontal,
  Calendar,
  Users,
  MessageCircle,
  X,
  Mountain,
  Car,
  VolumeX,
  MapPin,
  RotateCcw,
  Clock,
  Utensils,
  Coffee,
  Tag,
  Award,
  Scale,
  Shirt
} from 'lucide-react';

export default function App() {
  // Navigation & Role State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('taxua_auth_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse auth user from localStorage:', e);
    }
    return DEMO_ACCOUNTS.traveler.user;
  });

  const [currentTab, setCurrentTab] = useState<string>('explore');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('taxua_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.role) return parsed.role;
      }
    } catch {
      // ignore
    }
    return 'traveler';
  });

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('traveler');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuthModal = (role: UserRole = 'traveler', mode: 'login' | 'register' = 'login') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setUserRole(user.role);
    try {
      localStorage.setItem('taxua_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
    showToast(`Đăng nhập thành công với vai trò: ${user.roleName}!`);
    if (user.role === 'admin') {
      setCurrentTab('admin');
    } else if (user.role === 'partner') {
      setCurrentTab('partner');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('taxua_auth_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setUserRole('traveler');
    if (currentTab === 'admin' || currentTab === 'partner') {
      setCurrentTab('explore');
    }
    showToast('Đã đăng xuất tài khoản.');
  };

  // Application Data State
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [trips] = useState(BUS_TRIPS);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(COMMUNITY_POSTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [userProfile, setUserProfile] = useState(INITIAL_USER_PROFILE);
  const [partnerWallet, setPartnerWallet] = useState(INITIAL_PARTNER_WALLET);
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [disputes, setDisputes] = useState<BookingDispute[]>(INITIAL_DISPUTES);
  const [vouchers, setVouchers] = useState<PromoVoucher[]>(INITIAL_VOUCHERS);
  const [rewardSettings, setRewardSettings] = useState<ServiceRewardSetting[]>(INITIAL_REWARD_SETTINGS);
  const [claimRequests, setClaimRequests] = useState<PartnerClaimRequest[]>(INITIAL_CLAIM_REQUESTS);

  // Subcategory filter states for Di Chuyển, Dịch Vụ, Ăn Uống
  const [transportSubCategory, setTransportSubCategory] = useState<'all' | 'bus' | 'taxi' | 'motorbike'>('all');
  const [servicesSubCategory, setServicesSubCategory] = useState<'all' | 'tour' | 'photo' | 'costume' | 'camera' | 'sales'>('all');
  const [diningSubCategory, setDiningSubCategory] = useState<'all' | 'restaurant' | 'coffee'>('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [onlyCloudView, setOnlyCloudView] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedQuickSuggestions, setSelectedQuickSuggestions] = useState<QuickSuggestionId[]>([]);
  const [visibleExploreCount, setVisibleExploreCount] = useState<number>(12);

  const handleToggleQuickSuggestion = (suggestionId: QuickSuggestionId) => {
    setSelectedQuickSuggestions((prev) => {
      const exists = prev.includes(suggestionId);
      const next = exists ? prev.filter((id) => id !== suggestionId) : [...prev, suggestionId];
      if (next.length > 0 && selectedCategory !== 'all' && selectedCategory !== 'homestay') {
        setSelectedCategory('homestay');
      }
      return next;
    });
  };

  // Stay Page Specific Filters
  const [stayViewDirection, setStayViewDirection] = useState('all');
  const [stayCarAccess, setStayCarAccess] = useState('all');
  const [stayCheckIn, setStayCheckIn] = useState('2026-11-06');
  const [stayCheckOut, setStayCheckOut] = useState('2026-11-08');
  const [stayFilterByAvailableDates, setStayFilterByAvailableDates] = useState(true);
  const [stayAdults, setStayAdults] = useState(2);
  const [stayChildren, setStayChildren] = useState(0);

  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);

  // Modals & Pro OTA Pack States
  const [selectedListingDetail, setSelectedListingDetail] = useState<Listing | null>(null);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isMyTripsModalOpen, setIsMyTripsModalOpen] = useState(false);
  const [activeDirectChatListing, setActiveDirectChatListing] = useState<Listing | null>(null);
  const [activeClaimListing, setActiveClaimListing] = useState<Listing | null>(null);
  const [activeDisputeBooking, setActiveDisputeBooking] = useState<Booking | null>(null);
  const [activeReviewBooking, setActiveReviewBooking] = useState<Booking | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [isMobileFilterCollapsed, setIsMobileFilterCollapsed] = useState(false);
  const [activeSuccessBooking, setActiveSuccessBooking] = useState<Booking | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dispute resolution handler
  const handleResolveDispute = (disputeId: string, resolution: 'resolved' | 'refunded' | 'investigating', note: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId ? { ...d, status: resolution, resolutionNote: note } : d
      )
    );
    showToast(`Đã cập nhật trạng thái khiếu nại: ${resolution === 'resolved' ? 'Đã giải quyết thỏa đáng' : resolution === 'refunded' ? 'Đã hoàn tiền cho du khách' : 'Đang đối soát'}`);
  };

  // Voucher toggle handler
  const handleToggleVoucher = (voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, isActive: !v.isActive } : v))
    );
    showToast('Đã cập nhật trạng thái hoạt động của mã Voucher!');
  };

  // Reward point percentage update handler
  const handleUpdateRewardPercent = (listingId: string, percent: number) => {
    setRewardSettings((prev) => {
      const exists = prev.find((r) => r.listingId === listingId);
      if (exists) {
        return prev.map((r) => (r.listingId === listingId ? { ...r, pointEarnRatePercent: percent } : r));
      }
      return [...prev, { listingId, pointEarnRatePercent: percent, pointRedemptionAllowed: true }];
    });
    showToast(`Đã lưu tỷ lệ tích điểm ${percent}% cho cơ sở!`);
  };

  // Claim owner handlers
  const handleApproveClaim = (claimId: string) => {
    const claim = claimRequests.find((c) => c.id === claimId);
    if (!claim) return;
    setClaimRequests((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'verified' } : c))
    );
    setListings((prev) =>
      prev.map((l) =>
        l.id === claim.listingId
          ? { ...l, claimedByOwner: true, ownerVerificationStatus: 'verified_owner', verificationTier: 3 }
          : l
      )
    );
    showToast(`Đã duyệt xác nhận chính chủ cho ${claim.listingTitle}!`);
  };

  const handleRejectClaim = (claimId: string) => {
    setClaimRequests((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'rejected' } : c))
    );
    showToast('Đã từ chối hồ sơ xác nhận chính chủ.');
  };

  const handleSubmitClaim = (request: Omit<PartnerClaimRequest, 'id' | 'createdAt' | 'status'>) => {
    const newClaim: PartnerClaimRequest = {
      ...request,
      id: `claim-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setClaimRequests((prev) => [newClaim, ...prev]);
    showToast('Hồ sơ xác nhận đã được gửi đến ban quản trị Tà Xùa Trip!');
  };

  const handleSubmitDispute = (disputeData: Omit<BookingDispute, 'id' | 'createdAt' | 'status'>) => {
    const newDispute: BookingDispute = {
      ...disputeData,
      id: `disp-${Date.now()}`,
      status: 'investigating',
      adminAssigned: 'Admin Điều Phối Tà Xùa',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setDisputes((prev) => [newDispute, ...prev]);
    setBookings((prev) =>
      prev.map((b) => (b.id === disputeData.bookingId ? { ...b, hasDispute: true, disputeId: newDispute.id } : b))
    );
    showToast('Khiếu nại đã được chuyển đến bộ phận Trọng tài Admin!');
  };

  const handleSubmitReview = (reviewData: Omit<Review, 'id' | 'createdAt' | 'isVerifiedStay'>) => {
    const newRev: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      isVerifiedStay: true
    };
    setReviews((prev) => [newRev, ...prev]);
    if (reviewData.bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === reviewData.bookingId ? { ...b, reviewed: true } : b))
      );
    }
    // Update listing rating and review count
    setListings((prev) =>
      prev.map((l) => {
        if (l.id === reviewData.listingId) {
          const nextCount = l.reviewCount + 1;
          const nextRating = Number(((l.rating * l.reviewCount + reviewData.rating) / nextCount).toFixed(2));
          return { ...l, reviewCount: nextCount, rating: nextRating };
        }
        return l;
      })
    );
    // Award +20 points
    setUserProfile((prev) => ({
      ...prev,
      cloudPoints: prev.cloudPoints + 20
    }));
    showToast('Đã gửi đánh giá thành công! Bạn nhận được +20 Điểm Mây thưởng.');
  };

  const handleRegisterMember = (name: string, phone: string) => {
    setUserProfile((prev) => ({
      ...prev,
      name,
      phone
    }));
    showToast(`Chào mừng thành viên ${name} (${phone}) đã đăng ký!`);
  };

  // Restore state from Deep Link URL on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parsed = parseDeepLinkSearchParams(window.location.search);
    if (parsed.tab) setCurrentTab(parsed.tab);
    if (parsed.checkIn) setStayCheckIn(parsed.checkIn);
    if (parsed.checkOut) setStayCheckOut(parsed.checkOut);
    if (parsed.area) setSelectedArea(parsed.area);
    if (parsed.wishlistIds && parsed.wishlistIds.length > 0) {
      setUserProfile((prev) => ({
        ...prev,
        savedListings: Array.from(new Set([...prev.savedListings, ...parsed.wishlistIds!]))
      }));
    }
    if (parsed.listingId) {
      const found = INITIAL_LISTINGS.find((l) => l.id === parsed.listingId);
      if (found) setSelectedListingDetail(found);
    }
  }, []);

  // Sync current state to Deep Link URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = buildDeepLinkSearchParams({
      tab: currentTab,
      checkIn: currentTab === 'stay' ? stayCheckIn : undefined,
      checkOut: currentTab === 'stay' ? stayCheckOut : undefined,
      area: selectedArea !== 'all' ? selectedArea : undefined,
      listingId: selectedListingDetail?.id || null
    });
    const nextUrl = `${window.location.pathname}${qs}`;
    window.history.replaceState(null, '', nextUrl);
  }, [currentTab, stayCheckIn, stayCheckOut, selectedArea, selectedListingDetail]);

  // Toggle Favorite
  const handleToggleSave = (id: string) => {
    setUserProfile((prev) => {
      const isSaved = prev.savedListings.includes(id);
      const nextSaved = isSaved
        ? prev.savedListings.filter((item) => item !== id)
        : [...prev.savedListings, id];
      showToast(isSaved ? 'Đã bỏ lưu cơ sở' : 'Đã lưu cơ sở vào danh sách yêu thích!');
      return { ...prev, savedListings: nextSaved };
    });
  };

  // Toggle Homestay Comparison (up to 3)
  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        showToast('Đã bỏ cơ sở khỏi bảng so sánh');
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        showToast('Chỉ có thể so sánh tối đa 3 homestay cùng lúc!');
        return [...prev.slice(1), id];
      }
      showToast('Đã thêm homestay vào thanh So sánh!');
      return [...prev, id];
    });
  };

  // Filter listings
  const filteredListings = listings
    .filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedArea !== 'all' && item.area !== selectedArea) return false;
      if (onlyCloudView && !item.hasCloudView) return false;
      if (onlyAvailable && item.roomTypes) {
        const hasFreeRooms = item.roomTypes.some((r) => r.availableRooms > 0);
        if (!hasFreeRooms) return false;
      }
      if (selectedQuickSuggestions.length > 0) {
        const matchesAllQuick = selectedQuickSuggestions.every((qid) =>
          matchesQuickSuggestion(item, qid)
        );
        if (!matchesAllQuick) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchArea = item.area.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchArea && !matchTags) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.minPrice - b.minPrice;
      if (sortBy === 'price_desc') return b.minPrice - a.minPrice;
      return b.verificationTier - a.verificationTier;
    });

  // Dedicated /stay Filtered Homestays (with 'Lọc theo ngày trống')
  const stayFilteredListings = listings
    .filter((item) => {
      if (item.category !== 'homestay') return false;
      if (selectedArea !== 'all' && item.area !== selectedArea) return false;
      if (onlyCloudView && !item.hasCloudView) return false;

      if (stayViewDirection === 'mountain' && !item.hasCloudView) return false;
      if (
        stayViewDirection === 'valley' &&
        !item.roomTypes?.some((r) => r.viewType.toLowerCase().includes('thung lũng'))
      ) {
        return false;
      }

      if (
        stayCarAccess === 'yes' &&
        !item.tags.some((t) => t.toLowerCase().includes('ô tô'))
      ) {
        return false;
      }

      if (stayFilterByAvailableDates) {
        const availability = isHomestayAvailableInDateRange(
          item,
          stayCheckIn,
          stayCheckOut,
          bookings
        );
        if (!availability.available) return false;
      } else if (onlyAvailable && item.roomTypes) {
        const hasFreeRooms = item.roomTypes.some((r) => r.availableRooms > 0);
        if (!hasFreeRooms) return false;
      }

      return true;
    })
    .sort((a, b) => b.verificationTier - a.verificationTier);

  // Booking completion handler
  const handleBookingSuccess = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    const earnedPoints = calculateMemberPoints(newBooking.totalAmount);
    setUserProfile((prev) => ({
      ...prev,
      cloudPoints: prev.cloudPoints + earnedPoints,
      bookingHistory: [newBooking, ...prev.bookingHistory]
    }));

    setListings((prev) =>
      prev.map((l) => {
        if (l.id === newBooking.listingId) {
          return {
            ...l,
            stats: {
              ...l.stats,
              bookingsCount: l.stats.bookingsCount + 1
            }
          };
        }
        return l;
      })
    );

    setSelectedListingDetail(null);
    setIsBusModalOpen(false);
    setActiveSuccessBooking(newBooking);
  };

  // Partner dashboard handlers
  const handleUpdateAvailability = (roomId: string, newAvailable: number) => {
    setListings((prev) =>
      prev.map((listing) => {
        if (listing.roomTypes) {
          return {
            ...listing,
            roomTypes: listing.roomTypes.map((r) =>
              r.id === roomId ? { ...r, availableRooms: newAvailable } : r
            ),
            updatedCalendarDate: new Date().toISOString().slice(0, 10)
          };
        }
        return listing;
      })
    );
    showToast('Đã cập nhật số phòng trống thành công!');
  };

  const handleConfirmBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
    );
    showToast('Đã xác nhận đơn đặt phòng!');
  };

  const handleCheckInBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'checked_in' } : b))
    );
    showToast('Khách đã Check-in tại quầy thành công!');
  };

  const handleCompleteBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'completed',
            feeCharged: billingEnabled
          };
        }
        return b;
      })
    );

    setPartnerWallet((prev) => ({
      ...prev,
      completedBookingsCount: prev.completedBookingsCount + 1,
      balance: billingEnabled ? Math.max(0, prev.balance - 50000) : prev.balance,
      pendingFeeTotal: billingEnabled ? prev.pendingFeeTotal : prev.pendingFeeTotal + 50000
    }));

    showToast('Đã hoàn tất lưu trú! Bạn đã có thể để lại đánh giá xác thực.');
  };

  // Add verified review from a completed booking
  const handleAddReview = (newReview: Review, bookingId?: string) => {
    setReviews((prev) => [newReview, ...prev]);

    if (bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, reviewed: true } : b))
      );
    }

    setListings((prev) =>
      prev.map((l) => {
        if (l.id === newReview.listingId) {
          const updated = calculateUpdatedRating(l.rating, l.reviewCount, newReview.rating);
          return {
            ...l,
            rating: updated.rating,
            reviewCount: updated.reviewCount
          };
        }
        return l;
      })
    );

    setSelectedListingDetail((prev) => {
      if (!prev || prev.id !== newReview.listingId) return prev;
      const updated = calculateUpdatedRating(
        prev.rating,
        prev.reviewCount,
        newReview.rating
      );
      return {
        ...prev,
        rating: updated.rating,
        reviewCount: updated.reviewCount
      };
    });

    setUserProfile((prev) => ({
      ...prev,
      cloudPoints: prev.cloudPoints + 50
    }));

    showToast('Đã đăng đánh giá xác thực thành công! (+50 Điểm Mây)');
  };

  // Admin handlers
  const handleToggleBilling = () => {
    setBillingEnabled(!billingEnabled);
    showToast(
      !billingEnabled
        ? 'Đã BẬT cờ thu phí 50.000đ/booking!'
        : 'Đã TẮT thu phí - Chế độ Beta miễn phí'
    );
  };

  const handleUpdateTier = (listingId: string, newTier: VerificationTier) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, verificationTier: newTier } : l))
    );
    showToast(`Đã cập nhật huy hiệu Cấp ${newTier} cho cơ sở!`);
  };

  const handleApproveListing = (listingId: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: 'approved' } : l))
    );
    showToast('Đã phê duyệt cơ sở hiển thị công khai!');
  };

  const handleRejectListing = (listingId: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: 'rejected' } : l))
    );
    showToast('Đã từ chối cơ sở');
  };

  const handleAddCommunityPost = (post: CommunityPost) => {
    setCommunityPosts((prev) => [post, ...prev]);
    showToast('Đăng bài lên cộng đồng thành công!');
  };

  const handleRedeemReward = (title: string, cost: number) => {
    if (userProfile.cloudPoints >= cost) {
      setUserProfile((prev) => ({ ...prev, cloudPoints: prev.cloudPoints - cost }));
      setIsPointsModalOpen(false);
      showToast(`Đổi thành công: ${title}! Mã ưu đãi đã được lưu vào hồ sơ.`);
    }
  };

  const partnerListing = listings[0];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#073161] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#073161] text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-white/15">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        cloudPoints={userProfile.cloudPoints}
        onOpenSos={() => setIsSosModalOpen(true)}
        onOpenPointsModal={() => setIsPointsModalOpen(true)}
        savedCount={userProfile.savedListings.length}
        onOpenSavedModal={() => setIsWishlistModalOpen(true)}
        bookingsCount={bookings.length}
        onOpenMyTripsModal={() => setIsMyTripsModalOpen(true)}
        lowDataMode={lowDataMode}
        onToggleLowDataMode={() => {
          setLowDataMode((prev) => {
            const next = !prev;
            showToast(
              next
                ? 'Đã BẬT Chế độ Sóng yếu (Tiết kiệm 4G & hiển thị cảnh báo sương mù Đèo Chẹn)'
                : 'Đã TẮT Chế độ Sóng yếu'
            );
            return next;
          });
        }}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Low-Bandwidth & Real-Time Mountain Fog Alert Strip */}
      {lowDataMode && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-extrabold flex flex-wrap items-center justify-center gap-3 border-b border-amber-500">
          <span>
            ⚠️ CẢNH BÁO ĐÈO CHẸN – ĐỈNH GIÓ: Sương mù dày từ 17:30, tầm nhìn &lt; 15m. Đã bật chế độ nén ảnh tiết kiệm 4G & ưu tiên danh bạ Offline.
          </span>
          <button
            type="button"
            onClick={() => setIsSosModalOpen(true)}
            className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full text-[11px] cursor-pointer"
          >
            Xem SĐT Cứu hộ Offline →
          </button>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {currentTab === 'explore' && (
          <>
            {/* 1. Hero Section + Floating White Search Card + 4-Pillar Trust Bar */}
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              onlyCloudView={onlyCloudView}
              setOnlyCloudView={setOnlyCloudView}
              onlyAvailable={onlyAvailable}
              setOnlyAvailable={setOnlyAvailable}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onExploreClick={() => {}}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />

            {/* DỮ LIỆU THẬT ĐANG CÔNG KHAI — Homestay & phòng Tà Xùa đã thẩm định */}
            <section
              id="verified-listings-section"
              className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#f8fafc] border-t border-slate-200/70"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                      DỮ LIỆU THẬT ĐANG CÔNG KHAI
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#073161] tracking-tight">
                      Homestay & phòng Tà Xùa đã thẩm định
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                      Chỉ hiển thị phòng và dịch vụ có hồ sơ Cloud View, số điện thoại & Zalo chính chủ công khai và ngày xác minh rõ ràng.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentTab('stay')}
                    className="text-sm font-extrabold text-[#073161] hover:text-teal-700 transition-colors self-start md:self-auto cursor-pointer whitespace-nowrap"
                  >
                    Xem toàn bộ Lưu trú ({listings.length}) →
                  </button>
                </div>

                {/* AI Trip Consultation Banner - Compact, elegant and high-converting */}
                <div className="mb-6 bg-gradient-to-r from-[#073161] via-[#0b4382] to-teal-800 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border border-teal-500/30">
                  <div className="relative z-10 max-w-2xl min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>Trợ lý AI Thông Minh</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Tư Vấn Giá Phòng & Lên Lịch Trình Tà Xùa Tự Động
                    </h3>
                    <p className="text-xs text-teal-100 mt-1 leading-relaxed">
                      Nhập <span className="font-bold text-amber-300">Ngày đi · Ngày về · Số người · Điểm đón · Ngân sách</span>. AI quét dữ liệu thật 179 homestay & xe đón để tính chi phí trọn gói minh bạch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiAdvisorOpen(true)}
                    className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Tư vấn chuyến đi ngay</span>
                  </button>
                </div>

                {/* Thanh công cụ 'Gợi ý nhanh' (Quick Suggestions Toolbar - Matching image_164099fa.png layout with zero truncation) */}
                <div
                  id="quick-suggestions-toolbar"
                  aria-label="Thanh công cụ Gợi ý nhanh"
                  className="bg-white border border-slate-200/90 rounded-3xl p-3.5 sm:p-5 mb-6 shadow-2xs"
                >
                  <div className="flex items-start sm:items-center gap-2.5 mb-3 sm:mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-teal-700 shrink-0 mt-0.5 sm:mt-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-[#073161]">
                          GỢI Ý NHANH
                        </span>
                        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full">
                          Tiêu chí Homestay Hot
                        </span>
                        {selectedQuickSuggestions.length > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="hidden sm:inline text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                              Đang lọc: {filteredListings.length} homestay
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedQuickSuggestions([])}
                              aria-label={`Bỏ tất cả ${selectedQuickSuggestions.length} bộ lọc gợi ý nhanh`}
                              className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer border border-rose-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              Bỏ lọc ({selectedQuickSuggestions.length})
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                        Chạm để lọc nhanh danh sách homestay bên dưới theo nhu cầu thực tế của bạn
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {QUICK_SUGGESTIONS.map((item) => {
                      const isActive = selectedQuickSuggestions.includes(item.id);
                      const matchCount = listings.filter((l) =>
                        matchesQuickSuggestion(l, item.id)
                      ).length;

                      const getFilterActionDescription = (id: QuickSuggestionId) => {
                        switch (id) {
                          case 'cloud_bedroom':
                            return 'Lọc homestay có view mây phòng ngủ';
                          case 'car_parking':
                            return 'Lọc homestay có chỗ đỗ ô tô';
                          case 'quiet_retreat':
                            return 'Lọc homestay không gian yên tĩnh tuyệt đối';
                          case 'large_group':
                            return 'Lọc homestay phù hợp nhóm đông người';
                        }
                      };

                      const buttonAriaLabel = isActive
                        ? `${getFilterActionDescription(item.id)}: Đang bật, nhấn để bỏ lọc (${matchCount} homestay)`
                        : `${getFilterActionDescription(item.id)} (${matchCount} homestay)`;

                      const renderIcon = (id: QuickSuggestionId) => {
                        switch (id) {
                          case 'cloud_bedroom':
                            return <Eye className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                          case 'car_parking':
                            return <Car className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                          case 'quiet_retreat':
                            return <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                          case 'large_group':
                            return <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                        }
                      };

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleQuickSuggestion(item.id)}
                          aria-pressed={isActive}
                          aria-label={buttonAriaLabel}
                          className={`group relative flex items-center justify-between gap-2 p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all duration-300 ease-out cursor-pointer transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 ${
                            isActive
                              ? 'bg-[#073161] text-white border-teal-400 shadow-md ring-2 ring-teal-400/50 shadow-[0_0_18px_rgba(20,184,166,0.35)]'
                              : 'bg-white hover:bg-slate-50/80 text-slate-800 border-slate-200/90 hover:border-teal-400 hover:ring-2 hover:ring-teal-400/30 hover:shadow-[0_0_16px_rgba(20,184,166,0.25)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                            <div
                              aria-hidden="true"
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                                isActive
                                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs ring-2 ring-white/30'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs group-hover:text-teal-600 group-hover:border-teal-400 group-hover:shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                              }`}
                            >
                              {renderIcon(item.id)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-[11px] sm:text-xs md:text-sm font-black leading-tight transition-colors duration-300 break-words ${
                                  isActive ? 'text-white' : 'text-[#073161] group-hover:text-teal-700'
                                }`}
                              >
                                {item.label}
                              </div>
                              <div
                                className={`text-[9.5px] sm:text-[11px] leading-tight mt-0.5 transition-colors duration-300 line-clamp-2 break-words ${
                                  isActive ? 'text-teal-100 font-medium' : 'text-slate-500 group-hover:text-slate-600'
                                }`}
                              >
                                {item.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center self-center pl-0.5">
                            {isActive ? (
                              <span
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black bg-amber-400 text-slate-950 shadow-xs shadow-amber-400/50 ring-1 ring-amber-500/60"
                                aria-label={`Đang áp dụng bộ lọc, ${matchCount} phòng homestay phù hợp`}
                              >
                                {matchCount}
                              </span>
                            ) : (
                              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold bg-white text-slate-700 border border-slate-200/90 shadow-2xs transition-all duration-300 group-hover:border-teal-400 group-hover:text-teal-800 group-hover:shadow-[0_0_6px_rgba(20,184,166,0.2)]">
                                {matchCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Category Filter Segmented Control */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6">
                  {[
                    { id: 'all', label: 'Tất cả hồ sơ công khai' },
                    { id: 'homestay', label: 'Lưu trú · Homestay' },
                    { id: 'coffee', label: 'Cà phê · Điểm ngắm mây' },
                    { id: 'restaurant', label: 'Ẩm thực bản địa' },
                    { id: 'motorbike', label: 'Xe máy · Tà Xùa Biker' },
                    { id: 'tour', label: 'Combo · Trekking' },
                    { id: 'rescue', label: 'Cứu hộ đèo 24/7' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (cat.id !== 'all' && cat.id !== 'homestay') {
                          setSelectedQuickSuggestions([]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        selectedCategory === cat.id
                          ? 'bg-[#073161] text-white border-[#073161] shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {filteredListings.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-2xs">
                    <h3 className="text-lg font-extrabold text-[#073161] mb-2">
                      Chưa có phòng Cloud View khớp điều kiện lọc hiện tại
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Khi có hồ sơ thẩm định còn hiệu lực, phòng sẽ xuất hiện tại đây. Chúng tôi không tạo điểm hoặc thẻ mẫu giả định.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedArea('all');
                        setOnlyCloudView(false);
                        setOnlyAvailable(false);
                        setSelectedQuickSuggestions([]);
                      }}
                      className="px-6 py-2.5 rounded-full border border-slate-300 hover:border-[#073161] text-xs font-bold text-[#073161] transition-colors cursor-pointer"
                    >
                      Mở toàn bộ danh sách Lưu trú
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredListings.slice(0, visibleExploreCount).map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          onSelect={(l) => setSelectedListingDetail(l)}
                          isSaved={userProfile.savedListings.includes(listing.id)}
                          onToggleSave={handleToggleSave}
                          isCompared={compareIds.includes(listing.id)}
                          onToggleCompare={handleToggleCompare}
                          lowDataMode={lowDataMode}
                          onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                          onClaimListing={(l) => setActiveClaimListing(l)}
                        />
                      ))}
                    </div>

                    {filteredListings.length > visibleExploreCount && (
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setVisibleExploreCount((prev) => prev + 12)}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#073161] hover:bg-[#0a3f7c] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                        >
                          Xem thêm 12 homestay tiếp theo ({Math.min(visibleExploreCount, filteredListings.length)} / {filteredListings.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentTab('stay');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full sm:w-auto px-6 py-3 rounded-full border border-slate-300 hover:border-[#073161] bg-white text-[#073161] text-xs sm:text-sm font-bold transition-all cursor-pointer"
                        >
                          Mở toàn bộ danh sách & Bộ lọc nâng cao →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Owner Claim Registration Banner */}
                <div className="mt-10 sm:mt-12 bg-gradient-to-r from-[#04244d] via-[#06366d] to-[#084d5e] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md border border-white/10">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] mb-2.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>DÀNH CHO CHỦ CƠ SỞ DU LỊCH</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Bạn là chủ Homestay, Nhà xe hay Dịch vụ tại Tà Xùa?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                      Đăng ký xác nhận quyền sở hữu cơ sở để nhận huy hiệu Cấp 3 chính chủ, trực tiếp cập nhật phòng trống, tiếp nhận hội thoại của du khách và bảo vệ uy tín trước cộng đồng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const firstListing = listings[0];
                      if (firstListing) setActiveClaimListing(firstListing);
                    }}
                    className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all transform active:scale-95 whitespace-nowrap cursor-pointer shadow-sm shrink-0"
                  >
                    Đăng Ký Xác Nhận Chính Chủ →
                  </button>
                </div>
              </div>
            </section>

            {/* 5. Interactive Map of Homestays & Cloud-Hunting Landmarks */}
            <InteractiveMapSection
              listings={filteredListings}
              landmarks={CLOUD_LANDMARKS}
              onSelectListing={(l) => setSelectedListingDetail(l)}
            />
          </>
        )}

        {/* Dedicated /stay View matching ref-stay.png */}
        {currentTab === 'stay' && (
          <div className="bg-[#f8fafc] pb-20">
            {/* Navy-to-Teal Banner (compact on mobile so filter & listings appear above the fold) */}
            <div className="bg-gradient-to-br from-[#04244d] via-[#06366d] to-[#0a6b6e] text-white py-6 sm:py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-white/15 border border-white/20 text-white mb-2.5 sm:mb-4">
                  LƯU TRÚ TÀ XÙA
                </span>
                <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mb-2.5 sm:mb-4">
                  Homestay Tà Xùa: xem phòng thật, view thật, giá rõ ràng
                </h1>
                <p className="text-xs sm:text-base text-slate-200 max-w-2xl leading-relaxed mb-4 sm:mb-8">
                  Chọn theo đúng loại phòng, sức chứa và bằng chứng đã công khai. Khi có đủ ngày, hệ thống đối chiếu từng đêm; dữ liệu thiếu không bao giờ được xem là còn phòng.
                </p>

                {/* Frosted Notice Box */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 sm:p-5 max-w-2xl">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-200 mb-0.5 sm:mb-1">
                    THÔNG TIN CẦN LƯU Ý
                  </div>
                  <div className="text-xs sm:text-base font-extrabold text-white mb-0.5 sm:mb-1">
                    Giá và tình trạng phòng là hai dữ liệu độc lập.
                  </div>
                  <p className="text-[11px] sm:text-sm text-slate-200">
                    Website chỉ hiển thị giá hoặc khả năng đáp ứng khi có dữ liệu tương ứng. Không suy luận từ dữ liệu thiếu.
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column Filter & Results Layout matching ref-stay.png */}
            <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Sidebar: Bộ lọc */}
                <aside
                  id="stay-filter-sidebar"
                  className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5"
                >
                  <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 font-extrabold text-[#073161] text-base">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block leading-tight">Bộ lọc lưu trú</span>
                        <span className="block text-[11px] font-medium text-slate-500">
                          Tùy chỉnh theo lịch & nhu cầu
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
                      {stayFilterByAvailableDates || onlyCloudView || onlyAvailable || selectedArea !== 'all' || stayViewDirection !== 'all' || stayCarAccess !== 'all'
                        ? `Đang lọc (${stayFilteredListings.length})`
                        : 'Chưa lọc'}
                    </span>
                  </div>

                  {/* Mobile Ergonomic Action Bar: Jump to Results or Collapse/Expand Filters */}
                  <div className="lg:hidden flex items-center justify-between gap-2 bg-teal-50/70 border border-teal-200/80 rounded-2xl p-2.5">
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterCollapsed(!isMobileFilterCollapsed)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#073161] cursor-pointer"
                    >
                      {isMobileFilterCollapsed ? 'Mở bộ lọc chi tiết ↓' : 'Thu gọn bộ lọc ↑'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById('stay-results-list')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#073161] text-white text-xs font-extrabold text-center cursor-pointer"
                    >
                      Xem ngay {stayFilteredListings.length} căn trống →
                    </button>
                  </div>

                  <div className={`${isMobileFilterCollapsed ? 'hidden lg:block' : 'block'} space-y-4 sm:space-y-5`}>
                    {/* Fieldset 1: Lọc theo ngày trống (Date Range Availability Filter) */}
                  <fieldset
                    id="stay-date-availability-filter"
                    className="bg-[#f8fafc] border border-teal-200/90 rounded-2xl p-4 pt-3"
                  >
                    <legend className="px-2 -ml-1 text-xs sm:text-sm font-extrabold text-[#073161] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Lọc theo ngày trống</span>
                    </legend>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 bg-white border border-teal-100 rounded-xl px-3 py-2">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Chỉ hiện homestay còn phòng
                        </span>
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 cursor-pointer whitespace-nowrap bg-teal-100/80 px-2.5 py-1 rounded-full">
                          <input
                            id="toggle-filter-by-date"
                            type="checkbox"
                            checked={stayFilterByAvailableDates}
                            onChange={(e) => setStayFilterByAvailableDates(e.target.checked)}
                            className="rounded border-slate-300 text-[#073161] cursor-pointer"
                          />
                          <span>Còn phòng</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label
                            htmlFor="stay-checkin-input"
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap"
                          >
                            <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>Ngày nhận phòng</span>
                          </label>
                          <input
                            id="stay-checkin-input"
                            type="date"
                            value={stayCheckIn}
                            onChange={(e) => {
                              const nextIn = e.target.value;
                              setStayCheckIn(nextIn);
                              setStayFilterByAvailableDates(true);
                              if (stayCheckOut && nextIn >= stayCheckOut) {
                                setStayCheckOut(nextIn);
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#073161]"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="stay-checkout-input"
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1.5 whitespace-nowrap"
                          >
                            <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>Ngày trả phòng</span>
                          </label>
                          <input
                            id="stay-checkout-input"
                            type="date"
                            value={stayCheckOut}
                            min={stayCheckIn}
                            onChange={(e) => {
                              setStayCheckOut(e.target.value);
                              setStayFilterByAvailableDates(true);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#073161]"
                          />
                        </div>
                      </div>

                      {/* Quick Date Presets */}
                      <div className="pt-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Chọn nhanh lịch cuối tuần:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '06/11 → 08/11', inDate: '2026-11-06', outDate: '2026-11-08' },
                            { label: '14/11 → 16/11', inDate: '2026-11-14', outDate: '2026-11-16' },
                            { label: '20/11 → 22/11', inDate: '2026-11-20', outDate: '2026-11-22' }
                          ].map((preset) => {
                            const isSelectedPreset =
                              stayFilterByAvailableDates &&
                              stayCheckIn === preset.inDate &&
                              stayCheckOut === preset.outDate;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setStayCheckIn(preset.inDate);
                                  setStayCheckOut(preset.outDate);
                                  setStayFilterByAvailableDates(true);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                                  isSelectedPreset
                                    ? 'bg-[#073161] text-white border-[#073161]'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* Fieldset 2: Số lượng khách & Sức chứa */}
                  <fieldset
                    id="stay-guests-filter"
                    className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 pt-3"
                  >
                    <legend className="px-2 -ml-1 text-xs sm:text-sm font-extrabold text-[#073161] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Số lượng khách</span>
                    </legend>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="stay-adults-input"
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1"
                        >
                          <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Người lớn</span>
                        </label>
                        <input
                          id="stay-adults-input"
                          type="number"
                          min={1}
                          value={stayAdults}
                          onChange={(e) => setStayAdults(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#073161]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="stay-children-input"
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1"
                        >
                          <BedDouble className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Trẻ em</span>
                        </label>
                        <input
                          id="stay-children-input"
                          type="number"
                          min={0}
                          value={stayChildren}
                          onChange={(e) => setStayChildren(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#073161]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Fieldset 3: View & Thẩm định */}
                  <fieldset
                    id="stay-view-verification-filter"
                    className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 pt-3"
                  >
                    <legend className="px-2 -ml-1 text-xs sm:text-sm font-extrabold text-[#073161] flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>View & Thẩm định</span>
                    </legend>

                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="stay-area-select"
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1"
                        >
                          <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Khu vực tại Tà Xùa</span>
                        </label>
                        <select
                          id="stay-area-select"
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#073161]"
                        >
                          <option value="all">Tất cả khu vực</option>
                          <option value="Đỉnh Gió">Đỉnh Gió</option>
                          <option value="Sống Lưng Khủng Long">Sống Lưng Khủng Long</option>
                          <option value="Khe Cải">Bản Khe Cải</option>
                          <option value="Trung Tâm Tà Xùa">Trung Tâm Xã</option>
                          <option value="Mống Vàng">Mống Vàng</option>
                          <option value="Thảo Nguyên">Thảo Nguyên</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="stay-view-direction-select"
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1"
                        >
                          <Mountain className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Hướng nhìn</span>
                        </label>
                        <select
                          id="stay-view-direction-select"
                          value={stayViewDirection}
                          onChange={(e) => setStayViewDirection(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#073161]"
                        >
                          <option value="all">Tất cả</option>
                          <option value="mountain">Núi & Biển mây</option>
                          <option value="valley">Thung lũng</option>
                          <option value="garden">Vườn & Bản làng</option>
                        </select>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-slate-200/70">
                        <label className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer hover:border-teal-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={onlyAvailable}
                            onChange={(e) => setOnlyAvailable(e.target.checked)}
                            className="rounded border-slate-300 text-[#073161] shrink-0"
                          />
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Có thẩm định & lịch trống đang hiệu lực</span>
                        </label>

                        <label className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer hover:border-teal-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={onlyCloudView}
                            onChange={(e) => setOnlyCloudView(e.target.checked)}
                            className="rounded border-slate-300 text-[#073161] shrink-0"
                          />
                          <CloudSun className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Có Cloud View từ giường đã thẩm định</span>
                        </label>
                      </div>
                    </div>
                  </fieldset>

                  {/* Fieldset 4: Tiếp cận & Phương tiện */}
                  <fieldset
                    id="stay-access-filter"
                    className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 pt-3"
                  >
                    <legend className="px-2 -ml-1 text-xs sm:text-sm font-extrabold text-[#073161] flex items-center gap-1.5">
                      <Route className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Tiếp cận & Đường đi</span>
                    </legend>

                    <div>
                      <label
                        htmlFor="stay-car-access-select"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1"
                      >
                        <Car className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>Ô tô tiếp cận</span>
                      </label>
                      <select
                        id="stay-car-access-select"
                        value={stayCarAccess}
                        onChange={(e) => setStayCarAccess(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#073161]"
                      >
                        <option value="all">Không yêu cầu</option>
                        <option value="yes">Ô tô vào tận nơi</option>
                        <option value="motorbike">Ưu tiên xe máy</option>
                      </select>
                    </div>
                  </fieldset>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          `Đã lọc ${stayFilteredListings.length} homestay còn phòng trống (${stayCheckIn} → ${stayCheckOut})!`
                        )
                      }
                      className="w-full bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold text-xs py-3 rounded-full uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ÁP DỤNG BỘ LỌC ({stayFilteredListings.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArea('all');
                        setOnlyCloudView(false);
                        setOnlyAvailable(false);
                        setStayViewDirection('all');
                        setStayCarAccess('all');
                        setStayFilterByAvailableDates(false);
                      }}
                      className="w-full text-xs font-bold text-slate-500 hover:text-[#073161] py-1.5 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa tất cả bộ lọc</span>
                    </button>
                  </div>
                  </div>
                </aside>

                {/* Right Column: Summary Strip + Filtered Listings */}
                <div id="stay-results-list" className="lg:col-span-8 space-y-6">
                  {/* Top Summary Bar matching ref-stay.png */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#073161]">
                          Lọc theo ngày trống
                        </div>
                        <div className="text-xs text-slate-600 font-semibold">
                          {stayFilterByAvailableDates
                            ? `${stayCheckIn} → ${stayCheckOut}`
                            : 'Tất cả các ngày'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#073161]">Khách</div>
                        <div className="text-xs text-slate-500">
                          {stayAdults} người lớn · {stayChildren} trẻ em
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#073161]">
                          Kết quả kiểm tra phòng
                        </div>
                        <div className="text-xs text-emerald-700 font-bold">
                          {stayFilteredListings.length} homestay còn phòng trống
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verified Homestays List Filtered by Date Range */}
                  {stayFilteredListings.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
                      <h3 className="text-lg font-extrabold text-[#073161]">
                        Không có homestay còn phòng trống trong khoảng {stayCheckIn} → {stayCheckOut}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                        Vui lòng chọn khoảng ngày khác hoặc tắt bộ lọc ngày trống để xem toàn bộ danh sách homestay đã thẩm định.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStayFilterByAvailableDates(false)}
                        className="px-5 py-2.5 rounded-full bg-[#073161] text-white text-xs font-bold cursor-pointer"
                      >
                        Xem tất cả homestay không giới hạn ngày
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {stayFilteredListings.map((listing) => {
                        const dateCheck = isHomestayAvailableInDateRange(
                          listing,
                          stayCheckIn,
                          stayCheckOut,
                          bookings
                        );
                        const shortIn = stayCheckIn.slice(5).split('-').reverse().join('/');
                        const shortOut = stayCheckOut.slice(5).split('-').reverse().join('/');
                        return (
                          <div key={listing.id} className="flex flex-col">
                            {stayFilterByAvailableDates && (
                              <div className="mb-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 truncate">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">
                                    Còn {dateCheck.availableRoomsCount} phòng trống ({shortIn} – {shortOut})
                                  </span>
                                </span>
                                <span className="text-[11px] font-extrabold text-emerald-700 whitespace-nowrap shrink-0">
                                  Sẵn sàng đặt
                                </span>
                              </div>
                            )}
                            <ListingCard
                              listing={listing}
                              onSelect={(l) => setSelectedListingDetail(l)}
                              isSaved={userProfile.savedListings.includes(listing.id)}
                              onToggleSave={handleToggleSave}
                              isCompared={compareIds.includes(listing.id)}
                              onToggleCompare={handleToggleCompare}
                              lowDataMode={lowDataMode}
                              onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                              onClaimListing={(l) => setActiveClaimListing(l)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Khám phá theo nhu cầu rõ ràng (matching ref-stay.png bottom) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mt-8">
                    <h2 className="text-xl font-extrabold text-[#073161] mb-4">
                      Khám phá theo nhu cầu rõ ràng
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          label: 'Homestay Tà Xùa theo nhu cầu phòng →',
                          action: () => {
                            setSelectedCategory('homestay');
                            setOnlyCloudView(false);
                          }
                        },
                        {
                          label: 'Phòng có hướng nhìn ra núi hoặc thung lũng →',
                          action: () => {
                            setSelectedCategory('homestay');
                            setOnlyCloudView(true);
                          }
                        },
                        {
                          label: 'Phòng tại khu vực Đỉnh Gió trung tâm →',
                          action: () => setSelectedArea('Đỉnh Gió')
                        },
                        {
                          label: 'Nơi lưu trú khu vực Bản Khe Cải yên tĩnh →',
                          action: () => setSelectedArea('Khe Cải')
                        }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={item.action}
                          className="text-left p-3.5 rounded-2xl border border-slate-200 hover:border-[#073161] text-xs font-bold text-[#073161] transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated /verified View */}
        {currentTab === 'verified' && (
          <div className="bg-[#f8fafc] py-14 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-gradient-to-br from-[#04244d] via-[#06366d] to-[#0a6b6e] rounded-3xl p-8 sm:p-12 text-white">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-200 mb-2">
                  PHƯƠNG PHÁP THẨM ĐỊNH TÀ XÙA TRIP
                </p>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
                  Đi thật. Biết trước.
                </h1>
                <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
                  Chúng tôi tách biệt từng lớp thông tin: danh tính phòng, góc nhìn vật lý (Cloud View), độ khó của đường đèo vào homestay và ngày xác minh gần nhất để bạn không bao giờ phải đặt phòng qua ảnh quảng cáo mơ hồ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-lg font-extrabold text-[#073161] mb-2">
                    1. Tách biệt Loại phòng & Phòng cụ thể (Room ID)
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Trong cùng một homestay tại Tà Xùa, căn Bungalow số 01 có thể nhìn thẳng ra biển mây Đỉnh Gió nhưng căn số 04 lại bị mái nhà trước che khuất. Hồ sơ của chúng tôi gắn nhãn theo từng Room ID.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-lg font-extrabold text-[#073161] mb-2">
                    2. Đường vào & Khả năng tiếp cận
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Ghi rõ độ dốc đường nhánh vào từng cơ sở (ô tô 16 chỗ vào tận sân, hay phải gửi xe ở trục chính và đi bộ/xe máy 200m).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'map' && (
          <InteractiveMapSection
            listings={listings}
            landmarks={CLOUD_LANDMARKS}
            onSelectListing={(l) => setSelectedListingDetail(l)}
          />
        )}

        {currentTab === 'weather' && <CloudForecastWidget forecasts={CLOUD_FORECASTS} />}

        {/* TAB DI CHUYỂN: Xe Khách - Taxi - Thuê Xe Máy */}
        {(currentTab === 'transport' || currentTab === 'bus') && (
          <div className="bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                    PHƯƠNG TIỆN DI CHUYỂN AN TOÀN ĐÈO NÚI
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#073161]">
                    Di Chuyển Tà Xùa: Xe Khách · Taxi · Thuê Xe Máy
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    Đưa đón trọn gói từ Hà Nội, bến xe Mỹ Đình lên trung tâm Tà Xùa. Xe taxi bản địa gầm cao và dàn xe máy phượt lốp gai chuyên dụng vượt đèo sương mù.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(true)}
                  className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold px-6 py-3 rounded-full text-xs transition-all shadow-md self-start sm:self-auto cursor-pointer flex items-center gap-2"
                >
                  <Bus className="w-4 h-4" />
                  <span>Sơ Đồ Ghế Limousine</span>
                </button>
              </div>

              {/* Sub-Category Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                {[
                  { id: 'all', label: 'Tất cả phương tiện', count: listings.filter((l) => ['bus', 'taxi', 'motorbike'].includes(l.category)).length + trips.length },
                  { id: 'bus', label: 'Xe Khách Limousine VIP', count: trips.length },
                  { id: 'taxi', label: 'Taxi Tà Xùa 24/7', count: listings.filter((l) => l.category === 'taxi').length },
                  { id: 'motorbike', label: 'Thuê Xe Máy Phượt Đèo', count: listings.filter((l) => l.category === 'motorbike').length }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setTransportSubCategory(sub.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      transportSubCategory === sub.id
                        ? 'bg-[#073161] text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className="ml-1.5 opacity-75 tabular-nums">({sub.count})</span>
                  </button>
                ))}
              </div>

              {/* Limousine Trips Schedule Section */}
              {(transportSubCategory === 'all' || transportSubCategory === 'bus') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#073161] flex items-center gap-2">
                      <Bus className="w-4 h-4 text-teal-700" />
                      <span>Các Chuyến Xe Limousine Khởi Hành Hàng Ngày</span>
                    </h3>
                    <span className="text-xs text-slate-500">Giữ chỗ 30 phút · VietQR tự động</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {trips.map((trip) => (
                      <div
                        key={trip.id}
                        className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="font-extrabold text-[#073161] text-xl tabular-nums">
                              {trip.departureTime}
                            </span>
                            <span className="bg-teal-50 text-teal-800 px-3 py-1 rounded-full font-bold">
                              {trip.busType}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-[#073161] text-sm mb-1">
                            {trip.operatorName}
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">{trip.route}</p>

                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs space-y-1 mb-4">
                            <div className="text-[#073161] font-bold">Điểm đón khách chính:</div>
                            <ul className="text-slate-600 space-y-0.5 text-[11px]">
                              {trip.stops.slice(0, 3).map((s, idx) => (
                                <li key={idx}>· {s.name} (+{s.minuteOffset}p)</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Giá vé từ:</span>
                            <span className="text-sm font-extrabold text-[#073161] tabular-nums">
                              {trip.baseFare.toLocaleString()}đ/ghế
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsBusModalOpen(true)}
                            className="bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold text-xs px-3.5 py-2 rounded-full transition-colors cursor-pointer"
                          >
                            Chọn Ghế Đón
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transport Service Listings: Taxi & Motorbike Rental */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#073161] flex items-center gap-2">
                    <Car className="w-4 h-4 text-teal-700" />
                    <span>Dịch Vụ Taxi Bản Địa & Cho Thuê Xe Máy Leo Núi</span>
                  </h3>
                  <span className="text-xs text-slate-500">4 Kênh liên hệ: Chat Web · SĐT · Zalo · FB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings
                    .filter((l) => {
                      if (transportSubCategory === 'all') return ['taxi', 'motorbike'].includes(l.category);
                      return l.category === transportSubCategory;
                    })
                    .map((item) => (
                      <ListingCard
                        key={item.id}
                        listing={item}
                        onSelect={(l) => setSelectedListingDetail(l)}
                        isSaved={userProfile.savedListings.includes(item.id)}
                        onToggleSave={handleToggleSave}
                        lowDataMode={lowDataMode}
                        onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                        onClaimListing={(l) => setActiveClaimListing(l)}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB DỊCH VỤ: Tour Tà Xùa - Photographer - Thuê Trang Phục - Thuê Máy Ảnh - Sales Đặt Phòng */}
        {currentTab === 'services' && (
          <div className="bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                    HỆ SINH THÁI DỊCH VỤ TRẢI NGHIỆM CHUYÊN NGHIỆP
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#073161]">
                    Dịch Vụ Du Lịch & Trải Nghiệm Tà Xùa
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    Tour trekking Sống Lưng Khủng Long, thợ chụp ảnh săn mây chuyên nghiệp, tiệm thuê trang phục Mông/Bohemian, thuê máy ảnh mirrorless/flycam và đội ngũ Sales đặt phòng uy tín.
                  </p>
                </div>
              </div>

              {/* Sub-Category Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                {[
                  { id: 'all', label: 'Tất cả dịch vụ', count: listings.filter((l) => ['tour', 'photo', 'costume', 'camera', 'sales'].includes(l.category)).length },
                  { id: 'tour', label: 'Tour Tà Xùa & Trekking', count: listings.filter((l) => l.category === 'tour').length },
                  { id: 'photo', label: 'Photographer Săn Mây', count: listings.filter((l) => l.category === 'photo').length },
                  { id: 'costume', label: 'Thuê Trang Phục Mông/Boho', count: listings.filter((l) => l.category === 'costume').length },
                  { id: 'camera', label: 'Thuê Máy Ảnh & Flycam', count: listings.filter((l) => l.category === 'camera').length },
                  { id: 'sales', label: 'Sales Đặt Phòng Uy Tín', count: listings.filter((l) => l.category === 'sales').length }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setServicesSubCategory(sub.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      servicesSubCategory === sub.id
                        ? 'bg-[#073161] text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className="ml-1.5 opacity-75 tabular-nums">({sub.count})</span>
                  </button>
                ))}
              </div>

              {/* Services Listings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings
                  .filter((l) => {
                    if (servicesSubCategory === 'all') return ['tour', 'photo', 'costume', 'camera', 'sales'].includes(l.category);
                    return l.category === servicesSubCategory;
                  })
                  .map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      onSelect={(l) => setSelectedListingDetail(l)}
                      isSaved={userProfile.savedListings.includes(item.id)}
                      onToggleSave={handleToggleSave}
                      lowDataMode={lowDataMode}
                      onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                      onClaimListing={(l) => setActiveClaimListing(l)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB ĂN UỐNG: Nhà Hàng và Cafe */}
        {currentTab === 'dining' && (
          <div className="bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                    ẨM THỰC BẢN ĐỊA & CÀ PHÊ MÂY
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#073161]">
                    Ăn Uống: Nhà Hàng & Cà Phê Tà Xùa
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    Thưởng thức lẩu gà đen, lợn bản nướng mắc khén và ngồi nhâm nhi tách cà phê muối ấm nóng nhìn ngắm thung lũng mây Đỉnh Gió trập trùng.
                  </p>
                </div>
              </div>

              {/* Sub-Category Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                {[
                  { id: 'all', label: 'Tất cả ẩm thực', count: listings.filter((l) => ['restaurant', 'coffee'].includes(l.category)).length },
                  { id: 'restaurant', label: 'Nhà Hàng & Đặc Sản', count: listings.filter((l) => l.category === 'restaurant').length },
                  { id: 'coffee', label: 'Quán Cà Phê Săn Mây', count: listings.filter((l) => l.category === 'coffee').length }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setDiningSubCategory(sub.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      diningSubCategory === sub.id
                        ? 'bg-[#073161] text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className="ml-1.5 opacity-75 tabular-nums">({sub.count})</span>
                  </button>
                ))}
              </div>

              {/* Dining Listings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings
                  .filter((l) => {
                    if (diningSubCategory === 'all') return ['restaurant', 'coffee'].includes(l.category);
                    return l.category === diningSubCategory;
                  })
                  .map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      onSelect={(l) => setSelectedListingDetail(l)}
                      isSaved={userProfile.savedListings.includes(item.id)}
                      onToggleSave={handleToggleSave}
                      lowDataMode={lowDataMode}
                      onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                      onClaimListing={(l) => setActiveClaimListing(l)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'itinerary' && (
          <AIItineraryGenerator onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)} />
        )}

        {/* TAB CHAT CỘNG ĐỒNG RIÊNG */}
        {currentTab === 'community' && (
          <CommunitySection posts={communityPosts} onAddPost={handleAddCommunityPost} />
        )}

        {currentTab === 'partner' && (
          currentUser?.role === 'partner' ? (
            <PartnerDashboard
              partnerListing={partnerListing}
              bookings={bookings}
              wallet={partnerWallet}
              onUpdateAvailability={handleUpdateAvailability}
              onConfirmBooking={handleConfirmBooking}
              onCheckInBooking={handleCheckInBooking}
              onCompleteBooking={handleCompleteBooking}
              billingEnabled={billingEnabled}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 px-4">
              <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-black">
                  🏡
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Cổng Quản Lý Cơ Sở Homestay
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Trang này dành riêng cho chủ homestay, nhà nghỉ và dịch vụ bản địa Tà Xùa cập nhật lịch phòng trống, xác nhận đặt chỗ và quản lý ví doanh thu.
                </p>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 inline-flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <span>Tài khoản hiện tại:</span>
                  <span className="font-extrabold">{currentUser?.name || 'Chưa đăng nhập'} ({currentUser?.roleName || 'Khách'})</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('partner', 'login')}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-md cursor-pointer"
                  >
                    Đăng nhập Chủ cơ sở (Demo 1-chạm)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('partner', 'register')}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
                  >
                    Đăng ký cơ sở mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('explore')}
                    className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Quay lại Khám phá
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {currentTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              listings={listings}
              billingEnabled={billingEnabled}
              onToggleBilling={handleToggleBilling}
              onUpdateTier={handleUpdateTier}
              onApproveListing={handleApproveListing}
              onRejectListing={handleRejectListing}
              verifiedMembersCount={1240}
              disputes={disputes}
              onResolveDispute={handleResolveDispute}
              vouchers={vouchers}
              onToggleVoucher={handleToggleVoucher}
              rewardSettings={rewardSettings}
              onUpdateRewardPercent={handleUpdateRewardPercent}
              claimRequests={claimRequests}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 px-4">
              <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-2xl font-black">
                  🛡️
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Cổng Quản Trị Viên Thẩm Định
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Khu vực bảo mật dành cho Quản trị viên Tà Xùa Trip kiểm tra tọa độ, cấp huy hiệu xác thực Cấp 1-3, kiểm duyệt tranh chấp và phân bổ mã giảm giá.
                </p>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/80 inline-flex items-center gap-2 text-xs font-semibold text-rose-900">
                  <span>Tài khoản hiện tại:</span>
                  <span className="font-extrabold">{currentUser?.name || 'Chưa đăng nhập'} ({currentUser?.roleName || 'Khách'})</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('admin', 'login')}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-sm shadow-md cursor-pointer"
                  >
                    Đăng nhập Admin (Demo 1-chạm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('explore')}
                    className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Quay lại Khám phá
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Floating AI Assistant Widget in Bottom-Right Corner */}
      <div className="hidden lg:flex fixed bottom-5 right-5 z-30">
        <button
          type="button"
          onClick={() => setIsAiAdvisorOpen(true)}
          aria-label="Mở Trợ lý AI Tà Xùa Trip"
          className="min-h-[44px] bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-xl flex items-center gap-2 border border-white/15 transition-transform active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>✨ Trợ lý AI Tư vấn</span>
        </button>
      </div>

      {/* Global Modals */}
      {selectedListingDetail && (
        <ListingDetailModal
          listing={selectedListingDetail}
          reviews={reviews.filter((r) => r.listingId === selectedListingDetail.id)}
          userBookings={bookings.filter((b) => b.listingId === selectedListingDetail.id)}
          vouchers={vouchers}
          rewardSettings={rewardSettings}
          onClose={() => setSelectedListingDetail(null)}
          onBookSuccess={handleBookingSuccess}
          onAddReview={handleAddReview}
          onCompleteBooking={handleCompleteBooking}
          onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
          onClaimListing={(l) => setActiveClaimListing(l)}
        />
      )}

      {isBusModalOpen && (
        <BusBookingModal
          trips={trips}
          onClose={() => setIsBusModalOpen(false)}
          onBookSuccess={handleBookingSuccess}
        />
      )}

      {isSosModalOpen && <SosModal onClose={() => setIsSosModalOpen(false)} />}

      {isPointsModalOpen && (
        <PointsModal
          profile={userProfile}
          onClose={() => setIsPointsModalOpen(false)}
          onRedeemReward={handleRedeemReward}
        />
      )}

      {activeSuccessBooking && (
        <BookingSuccessModal
          booking={activeSuccessBooking}
          onClose={() => setActiveSuccessBooking(null)}
        />
      )}

      {/* Pro OTA Pack: Floating Compare Bar, Compare Modal, Wishlist Drawer & My Trips Modal */}
      <CompareFloatingBar
        compareListings={listings.filter((l) => compareIds.includes(l.id))}
        onRemoveCompare={handleToggleCompare}
        onClearCompare={() => setCompareIds([])}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
      />

      <CompareHomestaysModal
        isOpen={isCompareModalOpen}
        compareListings={listings.filter((l) => compareIds.includes(l.id))}
        onClose={() => setIsCompareModalOpen(false)}
        onRemoveCompare={handleToggleCompare}
        onSelectListing={(l) => setSelectedListingDetail(l)}
      />

      <WishlistDrawerModal
        isOpen={isWishlistModalOpen}
        savedListings={listings.filter((l) => userProfile.savedListings.includes(l.id))}
        onClose={() => setIsWishlistModalOpen(false)}
        onToggleSave={handleToggleSave}
        onSelectListing={(l) => setSelectedListingDetail(l)}
        onCompareAllSaved={() => {
          const savedHomestays = listings
            .filter((l) => userProfile.savedListings.includes(l.id) && l.category === 'homestay')
            .slice(0, 3)
            .map((l) => l.id);
          if (savedHomestays.length > 0) {
            setCompareIds(savedHomestays);
          }
          setIsWishlistModalOpen(false);
          setIsCompareModalOpen(true);
        }}
      />

      <MyTripsModal
        isOpen={isMyTripsModalOpen}
        bookings={bookings}
        listings={listings}
        onClose={() => setIsMyTripsModalOpen(false)}
        onSelectListingForReview={(l) => setSelectedListingDetail(l)}
        onSimulateCompleteBooking={handleCompleteBooking}
        onConfirmDepositPaid={(bookingId) => {
          handleConfirmBooking(bookingId);
          showToast('Đã ghi nhận chuyển khoản cọc VietQR! Đơn đặt đã chuyển sang Đã xác nhận.');
        }}
        onOpenDispute={(b) => setActiveDisputeBooking(b)}
        onOpenReviewModal={(b) => setActiveReviewBooking(b)}
      />

      {/* Direct Host Chat Modal */}
      {activeDirectChatListing && (
        <DirectChatModal
          listing={activeDirectChatListing}
          isOpen={true}
          onClose={() => setActiveDirectChatListing(null)}
          userProfile={userProfile}
          onRegisterMember={handleRegisterMember}
        />
      )}

      {/* Partner Claim Owner Modal */}
      {activeClaimListing && (
        <PartnerClaimModal
          listing={activeClaimListing}
          isOpen={true}
          onClose={() => setActiveClaimListing(null)}
          onSubmitClaim={handleSubmitClaim}
        />
      )}

      {/* Booking Dispute & Complaint Mediation Modal */}
      {activeDisputeBooking && (
        <DisputeModal
          booking={activeDisputeBooking}
          isOpen={true}
          onClose={() => setActiveDisputeBooking(null)}
          onSubmitDispute={handleSubmitDispute}
        />
      )}

      {/* Verified Stay Review Modal */}
      {activeReviewBooking && (
        <ReviewModal
          booking={activeReviewBooking}
          isOpen={true}
          onClose={() => setActiveReviewBooking(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {/* AI Travel Advisor & Quote Modal */}
      <AITravelAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        allListings={listings}
        vouchers={vouchers}
        onSelectListing={(listing: Listing) => {
          setSelectedListingDetail(listing);
          setIsAiAdvisorOpen(false);
        }}
        onBookListing={(listing: Listing) => {
          setSelectedListingDetail(listing);
          setIsAiAdvisorOpen(false);
        }}
      />

      {/* Multi-role Authentication & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalRole}
        initialMode={authModalMode}
      />

      {/* Footer matching https://taxuaslay1.vercel.app/ (with pb-24 on mobile for Fixed Bottom Nav clearance) */}
      <footer className="bg-white border-t border-slate-200/90 text-slate-600 pt-12 pb-24 lg:py-14 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#073161] text-white flex items-center justify-center">
                <Mountain className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-[0.1em] text-[#073161] uppercase">
                  TÀ XÙA TRIP
                </div>
                <div className="text-[11px] text-slate-500">Đi thật. Biết trước.</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Nền tảng du lịch địa phương giúp bạn biết rõ nơi ở, bằng chứng và điều cần lưu ý trước khi lên đường.
            </p>
            <p className="text-[11px] font-extrabold tracking-widest text-teal-700">
              THẬT · HIỂU · TRỌN VẸN
            </p>
          </div>

          <div>
            <h2 className="font-extrabold text-[#073161] uppercase tracking-wider mb-3 text-xs">
              DỊCH VỤ
            </h2>
            <ul className="space-y-2 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('stay')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Tìm chuyến đi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('stay')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Lưu trú
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('map')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Bản đồ tọa độ săn mây
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('bus')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Xe khách · Đón dọc tuyến
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('motorbike');
                    setCurrentTab('explore');
                  }}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Xe máy · cần xác nhận
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('weather')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Săn mây / Cloud View
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-extrabold text-[#073161] uppercase tracking-wider mb-3 text-xs">
              HỖ TRỢ
            </h2>
            <ul className="space-y-2 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => setIsSosModalOpen(true)}
                  className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  Cứu hộ Đèo Chẹn & Núi 24/7
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('itinerary')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Trợ lý AI Lịch trình Offline
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('community')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Cộng đồng ghép xe & review
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-extrabold text-[#073161] uppercase tracking-wider mb-3 text-xs">
              VỀ CHÚNG TÔI
            </h2>
            <ul className="space-y-2 text-slate-600 mb-4">
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentTab('verified')}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Phương pháp thẩm định
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('partner');
                    setCurrentTab('partner');
                  }}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Cổng Đối tác / Chủ cơ sở
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('admin');
                    setCurrentTab('admin');
                  }}
                  className="hover:text-[#073161] cursor-pointer"
                >
                  Quản trị thẩm định (Admin)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Tà Xùa Trip.</p>
          <p className="font-semibold text-[#073161]">Đi thật. Biết trước.</p>
        </div>
      </footer>
    </div>
  );
}
