import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
            <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="mb-6 relative">
                    {/* Effet lumineux derrière le logo */}
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                    
                    <Image
                        src="/icons/icon-512x512.png"
                        alt="StockPro Logo"
                        width={120}
                        height={120}
                        className="relative drop-shadow-xl w-[120px] h-[120px] object-contain"
                        priority
                    />
                </div>
                
                <div className="flex items-center gap-3 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-semibold text-lg tracking-wide">Chargement...</span>
                </div>
            </div>
        </div>
    );
}
