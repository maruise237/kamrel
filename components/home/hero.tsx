"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, CheckCircle2, Clock, Users } from "lucide-react"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <section className="relative overflow-hidden min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-24 sm:py-32 relative z-10 flex-1 flex flex-col">
          <div className="mx-auto max-w-4xl text-center flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2 text-sm">
                
                La règle des 3 clics
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <h1 id="main-title" className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Gérez vos <strong className="text-primary">projets</strong>,<br />
                pas votre <em className="italic">logiciel</em>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground"
            >
              Kamrel est la solution de gestion de projet intuitive conçue pour les entreprises africaines. Toute action
              en maximum 3 clics. Optimisé pour les connexions à faible débit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a href="/signup">
                  <div className="group cursor-pointer border border-border bg-card gap-2 h-[60px] flex items-center p-[10px] rounded-full hover:shadow-lg transition-all">
                    <div className="border border-border bg-primary h-[40px] rounded-full flex items-center justify-center text-primary-foreground">
                      <p className="font-medium tracking-tight mr-3 ml-3 flex items-center gap-2 justify-center text-base">
                        
                        Commencer gratuitement
                      </p>
                    </div>
                    <div className="text-muted-foreground group-hover:ml-4 ease-in-out transition-all size-[24px] flex items-center justify-center rounded-full border-2 border-border">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right group-hover:rotate-180 ease-in-out transition-all"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-6 flex-wrap justify-center mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Gratuit jusqu'à 5 utilisateurs</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Onboarding 5 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Support en français</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-auto pb-8"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-6">Fait pour l'Afrique par KamTech</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="opacity-60 hover:opacity-100 transition-all duration-300">
                  <div className="text-foreground font-semibold text-lg">Serveurs en Afrique</div>
                </div>
                <div className="opacity-60 hover:opacity-100 transition-all duration-300">
                  <div className="text-foreground font-semibold text-lg">Mobile Money</div>
                </div>
                <div className="opacity-60 hover:opacity-100 transition-all duration-300">
                  <div className="text-foreground font-semibold text-lg"> Support Français</div>
                </div>
                <div className="opacity-60 hover:opacity-100 transition-all duration-300">
                  <div className="text-foreground font-semibold text-lg">Connexion faible</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
