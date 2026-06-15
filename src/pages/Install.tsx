import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Monitor, CheckCircle2, Share, MoreVertical, Plus, ChefHat, QrCode, RefreshCw, Copy, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const PUBLISHED_URL = "https://meallink.lovable.app";
  const INSTALL_URL = `${PUBLISHED_URL}/install`;

  const copyInstallLink = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_URL);
      toast.success("Link copiato! Invialo al telefono via WhatsApp/Email.");
    } catch {
      toast.error("Copia non riuscita. Copia manualmente: " + INSTALL_URL);
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const goToApp = () => {
    navigate('/');
  };

  const [refreshing, setRefreshing] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);

  const handleRefreshCache = async () => {
    if (refreshing) return;
    const ok = window.confirm(
      "Verranno svuotate le cache degli asset statici (JS/CSS/immagini) e la pagina sarà ricaricata. I dati (menu/prenotazioni) NON verranno toccati. Continuare?",
    );
    if (!ok) return;
    setRefreshing(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        // Only asset/navigation caches — preserve supabase-cache (dati)
        const assetKeys = keys.filter(
          (k) => k !== "supabase-cache" && !k.includes("supabase"),
        );
        await Promise.all(assetKeys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          regs.map(async (r) => {
            try {
              await r.update();
            } catch {
              /* ignore */
            }
          }),
        );
      }
      toast.success("Cache asset svuotata. Ricarico…");
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("_r", Date.now().toString());
        window.location.replace(url.toString());
      }, 600);
    } catch (err) {
      console.error("[cache refresh]", err);
      toast.error("Impossibile aggiornare la cache");
      setRefreshing(false);
    }
  };

  const handleRefreshData = async () => {
    if (refreshingData) return;
    const ok = window.confirm(
      "Verranno svuotate solo le cache dei dati (menu, prenotazioni, API). Gli asset dell'app restano in cache. Continuare?",
    );
    if (!ok) return;
    setRefreshingData(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        const dataKeys = keys.filter(
          (k) => k === "supabase-cache" || k.includes("supabase") || k.includes("api"),
        );
        await Promise.all(dataKeys.map((k) => caches.delete(k)));
      }
      toast.success("Cache dati svuotata. I prossimi caricamenti useranno la rete.");
    } catch (err) {
      console.error("[data cache refresh]", err);
      toast.error("Impossibile aggiornare la cache dati");
    } finally {
      setRefreshingData(false);
    }
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">App già installata!</CardTitle>
            <CardDescription>
              Stai già usando MealLink come app installata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={goToApp} className="w-full" size="lg">
              Vai all'App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-lg mx-auto pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <ChefHat className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">MealLink</h1>
          <p className="text-muted-foreground">Gestione Digitale Mense</p>
          <Badge variant="secondary" className="mt-3">
            v1.0 • PWA
          </Badge>
        </div>

        {/* Quick Install & QR Code */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Installa o condividi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Install Button */}
            {deferredPrompt ? (
              <Button 
                onClick={handleInstallClick} 
                className="w-full" 
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Installa PWA
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Il tuo browser non supporta l'installazione automatica. Segui le istruzioni qui sotto.
              </p>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <QRCodeSVG value="https://meallink.lovable.app/" size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scansiona per installare su un altro dispositivo
              </p>
            </div>

            {/* Force cache refresh (useful for iOS Safari fallback testing) */}
            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={handleRefreshCache}
                disabled={refreshing}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Aggiornamento…" : "Aggiorna cache asset (app)"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Svuota JS/CSS/immagini e ricarica. I dati restano in cache.
              </p>

              <Button
                onClick={handleRefreshData}
                disabled={refreshingData}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshingData ? "animate-spin" : ""}`} />
                {refreshingData ? "Aggiornamento…" : "Aggiorna dati (menu/prenotazioni)"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Svuota solo la cache dei dati. Utile per testare il fallback offline su iPhone Safari senza ricaricare l'app.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Perché installare l'app?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FeatureItem 
              icon={<Download className="w-5 h-5 text-primary" />}
              title="Accesso rapido"
              description="Icona sulla schermata home, come un'app nativa"
            />
            <FeatureItem 
              icon={<Monitor className="w-5 h-5 text-primary" />}
              title="Schermo intero"
              description="Esperienza immersiva senza barra del browser"
            />
            <FeatureItem 
              icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
              title="Funziona offline"
              description="Accedi ai dati anche senza connessione"
            />
          </CardContent>
        </Card>

        {/* Install Instructions — iPhone/iPad */}
        <Card className={`mb-4 ${isIOS ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border"}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Installa su iPhone / iPad
              {isIOS && <Badge variant="default" className="ml-auto text-xs">Il tuo dispositivo</Badge>}
            </CardTitle>
            <CardDescription>
              Usa Safari (iOS 11.3 o successivo)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InstallStep 
              number={1}
              icon={<Share className="w-5 h-5" />}
              text="Apri questa pagina in Safari e tocca il pulsante Condividi in basso"
            />
            <InstallStep 
              number={2}
              icon={<Plus className="w-5 h-5" />}
              text='Scorri il menu e seleziona "Aggiungi a Home"'
            />
            <InstallStep 
              number={3}
              icon={<CheckCircle2 className="w-5 h-5" />}
              text='Tocca "Aggiungi" in alto a destra per completare'
            />
            <p className="text-xs text-muted-foreground pt-2 border-t">
              L'icona MealLink apparirà sulla schermata Home come un'app nativa.
            </p>
          </CardContent>
        </Card>

        {/* Install Instructions — Android */}
        <Card className={`mb-6 ${isAndroid ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border"}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Installa su Android
              {isAndroid && <Badge variant="default" className="ml-auto text-xs">Il tuo dispositivo</Badge>}
            </CardTitle>
            <CardDescription>
              Chrome, Edge o Samsung Internet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InstallStep 
              number={1}
              icon={<MoreVertical className="w-5 h-5" />}
              text="Tocca il menu (⋮) in alto a destra nel browser"
            />
            <InstallStep 
              number={2}
              icon={<Download className="w-5 h-5" />}
              text='Seleziona "Installa app" o "Aggiungi a schermata Home"'
            />
            <InstallStep 
              number={3}
              icon={<CheckCircle2 className="w-5 h-5" />}
              text='Conferma toccando "Installa" nella finestra popup'
            />
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Puoi anche attendere il banner nativo di Chrome e toccare "Installa" direttamente.
            </p>
          </CardContent>
        </Card>

        {/* Already installed notice */}
        {isInstalled && (
          <Card className="mb-6 border-green-500/20 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    App installata con successo!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Troverai MealLink sulla tua schermata home
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button 
          onClick={goToApp} 
          variant={isInstalled ? "default" : "outline"}
          className="w-full" 
          size="lg"
        >
          {isInstalled ? "Apri l'App" : "Continua nel Browser"}
        </Button>
      </div>
    </div>
  );
};

const FeatureItem = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5">{icon}</div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const InstallStep = ({ 
  number, 
  icon, 
  text 
}: { 
  number: number; 
  icon: React.ReactNode; 
  text: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
      {number}
    </div>
    <div className="flex items-center gap-2 flex-1">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  </div>
);

export default Install;
