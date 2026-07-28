/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ur';

export type AuthState = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD' | 'LOGGED_IN';

export type NavigationTab = 'home' | 'feed' | 'chat' | 'profile' | 'pages' | 'groups' | 'videos';

export type QuickActionType = 'jobs' | 'property' | 'buy-sell' | 'business';

export type Gender = 'Male' | 'Female' | 'Prefer not to say' | 'Unknown';

export interface User {
  id?: string;
  fullName: string;
  email?: string;
  area: string;
  mobileNumber?: string;
  username?: string;
  bio?: string;
  joinDate?: string;
  reputationScore?: number;
  verified?: boolean;
  profilePhoto?: string;
  coverPhoto?: string;
  contactNumber?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  badges?: string[];
  gender?: Gender;
  dateOfBirth?: string;
  role?: 'super_admin' | 'moderator' | 'poll_manager' | 'member';

  cityId?: string;
  areaId?: string;
  latitude?: number;
  longitude?: number;

  cityName?: string;
  followersCount?: number;
  followingCount?: number;
  privacyType?: 'public' | 'private';
  messagePrivacy?: 'everyone' | 'followers' | 'nobody';
  storyPrivacy?: 'everyone' | 'followers' | 'close_friends' | 'only_me';
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'requested' | 'following';
  created_at: string;
  profiles?: User; // used when joining to get user details
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Country {
  id: string;
  name: string;
  code?: string;
}

export interface Province {
  id: string;
  name: string;

}

export interface City {
  id: string;
  name: string;
  provinceId: string;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  latitude?: number;
  longitude?: number;
}

export interface Sticker {
  id: string;
  type: 'emoji' | 'gif' | 'location' | 'mention' | 'hashtag' | 'poll' | 'question' | 'countdown';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  content: any; // Dynamic content based on type
}

export interface Story {
  id: string;
  author: string; // Used mostly in UI mapping
  avatar: string; // Used mostly in UI mapping
  time: string;   // Used mostly in UI mapping
  viewed: boolean;
  type?: 'photo' | 'text' | 'video' | 'gif' | 'music';
  
  // Legacy / Simple properties
  image?: string; 
  videoUrl?: string;
  video_url?: string;
  text?: string;
  bgColor?: string;
  createdAt?: number;
  userId?: string;
  
  // Enhanced properties (from DB)
  mediaUrls?: string[];
  bgMusicUrl?: string;
  musicVolume?: number;
  privacy?: 'public' | 'friends' | 'followers' | 'only_me' | 'custom';
  customAudienceIds?: string[];
  expiresAt?: string;
  isArchived?: boolean;
  stickers?: Sticker[];
  textStyles?: any;
  sharedEntityType?: string;
  sharedEntityId?: string;
  sharedOriginalEntity?: any;
  
  // Analytics populated by joins
  viewsCount?: number;
  reactionsCount?: number;
  repliesCount?: number;

