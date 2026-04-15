import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Layout } from './components/Layout';
import { ProviderCard } from './components/ProviderCard';
import { TrustScoreBreakdown } from './components/TrustScore';
import { ReviewList } from './components/ReviewList';
import { BookingModal } from './components/BookingModal';
import { ChatWindow } from './components/ChatWindow';
import { MapComponent } from './components/MapComponent';
import { RoleSelection } from './components/RoleSelection';
import { UserProfile, Review, Booking, Chat, UserRole } from './types';
import { db, auth } from './lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, limit, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet';
import { Skeleton } from './components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Textarea } from './components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Search, SlidersHorizontal, Map as MapIcon, Star, Shield, Zap, Award, TrendingUp, Users, AlertCircle, Sparkles, Send, Calendar as CalendarIcon, MessageSquare, MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { analyzeSentiment, detectFraud, smartSearch } from './lib/gemini';
import { handleFirestoreError, OperationType } from './lib/firebase';

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<UserProfile[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Check if user needs to select a role
  useEffect(() => {
    if (user && profile && !profile.role) {
      setShowRoleSelection(true);
    } else {
      setShowRoleSelection(false);
    }
  }, [user, profile]);

  // Fetch real providers from Firestore
  useEffect(() => {
    const providersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'provider'),
      limit(20)
    );

    const unsubscribe = onSnapshot(providersQuery, (snapshot) => {
      const realProviders = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      
      // Merge with mock data if needed, or just use real data
      if (realProviders.length > 0) {
        setProviders(realProviders);
      } else {
        // Fallback to mock data if no providers in DB yet
        const mockProviders: UserProfile[] = [
          {
            uid: 'p1',
            name: 'Alex Johnson',
            email: 'alex@example.com',
            role: 'provider',
            category: 'Plumber',
            location: 'Downtown',
            latitude: 12.9716,
            longitude: 77.5946,
            trustScore: 95,
            verificationStatus: 'verified',
            completedJobs: 150,
            responseTime: 15,
            badges: ['Top Rated', 'Fast Responder'],
            createdAt: new Date().toISOString(),
          },
          {
            uid: 'p2',
            name: 'Sarah Smith',
            email: 'sarah@example.com',
            role: 'provider',
            category: 'Tutor',
            location: 'Uptown',
            latitude: 12.9816,
            longitude: 77.6046,
            trustScore: 72,
            verificationStatus: 'verified',
            completedJobs: 45,
            responseTime: 45,
            badges: ['New'],
            createdAt: new Date().toISOString(),
          },
          {
            uid: 'p3',
            name: 'Mike Miller',
            email: 'mike@example.com',
            role: 'provider',
            category: 'Electrician',
            location: 'Suburbs',
            latitude: 12.9616,
            longitude: 77.5846,
            trustScore: 35,
            verificationStatus: 'none',
            completedJobs: 12,
            responseTime: 120,
            badges: [],
            createdAt: new Date().toISOString(),
          }
        ];
        setProviders(mockProviders);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  // Filter providers based on category and search
  useEffect(() => {
    let result = [...providers];
    
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery && !isSearchingAI) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProviders(result);
  }, [providers, selectedCategory, searchQuery, isSearchingAI]);

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    // Listen to bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where(profile?.role === 'provider' ? 'providerId' : 'customerId', '==', user.uid)
      // Temporarily removing orderBy to avoid index issues if they occur
      // orderBy('createdAt', 'desc')
    );
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      // Sort manually if needed, or just set
      setBookings(fetchedBookings.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    // Listen to chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
      // Temporarily removing orderBy to avoid index issues
      // orderBy('updatedAt', 'desc')
    );
    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chat[];
      setChats(fetchedChats.sort((a, b) => {
        const dateA = a.updatedAt?.seconds || 0;
        const dateB = b.updatedAt?.seconds || 0;
        return dateB - dateA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => {
      unsubscribeBookings();
      unsubscribeChats();
    };
  }, [user, profile]);

  // Fetch reviews for selected provider
  useEffect(() => {
    if (!selectedProvider) return;
    const reviewsQuery = query(collection(db, 'reviews'), where('providerId', '==', selectedProvider.uid));
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[]);
    });
    return () => unsubscribeReviews();
  }, [selectedProvider]);

  const [isLocating, setIsLocating] = useState(false);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        // In a real app, we'd reverse geocode this. For now, we'll use coordinates or a mock city.
        const locationStr = `Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        setSearchQuery(locationStr);
        setIsLocating(false);
        toast.success("Location updated!");
        
        // If user is logged in, update their profile too
        if (user) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              location: locationStr,
              latitude,
              longitude
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error("Unable to retrieve your location");
      }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingAI(true);
    const results = await smartSearch(searchQuery, providers);
    setAiRecommendations(results);
    setIsSearchingAI(false);
    toast.success("AI found the best matches for you!");
  };

  const handleBooking = async (bookingData: any) => {
    if (!user) {
      toast.error("Please sign in to book a service");
      return;
    }
    try {
      console.log("Creating booking with data:", bookingData);
      await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        customerId: user.uid,
        customerName: user.displayName || profile?.name || 'Anonymous Customer',
        status: 'requested',
        price: 1200, // Default price for demo
        currency: 'INR',
        createdAt: serverTimestamp(),
      });
      toast.success("Booking request sent!");
    } catch (error) {
      console.error("Booking submission error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
    }
  };

  const handleAddReview = async (rating: number, text: string) => {
    if (!user || !selectedProvider) return;

    try {
      // AI Fraud Detection
      const fraudCheck = await detectFraud(text, reviews.map(r => r.text));
      
      // AI Sentiment Analysis
      const sentiment = await analyzeSentiment(text);

      const reviewData = {
        providerId: selectedProvider.uid,
        customerId: user.uid,
        customerName: user.displayName,
        customerPhoto: user.photoURL,
        rating,
        text,
        sentiment,
        helpfulCount: 0,
        reported: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update provider's trust score (Real logic)
      const providerRef = doc(db, 'users', selectedProvider.uid);
      const newTrustScore = Math.min(100, Math.max(0, 
        selectedProvider.trustScore + (rating >= 4 ? 2 : -5)
      ));
      
      await updateDoc(providerRef, {
        trustScore: newTrustScore,
        completedJobs: (selectedProvider.completedJobs || 0) + 1
      });

      if (fraudCheck.isSuspicious) {
        toast.warning("Suspicious activity detected in your review. It will be reviewed by admins.");
        await addDoc(collection(db, 'fraudAlerts'), {
          targetId: selectedProvider.uid,
          type: 'bot_pattern',
          reason: fraudCheck.reason,
          severity: 'medium',
          createdAt: serverTimestamp(),
        });
      } else {
        toast.success("Review posted successfully!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reviews');
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        helpfulCount: (reviews.find(r => r.id === reviewId)?.helpfulCount || 0) + 1
      });
      toast.success("Marked as helpful!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        reported: true
      });
      toast.info("Review reported for moderation.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const startChat = async (recipientId: string) => {
    if (!user) return;
    
    // Check if chat exists
    const existingChat = chats.find(c => c.participants.includes(recipientId));
    if (existingChat) {
      setActiveChat(existingChat.id);
      setActiveTab('messages');
      return;
    }

    try {
      const newChat = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, recipientId],
        updatedAt: serverTimestamp(),
      });
      setActiveChat(newChat.id);
      setActiveTab('messages');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chats');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading TrustFinder...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Toaster position="top-center" />
        
        {showRoleSelection && user && (
          <RoleSelection uid={user.uid} onRoleSelected={() => setShowRoleSelection(false)} />
        )}
        
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="relative rounded-[2.5rem] overflow-hidden bg-indigo-900 text-white p-8 md:p-16">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                  <Shield className="w-full h-full" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <Badge className="bg-indigo-500/30 text-indigo-200 border-none mb-6 px-4 py-1.5 rounded-full">
                    ✨ AI-Powered Trust Marketplace
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                    Find services you can <span className="text-indigo-400">actually trust.</span>
                  </h1>
                  <p className="text-lg text-indigo-100/80 mb-10 leading-relaxed">
                    Our dynamic trust scoring system analyzes thousands of data points to ensure you only connect with the most reliable local professionals.
                  </p>
                  
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input 
                        placeholder="Try 'Find a reliable plumber near me'..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-12 rounded-2xl border-none bg-white text-slate-900 shadow-xl focus:ring-2 focus:ring-indigo-400"
                      />
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUseLocation}
                        disabled={isLocating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 rounded-xl h-10 w-10 p-0"
                      >
                        <MapPin className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
                    <Button type="submit" disabled={isSearchingAI} className="h-14 px-8 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold shadow-xl transition-all hover:scale-105 gap-2">
                      {isSearchingAI ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      AI Search
                    </Button>
                  </form>
                </div>
              </div>

              {/* Map Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <MapIcon className="w-6 h-6 text-indigo-600" />
                    Nearby Service Workers
                  </h2>
                  <Button variant="outline" size="sm" onClick={handleUseLocation} className="rounded-full">
                    <Navigation className="w-4 h-4 mr-2" />
                    Update My Location
                  </Button>
                </div>
                <MapComponent 
                  providers={filteredProviders} 
                  onSelectProvider={setSelectedProvider}
                  userLocation={userLocation}
                />
              </div>

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  AI Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiRecommendations.map((rec) => {
                    const provider = providers.find(p => p.uid === rec.providerId);
                    if (!provider) return null;
                    return (
                      <div key={rec.providerId} className="relative group">
                        <div className="absolute -top-2 -right-2 z-10 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                          AI MATCH
                        </div>
                        <ProviderCard provider={provider} onClick={() => setSelectedProvider(provider)} />
                        <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <p className="text-xs text-indigo-900 italic">"{rec.reason}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['All', 'Plumber', 'Electrician', 'Tutor', 'Cleaner', 'Gardener'].map((cat) => (
                  <Button 
                    key={cat} 
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full ${selectedCategory === cat ? 'bg-indigo-600' : 'border-slate-200 hover:border-indigo-600 hover:text-indigo-600'}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" className="gap-2 text-slate-600">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </Button>
            </div>

            {/* Provider List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProviders.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No providers found matching your criteria.</p>
                </div>
              ) : (
                filteredProviders.map((provider) => (
                  <ProviderCard 
                    key={provider.uid} 
                    provider={provider} 
                    onClick={() => setSelectedProvider(provider)}
                    isSuspicious={provider.trustScore < 40}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Provider Profile View */}
        {selectedProvider && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[60] bg-white overflow-y-auto"
          >
            <div className="max-w-5xl mx-auto px-4 py-12">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedProvider(null)}
                className="mb-8 rounded-full hover:bg-slate-100"
              >
                ← Back to Explore
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Info */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <Avatar className="w-32 h-32 border-4 border-slate-100 shadow-xl">
                      <AvatarImage src={selectedProvider.photoURL} />
                      <AvatarFallback className="text-4xl">{selectedProvider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-4xl font-black text-slate-900">{selectedProvider.name}</h2>
                        {selectedProvider.verificationStatus === 'verified' && (
                          <Badge className="bg-indigo-100 text-indigo-600 border-none px-3 py-1 rounded-full gap-1">
                            <Shield className="w-4 h-4" /> Verified Pro
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg text-slate-500">{selectedProvider.category} • {selectedProvider.location}</p>
                      <div className="flex flex-wrap gap-3">
                        {selectedProvider.badges.map(badge => (
                          <Badge key={badge} variant="secondary" className="bg-slate-100 text-slate-600 rounded-full px-4 py-1">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-8">
                    <h3 className="text-xl font-bold mb-4">About</h3>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedProvider.bio || "Professional service provider dedicated to high-quality work and customer satisfaction. With years of experience in the industry, I ensure every job is completed to the highest standards."}
                    </p>
                  </div>

                  <ReviewList 
                    reviews={reviews} 
                    onLike={handleLikeReview} 
                    onReport={handleReportReview} 
                  />
                  
                  {/* Add Review Section */}
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-4">
                    <h3 className="text-xl font-bold">Leave a Review</h3>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} className="text-amber-400 hover:scale-110 transition-transform">
                          <Star className="w-8 h-8" />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-400 min-h-[120px]"
                      placeholder="Share your experience with this provider..."
                    />
                    <Button 
                      onClick={() => handleAddReview(5, "Excellent service, very professional and punctual!")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8"
                    >
                      Post Review
                    </Button>
                  </div>
                </div>

                {/* Right Column: Actions & Trust */}
                <div className="space-y-6">
                  <div className="sticky top-24 space-y-6">
                    <TrustScoreBreakdown score={selectedProvider.trustScore} />
                    
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl space-y-4">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-500 font-medium">Service Rate</span>
                        <span className="text-2xl font-black text-slate-900">₹1,200<span className="text-sm font-normal text-slate-400">/hr</span></span>
                      </div>
                      <Button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200"
                      >
                        Book Now
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => startChat(selectedProvider.uid)}
                        className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold"
                      >
                        Message
                      </Button>
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <p className="text-xs text-amber-900 font-medium">Responds in less than 15 mins</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-slate-900">{selectedProvider.completedJobs}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jobs Done</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-slate-900">4.9</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div 
            key="bookings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-black text-slate-900">My Bookings</h2>
            <div className="grid grid-cols-1 gap-4">
              {bookings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                  <CalendarIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400">No bookings yet. Start exploring services!</p>
                </div>
              ) : (
                bookings.map(booking => (
                  <div key={booking.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-4 rounded-xl">
                        <CalendarIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{booking.providerName}</h4>
                        <p className="text-sm text-slate-500">{booking.date} at {booking.time}</p>
                        <p className="text-xs font-bold text-indigo-600 mt-1">₹{booking.price || '1,200'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge className={`px-4 py-1.5 rounded-full border-none ${
                        booking.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 
                        booking.status === 'requested' ? 'bg-amber-100 text-amber-600' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {booking.status.toUpperCase()}
                      </Badge>
                      <Button variant="ghost" className="text-indigo-600 font-bold">Details</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div 
            key="messages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]"
          >
            <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-2xl font-black text-slate-900">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chats.map(chat => (
                  <button 
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                      activeChat === chat.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">Chat with Provider</h4>
                      <p className="text-xs text-slate-400 truncate">{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              {activeChat ? (
                <ChatWindow 
                  chatId={activeChat} 
                  recipientName="Service Provider" 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                  <p className="text-slate-400">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'dashboard' && profile && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-900">Dashboard</h2>
                <p className="text-slate-500">Welcome back, {profile.name}</p>
              </div>
              <Badge className="bg-indigo-600 text-white px-4 py-1 rounded-full uppercase text-[10px] font-bold tracking-widest">
                {profile.role} Account
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
                <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{profile.trustScore}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Trust Score</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
                <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{profile.completedJobs}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jobs Completed</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
                <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{profile.badges.length}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Badges Earned</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
                <div className="bg-rose-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">4.8</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-xl font-bold">Profile Details</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Display Name</label>
                    <Input defaultValue={profile.name} className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                    <Input defaultValue={profile.location} className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Bio</label>
                    <textarea className="w-full p-4 rounded-xl bg-slate-50 border-none min-h-[100px]" defaultValue={profile.bio} />
                  </div>
                  <Button className="bg-indigo-600 text-white rounded-full px-8">Save Changes</Button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-xl font-bold">Trust Score Trends</h3>
                <div className="h-64 flex items-end gap-2">
                  {[40, 45, 42, 50, 55, 52, 60, 65, 62, 70, 75, 80].map((val, i) => (
                    <div key={i} className="flex-1 bg-indigo-100 rounded-t-lg relative group" style={{ height: `${val}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Jan</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={selectedProvider}
        onConfirm={handleBooking}
      />
      </Layout>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
