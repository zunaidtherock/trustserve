import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User, Briefcase, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { UserRole } from '@/types';
import { toast } from 'sonner';

interface RoleSelectionProps {
  uid: string;
  onRoleSelected: (role: UserRole) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ uid, onRoleSelected }) => {
  const selectRole = async (role: UserRole) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { role });
      onRoleSelected(role);
      toast.success(`Welcome! You are now registered as a ${role}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Choose Your Path</CardTitle>
            <CardDescription className="text-lg">
              How would you like to use the platform?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
            <motion.div whileHover={{ y: -5 }} className="h-full">
              <Button
                variant="outline"
                className="w-full h-full flex flex-col items-center gap-4 p-8 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => selectRole('customer')}
              >
                <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                  <User size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">I am a Customer</h3>
                  <p className="text-sm text-muted-foreground">
                    I want to find and book reliable service providers in my area.
                  </p>
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="h-full">
              <Button
                variant="outline"
                className="w-full h-full flex flex-col items-center gap-4 p-8 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => selectRole('provider')}
              >
                <div className="p-4 rounded-full bg-green-100 text-green-600">
                  <Briefcase size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">I am a Service Worker</h3>
                  <p className="text-sm text-muted-foreground">
                    I want to offer my services and build my trust score.
                  </p>
                </div>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
