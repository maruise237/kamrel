"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { useState } from "react"

const pricingPlans = [
  {
    name: "Gratuit",
    price: "0 FCFA",
    description: "Idéal pour les petites équipes et startups",
    features: [
      "Jusqu'à 5 utilisateurs",
      "Projets illimités",
      "5 Go de stockage",
      "Toutes les fonctionnalités de base",
      "Support par email",
      "Mode hors ligne",
    ],
    popular: false,
    cta: "Commencer gratuitement",
  },
  {
    name: "Pro",
    monthlyPrice: "7 500",
    annualPrice: "6 000",
    currency: "FCFA",
    description: "Parfait pour les PME en croissance",
    features: [
      "Utilisateurs illimités",
      "100 Go de stockage",
      "Gantt avancé + rapports personnalisés",
      "Intégrations tierces",
      "Support prioritaire (24h)",
      "Historique illimité",
      "Formation incluse",
    ],
    popular: true,
    cta: "Essai gratuit 14 jours",
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    description: "Pour les grandes structures",
    features: [
      "Tout du plan Pro inclus",
      "Stockage illimité",
      "API complète",
      "Serveur dédié optionnel",
      "Formation sur site",
      "Account manager dédié",
      "Support 24/7",
    ],
    popular: false,
    cta: "Contactez-nous",
  },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            
            <span className="text-sm font-medium text-white/80">Tarification</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            Tarification Simple et Transparente
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Commencez gratuitement avec jusqu'à 5 utilisateurs. Évoluez selon vos besoins.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-4 p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm w-fit mx-auto"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !isAnnual ? "bg-[#e78a53] text-white shadow-lg" : "text-white/60 hover:text-white/80"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                isAnnual ? "bg-[#e78a53] text-white shadow-lg" : "text-white/60 hover:text-white/80"
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                2 mois offerts
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative rounded-2xl p-8 backdrop-blur-sm border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-[#e78a53]/10 to-transparent border-[#e78a53]/30 shadow-lg shadow-[#e78a53]/10"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#e78a53] to-[#e78a53]/80 text-white text-sm font-medium px-4 py-2 rounded-full">
                    Plus Populaire
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  {plan.price ? (
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice} {plan.currency}
                      </span>
                      <span className="text-white/60 text-lg">/utilisateur/{isAnnual ? "an" : "mois"}</span>
                    </>
                  )}
                </div>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#e78a53] to-[#e78a53]/80 text-white shadow-lg shadow-[#e78a53]/25 hover:shadow-[#e78a53]/40"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-4">Paiement par Mobile Money, Carte bancaire ou Virement</p>
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <span className="text-white/80 text-sm">Orange Money</span>
            <span className="text-white/80 text-sm">MTN Money</span>
            <span className="text-white/80 text-sm">Moov Money</span>
            <span className="text-white/80 text-sm">Carte bancaire</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[#e78a53] hover:text-[#e78a53]/80 font-medium transition-colors"
          >
            Besoin d'une solution personnalisée ? Contactez-nous →
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
