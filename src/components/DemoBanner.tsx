import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoBannerProps {
  userEmail?: string | null;
}

const DEMO_EMAIL = "demo@familyonthefly.app";

const DemoBanner = ({ userEmail }: DemoBannerProps) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showCta, setShowCta] = useState(false);
  
  const isDemo = userEmail === DEMO_EMAIL;

  useEffect(() => {
    if (!isDemo) return;
    
    const timer = setTimeout(() => {
      setShowCta(true);
    }, 20000); // 20 seconds

    return () => clearTimeout(timer);
  }, [isDemo]);

  if (!isDemo || isDismissed) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50",
      "bg-gradient-to-r from-primary/95 to-secondary/95 backdrop-blur-sm",
      "rounded-xl shadow-lg border border-primary/20",
      "transform transition-all duration-500 ease-out",
      showCta ? "scale-100" : "scale-95"
    )}>
      <div className="p-4">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-foreground">
              You're exploring demo mode
            </p>
            <p className="text-xs text-primary-foreground/80 mt-0.5">
              This is sample data. Your changes won't be saved.
            </p>

            {showCta && (
              <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs text-primary-foreground/90 mb-2">
                  Ready to track your own adventures?
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-white text-primary hover:bg-white/90 font-medium"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Your Free Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;