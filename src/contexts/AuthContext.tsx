"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'vendeur';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: UserRole | null;
    fullName: string | null;
    inactiveMessage: string | null;
    clearInactiveMessage: () => void;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: { text: string } | null }>;
    signIn: (email: string, password: string) => Promise<{ error: { text: string } | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [inactiveMessage, setInactiveMessage] = useState<string | null>(null);

    const fetchUserMeta = useCallback(async (userId: string) => {
        // Fetch role
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();
        setRole((roleData?.role as UserRole) || null);

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, is_active')
            .eq('id', userId)
            .maybeSingle();

        setFullName(profile?.full_name || null);

        // Si le compte n'est pas activé
        if (profile && !profile.is_active) {
            setInactiveMessage('Votre compte n\'est pas encore activé.');
            await supabase.auth.signOut();
            return { text: 'Votre compte n\'est pas encore activé.' };
        }

        return { text: null };
    }, []);

    useEffect(() => {
        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    setTimeout(() => fetchUserMeta(session.user.id), 0);
                } else {
                    setRole(null);
                    setFullName(null);
                }
                setLoading(false);
            }
        );

        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserMeta(session.user.id);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [fetchUserMeta]);

    const signUp = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: { full_name: name },
            },
        });

        if (error) {
            if (error.message.includes('already registered')) {
                return { error: { text: 'Cet email est déjà utilisé.' } };
            }
            return { error: { text: error.message } };
        }

        // Supabase retourne un user avec identities vide si l'email existe déjà
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            return { error: { text: 'Cet email est déjà utilisé.' } };
        }

        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            // Compte non confirmé
            if (error.message.includes('not confirmed')) {
                return { error: { text: 'Votre compte n\'est pas encore activé.' } };
            }
            // Email inexistant ou mot de passe incorrect
            if (error.message.includes('Invalid login credentials')) {
                return { error: { text: 'Email ou mot de passe incorrect.' } };
            }
            return { error: { text: error.message } };
        }

        // Vérifier is_active dans le profil
        if (data.user) {
            const activeCheck = await fetchUserMeta(data.user.id);
            if (activeCheck.text) return { error: { text: activeCheck.text } };
        }

        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const clearInactiveMessage = () => setInactiveMessage(null);

    return (
        <AuthContext.Provider value={{ user, session, loading, role, fullName, inactiveMessage, clearInactiveMessage, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
