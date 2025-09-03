import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  CheckSquare, 
  Wallet, 
  BarChart3, 
  User,
  Heart,
  Settings
} from "lucide-react";

interface MobileNavProps {
  activeTab?: string;
  role?: "parent" | "child";
  className?: string;
}

export function MobileNav({ activeTab = "dashboard", role = "child", className }: MobileNavProps) {
  const childTabs = [
    { id: "dashboard", icon: Home, label: "Início" },
    { id: "tasks", icon: CheckSquare, label: "Tarefas" },
    { id: "wallet", icon: Wallet, label: "Carteira" },
    { id: "profile", icon: User, label: "Perfil" }
  ];

  const parentTabs = [
    { id: "dashboard", icon: Home, label: "Família" },
    { id: "tasks", icon: CheckSquare, label: "Tarefas" },
    { id: "daughters", icon: Heart, label: "Filhas" },
    { id: "reports", icon: BarChart3, label: "Relatórios" },
    { id: "settings", icon: Settings, label: "Config" }
  ];

  const tabs = role === "parent" ? parentTabs : childTabs;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50",
      "grid grid-cols-4 md:grid-cols-5 safe-area-inset-bottom",
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={cn(
              "h-16 flex-col gap-1 rounded-none transition-smooth",
              isActive 
                ? "text-primary bg-primary/5" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={cn(
              "w-5 h-5 transition-smooth",
              isActive && "scale-110"
            )} />
            <span className="text-xs font-medium">{tab.label}</span>
            {isActive && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Button>
        );
      })}
    </nav>
  );
}