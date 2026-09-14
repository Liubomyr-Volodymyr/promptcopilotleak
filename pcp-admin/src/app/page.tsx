'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLoginMutation } from '@/store/api/auth.api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const router = useRouter()
  const [login, { isLoading }] = useLoginMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    try {
      const data = await login({ email, password }).unwrap()
      sessionStorage.setItem('accessToken', data.access_token)
      router.push('/panel')
    } catch (e: any) {
      setErr(e?.data?.message || 'Login failed')
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center">
        <form
            onSubmit={handleSubmit}
            className="w-96 p-6 border rounded bg-white flex flex-col gap-4"
        >
          <h2 className="text-xl font-semibold">Sign in</h2>

          <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
          />

          <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" disabled={isLoading} className='cursor-pointer'>
            Sign in
          </Button>

          {err && <div className="text-red-500">{err}</div>}
        </form>
      </div>
  )
}
