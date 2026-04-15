import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarIcon, Clock, Info } from 'lucide-react';
import { UserProfile } from '@/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: UserProfile | null;
  onConfirm: (bookingData: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, provider, onConfirm }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  if (!provider) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      date,
      time,
      description,
      providerId: provider.uid,
      providerName: provider.name,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Book {provider.name}</DialogTitle>
          <DialogDescription>
            Schedule a service with this verified provider.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" /> Select Date
            </label>
            <Input 
              type="date" 
              required 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Select Time
            </label>
            <Input 
              type="time" 
              required 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" /> Job Description
            </label>
            <Textarea 
              placeholder="Describe what you need help with..." 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-indigo-500 min-h-[100px]"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8">
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
