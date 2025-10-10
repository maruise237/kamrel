'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function CheckEmailPage() {
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
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#e78a53]/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#e78a53]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Vérifiez votre email
          </h1>
          
          <p className="text-zinc-400 mb-6">
            Nous avons envoyé un lien de confirmation à votre adresse email. 
            Cliquez sur le lien dans l'email pour activer votre compte.
          </p>

          <div className="space-y-4">
            <Button
              asChild
              className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium py-3 rounded-xl transition-colors"
            >
              <Link href="/login">
                Retour à la connexion
              </Link>
            </Button>
            
            <p className="text-sm text-zinc-500">
              Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{" "}
              <Link href="/signup" className="text-[#e78a53] hover:text-[#e78a53]/80">
                réessayez
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}