  // Story Ads integration
  isAd?: boolean;
  ctaLink?: string;
  ctaText?: string;
  ctaType?: 'Website' | 'WhatsApp' | 'Phone' | 'Email' | 'Internal';
  ctaValue?: string;
  duration?: number;
}

export interface StoryView {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
}

export interface StoryReaction {
  id: string;
  story_id: string;
  reactor_id: string;
  reaction_type: 'like' | 'haha' | 'wow' | 'sad' | 'angry' | 'love';
  created_at: string;
}

export interface StoryReply {
  id: string;
  story_id: string;
  sender_id: string;
  reply_type: 'text' | 'emoji' | 'image' | 'voice';
  content: string;
  created_at: string;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image?: string;
  created_at: string;
  stories?: Story[]; // joined data
}

export interface StoryAd {
  id: string;
  admin_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  cta_link?: string;
  cta_text?: string;
  duration: number; // minimum viewing duration before skip
  impressions: number;
  clicks: number;
  active: boolean;
  target_audience?: any;
  frequency_cap?: number;
}

export interface UserStorySettings {
  user_id: string;
  auto_save_archive: boolean;
  allow_replies: boolean;
  allow_sharing: boolean;
  default_privacy: 'public' | 'friends' | 'followers' | 'only_me' | 'custom';
  quality: 'Low' | 'Medium' | 'High';
}

export interface StoryModeration {
  id: string;
  story_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'removed';
  created_at: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  userId?: string;
}

/**
 * Representation of a mention within text content.
 */
export interface Mention {
  /** Type of the mention */
  type: 'user' | 'page' | 'group';
  /** Unique identifier */
  id: string;
  /** Display name */
  display_name: string;
  /** Username for user mentions */
  username?: string;
  /** Slug for page or group mentions */
  slug?: string;
}

export interface Post {
  id: string;
  author: string;
  avatar: string;
  time: string;
  area: string;
  content: string;
  image?: string;
  videoUrl?: string;
  images?: string[];
  likes: number;
  commentsCount: number;
  liked?: boolean;
  comments?: Comment[];
  postTag?: 'lost' | 'found' | null;
  contactDetails?: string;
  itemLocation?: string;
  userId?: string;
  areaId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  groupId?: string;
  sharesCount?: number;
  sharedEntityType?: 'post' | 'job' | 'property' | 'event' | 'marketplace' | 'service' | 'poll' | 'alert';
  sharedEntityId?: string;
  sharedCaption?: string;
  sharedOriginalEntity?: any;
  status?: 'active' | 'hidden' | 'deleted';
  reportCount?: number;
  pinned?: boolean;
}

export interface JobItem {
  id: string;
  title: string;
  sharesCount?: number;
  company: string;
  salary: string;
  type: string;
  postedBy: string;
  contact: string;
  area?: string;
  postedTime?: string;
  description?: string;
  image?: string;
  category?: string;
  requirements?: string;
  deadline?: string;
  reported?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  contactNumber: string;
  resumeName?: string;
  message?: string;
  appliedDate: string;
  status: 'Applied' | 'Reviewing' | 'Accepted' | 'Rejected';
}

export interface PropertyItem {
  id: string;
  title: string;
  sharesCount?: number;
  price: string;
  type: string; // 'House' | 'Shop' | 'Plot' | 'Apartment'
  purpose: 'Rent' | 'Sale';
  location: string;
  contact: string;
  area: string;
  rooms?: string;
  floor?: string;
  description?: string;
  images?: string[];
  ownerName?: string;
  featured?: boolean;
  reported?: boolean;
  unavailable?: boolean;
}

export interface BuySellItem {
  id: string;
  title: string;
  category: string;
  price: string;
  condition?: string;
  contact: string;
  image?: string;
  images?: string[];
  description?: string;
  area: string;
  sellerName: string;
  postedTime: string;
}

export interface BusinessItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  address: string;
  contact: string;
  image?: string;
  coverImage?: string;
  logo?: string;
  description?: string;
  shortDescription?: string;
  featured?: boolean;
  posts?: { id: string; content: string; date: string; image?: string }[];
  reviews?: { id: string; user: string; rating: number; text: string; date: string }[];
  area?: string;
  openingHours?: string;
  ownerName?: string;
  ownerAvatar?: string;
  ownerBio?: string;
  images?: string[];
  reported?: boolean;
  allowMessages?: boolean;
}

