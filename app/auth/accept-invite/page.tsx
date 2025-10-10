'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, CheckCircle } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-client'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<{
    workspace_name: string
    inviter_email: string
  } | null>(null)

  useEffect(() => {
    if (token) {
      fetchInviteInfo()
    }
  }, [token])

  const fetchInviteInfo = async () => {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from('invites')
        .select(`
          workspace_id,
          workspaces!inner(name),
          profiles!inner(email)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Invitation invalide ou expirée')
        return
      }

      setInviteInfo({
        workspace_name: data.workspaces.name,
        inviter_email: data.profiles.email
      })
    } catch (error: any) {
      setError('Erreur lors de la récupération de l\'invitation')
    }
  }

  const handleAcceptInvite = async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientComponentClient()
      
      // Call the accept-invite Edge Function
      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: { token }
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'acceptation de l\'invitation')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Token d'invitation manquant</h1>
          <Link href="/login" className="text-[#e78a53] hover:text-[#e78a53]/80">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 text-zinc-400 hover:text-[#e78a53] transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </Link>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-[#e78a53]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#e78a53]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 text-center"
        >
          {success ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Invitation acceptée !
              </h1>
              <p className="text-zinc-400 mb-6">
                Vous avez rejoint l'équipe avec succès. Redirection vers le dashboard...
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#e78a53]/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#e78a53]" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">
                Invitation d'équipe
              </h1>
              
              {inviteInfo && (
                <div className="text-left bg-zinc-800/50 rounded-lg p-4 mb-6">
                  <p className="text-zinc-300 mb-2">
                    <span className="font-medium">Équipe:</span> {inviteInfo.workspace_name}
                  </p>
                  <p className="text-zinc-300">
                    <span className="font-medium">Invité par:</span> {inviteInfo.inviter_email}
                  </p>
                </div>
              )}

              {error && (
                <Alert className="mb-6 border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button
                  onClick={handleAcceptInvite}
                  disabled={isLoading || !inviteInfo}
                  className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Acceptation..." : "Accepter l'invitation"}
                </Button>
                
                <Button
                  variant="outline"
                  asChild
                  className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700/50"
                >
                  <Link href="/login">
                    Annuler
                  </Link>
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}