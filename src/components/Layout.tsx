"use client";

import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ArrowLeftRight,
    BarChart3,
    Settings,
    Menu,
    X,
    LogOut,
    Wifi,
    WifiOff,
    Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { hasPendingOps } from '@/lib/offlineSync';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/products', icon: Package, label: 'Produits' },
    { to: '/pos', icon: ShoppingCart, label: 'Point de Vente' },
    { to: '/stock', icon: ArrowLeftRight, label: 'Stock' },
    { to: '/reports', icon: BarChart3, label: 'Rapports' },
];

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [online, setOnline] = useState(true); // Default to true to avoid hydration mismatch
    const { user, fullName, role, signOut } = useAuth();
    const { isSyncing } = useStore();

    useEffect(() => {
        setOnline(navigator.onLine);
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const initials = fullName
        ? fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || 'U';

    const pendingOps = hasPendingOps();

    return (
        <div className="min-h-screen flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="h-20 flex items-center px-6 border-b border-sidebar-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-sidebar-foreground">StockPro</h1>
                            <p className="text-xs text-sidebar-muted">Gestion de Stock</p>
                        </div>
                    </div>
                    <button
                        className="ml-auto lg:hidden text-sidebar-muted hover:text-sidebar-foreground"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className="sidebar-item"
                            activeClassName="sidebar-item-active"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-sidebar-border space-y-1">
                    <NavLink
                        to="/settings"
                        className="sidebar-item"
                        activeClassName="sidebar-item-active"
                    >
                        <Settings className="w-5 h-5" />
                        <span>Paramètres</span>
                    </NavLink>
                    <button
                        onClick={signOut}
                        className="sidebar-item w-full text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-8 sticky top-0 z-30">
                    <button
                        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="ml-auto flex items-center gap-4">
                        {/* Online/Offline indicator */}
                        <div className="flex items-center gap-2">
                            {isSyncing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : online ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                            ) : (
                                <WifiOff className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                {isSyncing
                                    ? 'Synchronisation...'
                                    : online
                                        ? pendingOps
                                            ? 'En attente de sync'
                                            : 'En ligne'
                                        : 'Hors ligne'}
                            </span>
                        </div>

                        {role && (
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                                {role}
                            </span>
                        )}

                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{initials}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
            </div>
        </div>
    );
};