export interface ServiceReview {
  id: string;
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface ServiceItem {
  id: string;
  title?: string;
  sharesCount?: number;
  name: string;
  category: string;
  experience: string;
  area: string;
  rating: number;
  availability: 'Available' | 'Busy' | 'Closed' | 'Vacation' | '24/7 Emergency';
  contact: string;
  description: string;
  image?: string;
  reported?: boolean;
  whatsAppNumber?: string;
  address?: string;
  workingHours?: string;
  galleryImages?: string[];
  pricing?: string;
  email?: string;
  emergencyService?: boolean;
  homeVisit?: boolean;
  yearsOfExperience?: string;
  startingPrice?: string;
  verified?: boolean;
  verificationLevel?: 'Pending' | 'Verified' | 'Featured';
  reviewCount?: number;
  dateAdded?: string;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Hidden' | 'Archived' | 'Deleted';
  featured?: boolean;
  analyticsViews?: number;
  analyticsPhoneClicks?: number;
  analyticsWhatsAppClicks?: number;
  analyticsShareCount?: number;
  analyticsFavorites?: number;
  reviews?: ServiceReview[];
}



// Extend AlertItem with optional status
export interface AlertItem {
  id: string;
  title: string;
  category: string;
  description: string;
  area: string;
  postedTime: string;
  severity: 'Urgent' | 'Medium' | 'Information';
  priority?: 'Critical' | 'High' | 'Normal' | 'Medium' | 'Low' | string;
  confirmationsCount: number;
  postedBy: string;
  image?: string;
  contact?: string;
  relatedUpdates?: string[];
  reported?: boolean;
  expiryTime?: string;
  created_at?: string;
  latitude?: number;
  longitude?: number;
  updatedTime?: string;
  attachments?: string[];
  visibility?: 'Public' | 'Neighbors';
  status?: 'Active' | 'Expired' | 'Archived' | string;
}


export interface EventAttendee {
  name: string;
  contact: string;
  date: string;
}

export interface EventItem {
  id: string;
  title: string;
  sharesCount?: number;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  area: string;
  description: string;
  coverImage: string;
  organizerName: string;
  contactNumber: string;
  interestedCount: number;
  ticketPrice?: string;
  maxAttendees?: number;
  galleryImages?: string[];
  venue?: string;
  googleMap?: string;
  registrationDeadline?: string;
  availableSeats?: number;
  status?: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
  attendees?: EventAttendee[];
  featured?: boolean;
  pinned?: boolean;
  created_at?: string;
  reported?: boolean;
}

export interface DealItem {
  id: string;
  title: string;
  category: 'Food' | 'Shopping' | 'Services' | 'Education' | 'Health' | 'Electronics' | 'Fashion' | 'Other' | string;
  businessName: string;
  description: string;
  area: string;
  discountText: string;
  expiryDate: string; // YYYY-MM-DD
  images: string[];
  contact: string;
  terms?: string;
  reported?: boolean;
}

export interface Notification {
  id: string;
  type: 'post' | 'comment' | 'reply' | 'like' | 'follower' | 'chat' | 'event' | 'business' | 'job' | 'marketplace' | 'service' | 'property' | 'deal' | 'alert' | 'system' | string;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  relatedId?: string;
  relatedModule?: string;
  senderName?: string;
  senderAvatar?: string;
  senderId?: string;
  createdAt?: string;
}

export interface NotificationSettings {
  categories: {
    community: boolean;
    chat: boolean;
    events: boolean;
    jobs: boolean;
    businesses: boolean;
    marketplace: boolean;
    services: boolean;
    property: boolean;
    deals: boolean;
    alerts: boolean;
    followers: boolean;
    system: boolean;
  };
  channels: {
    push: boolean;
    inApp: boolean;
    sound: boolean;
    vibration: boolean;
  };
}export interface GroupPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  pinned?: boolean;
}

export interface GroupItem {
  id: string;
  name: string;
  category: string;
  area: string;
  description: string;
  coverImage: string;
  privacy: 'Public' | 'Private';
  memberCount: number;
  rules?: string[];
  admins: string[];
  creator: string;
  members: string[];
  requests?: string[];
  recentPosts?: GroupPost[];
  reported?: boolean;
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  date: string; // ISO date string
  location: string;
  area: string;
  contactDetails: string;
  reward?: string;
  status: 'Open' | 'Claimed' | 'Closed';
  reported?: boolean;
  createdBy: string;
  createdAt: string;
}

export interface LostFoundReport {
  id: string;
  itemId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}

export interface LostFoundFavorite {
  userId: string;
  itemId: string;
  createdAt: string;
}

export interface LostFoundClaim {
  id: string;
  itemId: string;
  claimantId: string;
  message: string;
  contactInfo: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

// ==========================================
// RENEWED REAL-TIME MARKETPLACE TYPES
// ==========================================

export interface MarketplaceItem {
  id: string;
  title: string;
  sharesCount?: number;
  description: string;
  price?: number;
  priceText?: string; // e.g. "Negotiable" or "Call for price"
  category: string;
  condition: 'New' | 'Used' | 'Fair';
  location: string;
  posted_by: string; // UUID of profile
  posted_at?: string;
  is_sold?: boolean;
  views?: number;
  
