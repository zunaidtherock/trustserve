import React from 'react';
import { UserProfile } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { TrustScore } from './TrustScore';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, MapPin, CheckCircle2, Zap, Award, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ProviderCardProps {
  provider: UserProfile;
  onClick: () => void;
  isSuspicious?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick, isSuspicious }) => {
  return (
    <Card 
      className={`group overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-slate-200 ${isSuspicious ? 'ring-2 ring-rose-500/20' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-0 relative">
        <img 
          src={`https://picsum.photos/seed/${provider.uid}/400/200`} 
          alt={provider.category}
          className="w-full h-32 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {provider.verificationStatus === 'verified' && (
            <Badge className="bg-white/90 backdrop-blur text-indigo-600 hover:bg-white border-none shadow-sm gap-1">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </Badge>
          )}
          {isSuspicious && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" /> Suspicious
            </Badge>
          )}
        </div>
        <div className="absolute -bottom-6 left-4">
          <Avatar className="w-12 h-12 border-4 border-white shadow-md">
            <AvatarImage src={provider.photoURL} />
            <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent className="pt-8 pb-4 px-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{provider.name}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {provider.location || 'Remote'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold">
            <Star className="w-3 h-3 fill-current" />
            <span>4.8</span>
          </div>
        </div>
        
        <div className="mb-4">
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">
            {provider.category || 'General Service'}
          </Badge>
        </div>

        <TrustScore score={provider.trustScore} size="sm" />
      </CardContent>
      <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <div className="flex gap-1">
          {provider.badges.slice(0, 2).map((badge) => (
            <div key={badge} title={badge} className="p-1 bg-white rounded-md border border-slate-200 text-slate-400">
              {badge === 'Top Rated' && <Award className="w-4 h-4 text-indigo-500" />}
              {badge === 'Fast Responder' && <Zap className="w-4 h-4 text-amber-500" />}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50">
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
};
