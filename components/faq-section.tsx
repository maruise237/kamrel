"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const faqs = [
    {
      question: "Qu'est-ce que Kamrel exactement ?",
      answer:
        "Kamrel est une plateforme de gestion de projet conçue pour être intuitive dès la première utilisation. Développée par KamTech, elle suit la règle des 3 clics : toute action doit être réalisable en maximum 3 clics. Optimisée pour les entreprises africaines avec des serveurs locaux et un support en français.",
    },
    {
      question: "Puis-je vraiment l'utiliser gratuitement ?",
      answer:
        "Oui ! Le plan gratuit inclut jusqu'à 5 utilisateurs, des projets illimités, 5 Go de stockage et toutes les fonctionnalités de base. C'est parfait pour les petites équipes et startups. Vous pouvez évoluer vers un plan payant quand vous en avez besoin.",
    },
    {
      question: "Comment fonctionne le paiement par Mobile Money ?",
      answer:
        "Kamrel accepte Orange Money, MTN Money et Moov Money pour faciliter les paiements. Vous pouvez également payer par carte bancaire ou virement. Les abonnements sont mensuels ou annuels (avec 2 mois offerts sur l'annuel).",
    },
    {
      question: "Kamrel fonctionne-t-il avec une connexion faible ?",
      answer:
        "Absolument ! Kamrel est optimisé pour les connexions à faible débit. L'application dispose d'un mode hors ligne robuste qui synchronise automatiquement vos données dès que la connexion est rétablie. Les serveurs en Afrique garantissent également une meilleure vitesse.",
    },
    {
      question: "Combien de temps faut-il pour former mon équipe ?",
      answer:
        "L'onboarding prend seulement 5 minutes ! Kamrel propose un parcours de découverte interactif et des modèles de projets prêts à l'emploi. Pour les plans Pro et Entreprise, une formation gratuite est incluse. Le support en français est disponible pour vous accompagner.",
    },
  ]

  return (
    <section id="faq" className="relative overflow-hidden pb-120 pt-24">
      {/* Background blur effects */}
      <div className="bg-primary/20 absolute top-1/2 -right-20 z-[-1] h-64 w-64 rounded-full opacity-80 blur-3xl"></div>
      <div className="bg-primary/20 absolute top-1/2 -left-20 z-[-1] h-64 w-64 rounded-full opacity-80 blur-3xl"></div>

      <div className="z-10 container mx-auto px-4">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="border-primary/40 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 uppercase">
            
            <span className="text-sm">FAQ</span>
          </div>
        </motion.div>

        <motion.h2
          className="mx-auto mt-6 max-w-xl text-center text-4xl font-medium md:text-[54px] md:leading-[60px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Des questions ? Nous avons les{" "}
          <span className="bg-gradient-to-b from-foreground via-rose-200 to-primary bg-clip-text text-transparent">
            réponses
          </span>
        </motion.h2>

        <div className="mx-auto mt-12 flex max-w-xl flex-col gap-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="from-secondary/40 to-secondary/10 rounded-2xl border border-white/10 bg-gradient-to-b p-6 shadow-[0px_2px_0px_0px_rgba(255,255,255,0.1)_inset] transition-all duration-300 hover:border-white/20 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleItem(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleItem(index)
                }
              }}
              {...(index === faqs.length - 1 && { "data-faq": faq.question })}
            >
              <div className="flex items-start justify-between">
                <h3 className="m-0 font-medium pr-4">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className=""
                >
                  {openItems.includes(index) ? (
                    <Minus className="text-primary flex-shrink-0 transition duration-300" size={24} />
                  ) : (
                    <Plus className="text-primary flex-shrink-0 transition duration-300" size={24} />
                  )}
                </motion.div>
              </div>
              <AnimatePresence>
                {openItems.includes(index) && (
                  <motion.div
                    className="mt-4 text-muted-foreground leading-relaxed overflow-hidden"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut",
                      opacity: { duration: 0.2 },
                    }}
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
