'use client';
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signout } from '@/lib/auth-actions'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      await signout()
      router.push('/login')
    }

    handleLogout()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging out...</p>
    </div>
  )
}