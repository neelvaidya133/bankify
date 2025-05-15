'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { signout } from '@/lib/auth-actions'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CreditCard, History, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Bankify
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link 
                href="/dashboard" 
                className={`px-3 py-2 rounded-md ${
                  isActive('/dashboard') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Overview
              </Link>
              <Link 
                href="/cards" 
                className={`px-3 py-2 rounded-md ${
                  isActive('/cards') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Cards
              </Link>
              <Link
                href="/credit-cards/payments"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                  pathname === '/credit-cards/payments' && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                )}
              >
                <CreditCard className="h-4 w-4" />
                Credit Card Payments
              </Link>
              <Link
                href="/transactions"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                  pathname === '/transactions' && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                )}
              >
                <History className="h-4 w-4" />
                Transactions
              </Link>
              <Link 
                href="/catalog" 
                className={`px-3 py-2 rounded-md ${
                  isActive('/catalog') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Catalog
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user.email}</span>
            <form action={signout}>
              <Button variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
