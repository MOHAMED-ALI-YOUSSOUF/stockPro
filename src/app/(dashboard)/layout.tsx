"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useStore } from "@/store/useStore";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { setUserId, loadData } = useStore();

    // Auth check
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Data loading
    useEffect(() => {
        if (user) {
            setUserId(user.id);
            loadData();
        } else {
            setUserId(null);
        }
    }, [user, setUserId, loadData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return <Layout>{children}</Layout>;
}