  // Optional relations
  images?: ItemImage[];
  chats_count?: number;
  seller_profile?: {
    full_name: string;
    profile_photo?: string;
    verified?: boolean;
  };
}

export interface ItemImage {
  id: string;
  item_id: string;
  path: string;
  order: number;
}

export interface ItemChat {
  id: string;
  item_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  sent_at?: string;
}

export interface ItemFavorite {
  user_id: string;
  item_id: string;
  created_at?: string;
}

export interface ItemReport {
  id?: string;
  item_id: string;
  reporter_id: string;
  reason: string;
  created_at?: string;
}

export interface AdItem {
  id: string;
  title: string;
  description: string;
  advertiser_name: string;
  advertiser_phone: string;
  advertiser_email: string;
  advertiser_business_id?: string;
  banner_url?: string;
  video_url?: string;
  format?: 'Feed' | 'Banner' | 'Popup';
  display_frequency?: number;
  placement: 'Home Feed' | 'Community Feed' | 'Jobs' | 'Businesses' | 'Marketplace' | 'Property Listings' | 'Technical Services' | 'Deals & Offers' | 'Local Alerts' | 'Public Groups' | 'Polls & Opinions' | 'Banner Carousel' | 'Splash Banner';
  category: 'General' | 'Business' | 'Job' | 'Property' | 'Marketplace' | 'Event' | 'Service' | 'Promotion';
  cta_type: 'Open Business' | 'WhatsApp' | 'Phone Call' | 'Website' | 'External Link' | 'Marketplace Item' | 'Property Listing' | 'Job Listing';
  cta_link?: string;
  target_audience?: string;
  target_location?: string;
  start_date: string;
  end_date: string;
  priority: 'Low' | 'Normal' | 'High' | 'Premium';
  status: 'Draft' | 'Active' | 'Paused' | 'Scheduled' | 'Expired' | 'Archived';
  amount?: number;
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  invoice_number?: string;
  impressions: number;
  views?: number;
  clicks?: number;
  conversions?: number;
  ctr?: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string; // soft delete support
  images?: string[]; // Multiple images support
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number;
  created_at?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image?: string;
  options: PollOption[] | any; // Any allows backward compatible JSON array as well
  anonymous: boolean;
  allow_option_change: boolean;
  allow_comments: boolean;
  show_live_results: boolean;
  start_date: string;
  end_date: string;
  publish_status: 'Published' | 'Scheduled' | 'Draft' | 'Active' | 'Ending Soon' | 'Closed' | 'Archived';
  featured: boolean;
  priority: 'Low' | 'Normal' | 'High' | 'Premium';
  total_votes: number;
  views_count?: number;
  shares_count?: number;
  created_by?: string;
  created_at?: string;
}

export interface PollVote {
  id?: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  gender?: Gender;
  date_of_birth_snapshot?: string;
  area?: string;
  location_details?: {
    street?: string;
    block?: string;
    mohalla?: string;
    sector?: string;
    colony?: string;
  };
  device?: 'Desktop' | 'Android' | 'iPhone' | 'Tablet' | 'Browser';
  created_at?: string;
}

export interface PollComment {
  id: string;
  poll_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  parent_id?: string | null;
  likes_count: number;
  reported: boolean;
  pinned: boolean;
  hidden: boolean;
  created_at: string;
  replies?: PollComment[];
}

export interface PollCommentLike {
  user_id: string;
  comment_id: string;
}

export interface PollCommentReport {
  id?: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  created_at?: string;
}

export interface PollView {
  id?: string;
  poll_id: string;
  user_id?: string;
  device?: string;
  created_at?: string;
}

export interface PollShare {
  id?: string;
  poll_id: string;
  user_id?: string;
  platform?: string;
  created_at?: string;
}



// ==========================================
// PAGES SYSTEM TYPES
// ==========================================

export type PageRole = 'Follower' | 'Admin' | 'Editor' | 'Moderator' | 'Owner';
export type PageVerificationStatus = 'None' | 'Pending' | 'Approved' | 'Rejected';
export type PageVisibility = 'Public' | 'Unlisted';

export interface Page {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  cover_url?: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  location?: string;
  business_hours?: Record<string, string>;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  verification_status: PageVerificationStatus;
  visibility: PageVisibility;
  followers_count: number;
  created_at: string;
  updated_at?: string;
  allow_messages?: boolean;
  allow_reviews?: boolean;
  visibility?: string;
  is_private?: boolean;
}

export interface PageFollower {
  id: string;
  page_id: string;
  user_id: string;
  role: PageRole;
  created_at: string;
}

export interface PagePost {
  id: string;
  page_id: string;
  author_id?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'poll' | 'event' | 'link';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at?: string;
}

export interface PageReport {
  id: string;
  page_id: string;
  reporter_id?: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
  created_at: string;
}

// ==========================================
// GROUPS SYSTEM TYPES
// ==========================================

export type GroupRole = 'Member' | 'Admin' | 'Moderator' | 'Owner';
export type GroupVisibility = 'Public' | 'Private' | 'Hidden';
export type GroupMemberStatus = 'Approved' | 'Pending' | 'Blocked' | 'Muted';

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  cover_url?: string;
  description?: string;
  rules?: string;
  category: string;
  tags?: string[];
  visibility: GroupVisibility;
  members_count: number;
  created_at: string;
  updated_at?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  status: GroupMemberStatus;
  created_at: string;
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'poll' | 'event' | 'file';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface GroupReport {
  id: string;
  group_id: string;
  reporter_id?: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
  created_at: string;
}
