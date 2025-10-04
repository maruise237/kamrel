"use client"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { geist } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { CheckSquare, Clock, MessageSquare, FileText, BarChart3, Zap } from "lucide-react"

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const features = [
    {
      icon: CheckSquare,
      title: "Gestion des Tâches Intelligente",
      description: "Vue Kanban, Liste et Calendrier. Créez une tâche en 3 clics maximum avec attribution automatique.",
      color: "text-blue-500",
    },
    {
      icon: Clock,
      title: "Suivi du Temps Sans Friction",
      description: "Timer intégré à chaque tâche. Rapports automatiques et tableau de bord temps réel.",
      color: "text-green-500",
    },
    {
      icon: MessageSquare,
      title: "Collaboration Fluide",
      description: "Commentaires contextuels, chat intégré par projet et notifications intelligentes.",
      color: "text-purple-500",
    },
    {
      icon: FileText,
      title: "Partage de Fichiers Simplifié",
      description: "Glissez-déposez vos fichiers. Organisation et versioning automatiques avec aperçu immédiat.",
      color: "text-orange-500",
    },
    {
      icon: BarChart3,
      title: "Diagramme de Gantt Automatique",
      description: "Généré automatiquement à partir de vos tâches. Ajustez les dates en glissant les barres.",
      color: "text-pink-500",
    },
    {
      icon: Zap,
      title: "Intelligence Artificielle Discrète",
      description: "Suggestions intelligentes, alertes proactives et rapports automatiques chaque lundi.",
      color: "text-yellow-500",
    },
  ]

  return (
    <section id="features" className="text-foreground relative overflow-hidden py-12 sm:py-24 md:py-32">
      <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
      <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0 }}
        className="container mx-auto flex flex-col items-center gap-6 sm:gap-12"
      >
        <h2
          className={cn(
            "via-foreground mb-8 bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
            geist.className,
          )}
        >
          Fonctionnalités Principales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group border-secondary/40 text-card-foreground relative flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out hover:border-primary/60 hover:shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-background/50 ${feature.color}`}>
                  
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold tracking-tight mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-medium">
              Toute action en <strong className="text-primary">maximum 3 clics</strong>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
