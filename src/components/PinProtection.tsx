'use client';
import { useState, useEffect } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

interface PinProtectionProps {
    children: React.ReactNode;
}

export const PinProtection = ({ children }: PinProtectionProps) => {
    const { kioskPin } = useStore();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [pin, setPin] = useState('');
    const router = useRouter();

    useEffect(() => {
        // If no PIN is configured, grant access immediately
        if (!kioskPin) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
        }

        // Check if session is still valid (10 minutes)
        const sessionTime = localStorage.getItem('stockpro_pin_session');
        if (sessionTime) {
            const timeDiff = Date.now() - parseInt(sessionTime, 10);
            if (timeDiff < 10 * 60 * 1000) {
                setIsAuthenticated(true);
            }
        }
        setIsChecking(false);
    }, [kioskPin]);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === kioskPin) {
            localStorage.setItem('stockpro_pin_session', Date.now().toString());
            setIsAuthenticated(true);
            toast.success("Accès autorisé");
        } else {
            toast.error("Code PIN incorrect");
            setPin('');
        }
    };

    if (isChecking) return null;

    if (!isAuthenticated && !!kioskPin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold">Zone Protégée</h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Veuillez entrer le code PIN propriétaire pour accéder à cette page.
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Code PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="text-center text-xl tracking-[0.5em] input-modern"
                            maxLength={6}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour
                            </Button>
                            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                                Déverrouiller
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
