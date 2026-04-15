export type UserRole = 'customer' | 'provider' | 'admin';
export type VerificationStatus = 'none' | 'pending' | 'verified';
export type BookingStatus = 'requested' | 'accepted' | 'completed' | 'cancelled';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type FraudType = 'duplicate_review' | 'rating_spike' | 'bot_pattern';
export type Severity = 'low' | 'medium' | 'high';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  bio?: string;
  trustScore: number;
  verificationStatus: VerificationStatus;
  completedJobs: number;
  responseTime: number;
  badges: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerPhoto?: string;
  rating: number;
  text: string;
  images: string[];
  helpfulCount: number;
  reported: boolean;
  sentiment: Sentiment;
  summary?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  providerName: string;
  customerName: string;
  date: string;
  time: string;
  description: string;
  status: BookingStatus;
  price: number;
  currency: string;
  createdAt: any; // Can be string or Timestamp
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  image?: string;
  createdAt: any; // Can be string or Timestamp
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any; // Can be string or Timestamp
}

export interface FraudAlert {
  id: string;
  targetId: string;
  type: FraudType;
  reason: string;
  severity: Severity;
  createdAt: string;
}
