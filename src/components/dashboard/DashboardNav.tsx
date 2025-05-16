"use client";

import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { signout } from "@/lib/auth-actions";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreditCard, History, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/cards", label: "Cards" },
    {
      href: "/credit-cards/payments",
      label: "Credit Card Payments",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      href: "/transactions",
      label: "Transactions",
      icon: <History className="h-4 w-4" />,
    },
    { href: "/catalog", label: "Catalog" },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Bankify
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                    isActive(link.href) &&
                      "bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-gray-50"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-700">{user.email}</span>
            <form action={signout}>
              <Button variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                    isActive(link.href) &&
                      "bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-gray-50"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                </div>
                <div className="mt-3 px-2">
                  <form action={signout}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
