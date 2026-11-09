import { Component, lazy, Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const DeliverySchedule = lazy(() =>
  import("./DeliverySchedule").then(module => ({ default: module.DeliverySchedule }))
);

export class DeliveryScheduleBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="space-y-3 border border-destructive rounded-lg p-4">
          <p className="text-destructive">Impossibile caricare le consegne. Ricarica la pagina per riprovare.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Riprova
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DeliverySchedulePanel = () => (
  <DeliveryScheduleBoundary>
    <Suspense fallback={<p role="status" className="text-muted-foreground">Caricamento consegne...</p>}>
      <DeliverySchedule />
    </Suspense>
  </DeliveryScheduleBoundary>
);