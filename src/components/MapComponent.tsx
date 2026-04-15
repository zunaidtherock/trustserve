import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UserProfile } from '@/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/button';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  providers: UserProfile[];
  onSelectProvider: (provider: UserProfile) => void;
  userLocation?: { lat: number; lng: number };
}

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ providers, onSelectProvider, userLocation }) => {
  const defaultCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [51.505, -0.09];

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border-2 shadow-inner relative">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="font-bold">You are here</div>
            </Popup>
          </Marker>
        )}

        {providers.filter(p => p.latitude && p.longitude).map((provider) => (
          <Marker 
            key={provider.uid} 
            position={[provider.latitude!, provider.longitude!]}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {provider.photoURL ? (
                      <img src={provider.photoURL} alt={provider.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="font-bold">{provider.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground">{provider.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{provider.trustScore}/100 Trust</span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full text-xs h-8"
                  onClick={() => onSelectProvider(provider)}
                >
                  View Profile
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />}
      </MapContainer>
      
      {!userLocation && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-sm">
            <Navigation className="w-3 h-3 mr-1 animate-pulse" />
            Locating you...
          </Badge>
        </div>
      )}
    </div>
  );
};
