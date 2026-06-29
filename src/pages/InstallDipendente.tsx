import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Share, MoreVertical, Plus, CheckCircle2, QrCode, Copy, UtensilsCrossed } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallDipendente = () => {
  const navigate = useNavigate();
  const PUBLISHED_URL = "https://meallink.lovable.app";
  const INSTALL_URL = `${PUBLISHED_URL}/install-dipendente`;

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Use the employee manifest so the installed app opens directly on /dipendente
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", "/manifest-dipendente.webmanifest");
    document.title = "Installa MealLink Dipendente";

    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_URL);
      toast.success("Link copiato! Invialo al dipendente.");
    } catch {
      toast.error("Copia manualmente: " + INSTALL_URL);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">App Dipendente installata!</CardTitle>
            <CardDescription>Apri "Dipendente" dalla schermata Home</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dipendente")} className="w-full bg-green-600 hover:bg-green-700">
              Apri ora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
      <div className="max-w-lg mx-auto pt-8 pb-16">
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <UtensilsCrossed className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">MealLink Dipendente</h1>
          <p className="text-muted-foreground">Solo menu del giorno e prenotazione del giorno dopo</p>
          <Badge variant="secondary" className="mt-3 bg-green-100 text-green-800">
            App per dipendenti • PWA
          </Badge>
        </div>

        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Installa sul telefono del dipendente
            </CardTitle>
            <CardDescription>
              Questa è una versione separata dal gestionale: il dipendente vedrà solo il menu e l'ordine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <p className="text-sm font-semibold">Link da inviare al dipendente:</p>
              <p className="font-mono text-xs break-all bg-white border rounded px-2 py-1">{INSTALL_URL}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={copyLink} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" /> Copia link
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent("Installa l'app dipendente MealLink: " + INSTALL_URL)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share className="w-4 h-4 mr-2" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {deferredPrompt && (
              <Button onClick={handleInstall} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <Download className="w-5 h-5 mr-2" /> Installa l'app Dipendente
              </Button>
            )}

            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-xl shadow-sm border">
                <QRCodeSVG value={INSTALL_URL} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Il dipendente inquadra il QR con la fotocamera e installa l'app.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`mb-4 ${isIOS ? "border-green-400 bg-green-50" : ""}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> iPhone / iPad
              {isIOS && <Badge className="ml-auto bg-green-600">Il tuo dispositivo</Badge>}
            </CardTitle>
            <CardDescription>Aprire in Safari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Step n={1} icon={<Share className="w-4 h-4" />} text="Tocca il pulsante Condividi in basso" />
            <Step n={2} icon={<Plus className="w-4 h-4" />} text='Scegli "Aggiungi a Home"' />
            <Step n={3} icon={<CheckCircle2 className="w-4 h-4" />} text='Tocca "Aggiungi"' />
          </CardContent>
        </Card>

        <Card className={`mb-6 ${isAndroid ? "border-green-400 bg-green-50" : ""}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> Android
              {isAndroid && <Badge className="ml-auto bg-green-600">Il tuo dispositivo</Badge>}
            </CardTitle>
            <CardDescription>Chrome / Edge / Samsung Internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Step n={1} icon={<MoreVertical className="w-4 h-4" />} text="Apri il menu ⋮ in alto a destra" />
            <Step n={2} icon={<Download className="w-4 h-4" />} text='Tocca "Installa app"' />
            <Step n={3} icon={<CheckCircle2 className="w-4 h-4" />} text='Conferma "Installa"' />
          </CardContent>
        </Card>

        <Button onClick={() => navigate("/dipendente")} variant="outline" className="w-full" size="lg">
          Apri nel browser senza installare
        </Button>
      </div>
    </div>
  );
};

const Step = ({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
      {n}
    </div>
    <div className="flex items-center gap-2 flex-1">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  </div>
);

export default InstallDipendente;