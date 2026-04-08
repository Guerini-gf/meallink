import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.jpg";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";
import { motion } from "framer-motion";
import {
  Utensils,
  Smartphone,
  BarChart3,
  ScanLine,
  Bell,
  ShieldCheck,
  Users,
  Rocket,
  Check,
  ArrowRight,
  ChevronDown,
  Star,
  Zap,
  TrendingUp,
  Quote,
  Building2,
  Timer,
  Leaf,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    check();
  }, [navigate]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="MealLink" className="h-10 w-auto rounded-lg" />
            <span className="text-xl font-bold text-foreground tracking-tight">MealLink</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo("features")} className="hover:text-primary transition-colors">Funzionalità</button>
            <button onClick={() => scrollTo("how")} className="hover:text-primary transition-colors">Come Funziona</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">Prezzi</button>
            <button onClick={() => scrollTo("testimonials")} className="hover:text-primary transition-colors">Case Study</button>
            <button onClick={() => scrollTo("investors")} className="hover:text-primary transition-colors">Investitori</button>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm">Accedi</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Inizia Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 relative bg-gradient-to-br from-primary via-primary/85 to-accent/70 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--secondary)/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm font-medium mb-8">
              <Zap className="h-4 w-4" />
              La mensa aziendale diventa smart
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary-foreground leading-[1.1] mb-6">
              Digitalizza la tua
              <span className="text-secondary block">mensa aziendale</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Ordini digitali, gestione allergeni, statistiche in tempo reale e zero sprechi.
              MealLink è la piattaforma SaaS che rivoluziona la ristorazione collettiva.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8 h-12 shadow-lg shadow-secondary/25">
                  Prova Gratuita <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 border-2 border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
                onClick={() => scrollTo("how")}
              >
                Scopri come funziona
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/30 border border-primary-foreground/10 bg-background/5">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-foreground/80 backdrop-blur">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-background/50 ml-2 font-mono">meallink.app/dashboard</span>
              </div>
              <img
                src={dashboardMockup}
                alt="MealLink Dashboard - Gestione menu e statistiche ordini"
                className="w-full h-auto"
                width={1280}
                height={800}
              />
            </div>
          </motion.div>
          <div className="flex justify-center mt-10">
            <button onClick={() => scrollTo("features")} className="animate-bounce text-primary-foreground/60">
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-8 bg-muted border-y border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer} className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-muted-foreground">
            {[
              { value: "€2.5B", label: "Mercato italiano" },
              { value: "45K+", label: "Mense in Italia" },
              { value: "70%", label: "Ancora manuali" },
              { value: "-30%", label: "Sprechi riducibili" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-xs md:text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tutto ciò che serve alla tua mensa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Un'unica piattaforma per chef, operatori e dipendenti.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Utensils, title: "Gestione Menu", desc: "Crea e pubblica il menù giornaliero con import CSV e gestione varianti." },
              { icon: Smartphone, title: "Ordini da Smartphone", desc: "I dipendenti scelgono i piatti dal telefono, con opzione asporto." },
              { icon: BarChart3, title: "Statistiche Real-time", desc: "Dashboard chef con conteggi precisi per ogni piatto e trend settimanali." },
              { icon: ScanLine, title: "Scanner Badge", desc: "Conferma il ritiro del pasto con scansione rapida del badge aziendale." },
              { icon: ShieldCheck, title: "Gestione Allergeni", desc: "Ogni dipendente indica le proprie intolleranze, alert automatici." },
              { icon: Bell, title: "Notifiche Push", desc: "Avvisa i dipendenti del menù del giorno e delle scadenze ordini." },
            ].map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 md:py-28 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Semplicissimo da usare
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Quattro passaggi per digitalizzare la mensa.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Utensils, title: "Lo Chef crea il menù", desc: "Pubblica il menù del giorno con pochi click" },
              { step: "02", icon: Smartphone, title: "Il dipendente ordina", desc: "Sceglie i piatti dallo smartphone prima del pranzo" },
              { step: "03", icon: BarChart3, title: "Lo Chef prepara", desc: "Vede i conteggi esatti e prepara senza sprechi" },
              { step: "04", icon: ScanLine, title: "Ritiro con badge", desc: "Scansione rapida del badge per confermare il pasto" },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="text-center relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary/20" />
                )}
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg shadow-primary/25">
                  {s.step}
                </div>
                <s.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Prezzi trasparenti
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Scegli il piano perfetto per la tua azienda.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Base",
                price: "€99",
                period: "/mese",
                desc: "Per piccole aziende",
                features: ["Fino a 100 dipendenti", "Menu digitale", "Ordini base", "Report mensili"],
                highlight: false,
              },
              {
                name: "Professional",
                price: "€249",
                period: "/mese",
                desc: "La scelta più popolare",
                features: ["Fino a 300 dipendenti", "Scanner badge", "Statistiche avanzate", "Gestione allergeni", "Asporto"],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "Per grandi organizzazioni",
                features: ["Dipendenti illimitati", "Multi-mensa", "API personalizzate", "Supporto dedicato", "SLA garantito"],
                highlight: false,
              },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-xl shadow-primary/20 scale-[1.03]"
                    : "bg-card border border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="flex items-center gap-1 mb-4">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Più popolare</span>
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? "" : "text-foreground"}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.desc}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? "" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    Inizia Ora
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* TESTIMONIALS & CASE STUDIES */}
      <section id="testimonials" className="py-20 md:py-28 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Quote className="h-4 w-4" />
              Storie di successo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Chi usa MealLink, ne parla così
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Risultati concreti dalle aziende che hanno già digitalizzato la loro mensa.
            </p>
          </motion.div>

          {/* Testimonials */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {[
              {
                quote: "Da quando usiamo MealLink, gli sprechi alimentari si sono ridotti del 35%. Il nostro chef finalmente sa esattamente quanti piatti preparare.",
                author: "Marco Bianchi",
                role: "HR Director",
                company: "TechVenture Srl",
                employees: "220 dipendenti",
              },
              {
                quote: "I nostri dipendenti adorano poter ordinare dal telefono. Il tasso di soddisfazione della mensa è salito dal 62% al 91% in tre mesi.",
                author: "Laura Rossi",
                role: "Facility Manager",
                company: "Industrie Meccaniche Padane",
                employees: "480 dipendenti",
              },
              {
                quote: "La gestione degli allergeni era un incubo. Con MealLink abbiamo zero incidenti e piena conformità normativa. Lo consiglio a tutti.",
                author: "Chef Antonio Ferrara",
                role: "Executive Chef",
                company: "Mensa Universitaria di Bologna",
                employees: "1.200 pasti/giorno",
              },
            ].map((t) => (
              <motion.div
                key={t.author}
                variants={fadeUp}
                className="p-6 rounded-2xl bg-card border border-border flex flex-col"
              >
                <Quote className="h-8 w-8 text-primary/30 mb-4 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed mb-6 flex-1 italic">
                  "{t.quote}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                  <p className="text-xs text-primary font-medium mt-1">{t.company} · {t.employees}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Case Study Highlight */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-2 bg-primary/5 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary px-3">📊 Case Study</span>
              </div>
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Industrie Meccaniche Padane</h3>
                    <p className="text-sm text-muted-foreground">480 dipendenti · Sede di Brescia · Piano Professional</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Prima di MealLink, la mensa di IMP gestiva 480 pasti al giorno con fogli Excel e ordini cartacei.
                  Lo chef sovrastimava le porzioni del 25%, con conseguenti sprechi alimentari per oltre €3.000/mese.
                  I dipendenti si lamentavano della mancanza di scelta e dei tempi di attesa.
                </p>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { icon: Leaf, value: "-35%", label: "Sprechi alimentari", desc: "Da €3.000 a €1.950/mese risparmiati" },
                    { icon: Timer, value: "3 min", label: "Tempo medio ordine", desc: "Prima era 12 min in coda" },
                    { icon: TrendingUp, value: "+29%", label: "Soddisfazione", desc: "Da 62% a 91% di gradimento" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4 rounded-xl bg-muted">
                      <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                      <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INVESTORS */}
      <section id="investors" className="py-20 md:py-28 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/10 text-background/90 text-sm font-medium mb-8">
              <TrendingUp className="h-4 w-4" />
              Opportunità di investimento
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold mb-6">
              Investi nel futuro della<br />ristorazione collettiva
            </motion.h2>
            <motion.p variants={fadeUp} className="text-background/70 text-lg mb-12 leading-relaxed">
              MealLink affronta un mercato da €2.5 miliardi in Italia con il 70% delle mense
              ancora gestite manualmente. Il nostro MVP è già funzionante e pronto per la scala.
            </motion.p>
            <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Rocket, title: "MVP Pronto", desc: "Prodotto funzionante e testato sul campo" },
                { icon: Users, title: "Team Dedicato", desc: "Competenze food-tech e sviluppo software" },
                { icon: TrendingUp, title: "Break-even 18 mesi", desc: "Con 25+ clienti attivi sul piano Professional" },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-xl bg-background/5 border border-background/10">
                  <item.icon className="h-8 w-8 mb-3 text-secondary" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-background/60">{item.desc}</p>
                </div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8 h-12">
                Richiedi il Pitch Deck
              </Button>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-base px-8 h-12 border-background/20 text-background hover:bg-background/10">
                  Prova la Demo
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="pt-8 border-t border-background/10">
              <p className="text-sm text-background/60 mb-2">Contatto diretto</p>
              <p className="text-lg font-semibold">Guerini Gianfelice</p>
              <a href="tel:+393357109529" className="text-secondary hover:text-secondary/80 transition-colors font-medium">
                Tel +39 335 710 9529
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-border bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="MealLink" className="h-8 w-auto rounded-lg" />
              <span className="font-semibold text-foreground">MealLink</span>
              <span className="text-sm text-muted-foreground">by SOFTTHECHEFS</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <button onClick={() => scrollTo("features")} className="hover:text-primary transition-colors">Funzionalità</button>
                <button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">Prezzi</button>
                <Link to="/install" className="hover:text-primary transition-colors">Installa App</Link>
                <Link to="/auth" className="hover:text-primary transition-colors">Accedi</Link>
              </div>
              <span className="hidden md:inline text-border">|</span>
              <a href="tel:+393357109529" className="hover:text-primary transition-colors">
                Guerini Gianfelice — +39 335 710 9529
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 SOFTTHECHEFS. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
