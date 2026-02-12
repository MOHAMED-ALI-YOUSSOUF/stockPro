"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface NavLinkProps {
    to: string;
    className?: string;
    activeClassName?: string;
    children: ReactNode;
    onClick?: () => void;
}

export const NavLink = ({
    to,
    className,
    activeClassName,
    children,
    onClick,
}: NavLinkProps) => {
    const pathname = usePathname();
    const isActive = pathname === to || (to !== "/" && pathname?.startsWith(to));

    return (
        <Link
            href={to}
            onClick={onClick}
            className={cn(className, isActive && activeClassName)}
        >
            {children}
        </Link>
    );
};
