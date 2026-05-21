import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppProviders } from "@/providers";
import { AppRoutes } from "@/routes";

const App = () => {
  return (
    <AppProviders>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
