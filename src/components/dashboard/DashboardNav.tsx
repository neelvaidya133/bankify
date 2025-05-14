'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { signout } from '@/lib/auth-actions'
import { usePathname } from 'next/navigation'

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
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user.email}</span>
            <form action={signout}>
              <button className="text-gray-700 hover:text-gray-900">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
