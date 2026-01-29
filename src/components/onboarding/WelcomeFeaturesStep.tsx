import { useState } from "react";
import { Users, Map, Sparkles, PlaneTakeoff, Camera, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Map,
    title: "Track Maps & Countries",
    howItWorks: "Log countries per traveler and see them on an interactive world map.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Track Solo or Family",
    howItWorks: "Track just yourself or add companions; each person has their own stats.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Sparkles,
    title: "Plan Trips with AI",
    howItWorks: "Create trips, get AI itineraries, and manage day-by-day plans.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: PlaneTakeoff,
    title: "Track Flights",
    howItWorks: "Search, compare, and save flight options for your trips.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Camera,
    title: "Save Memories & Explore",
    howItWorks: "Store trip photos and discover new destinations.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Trophy,
    title: "Track Achievements & Year Wrapped",
    howItWorks: "Unlock badges and get a yearly recap of your travels.",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const WelcomeFeaturesStep = () => {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const toggleFeature = (key: string) => {
    setFlipped((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5">
      <p className="text-center text-muted-foreground text-sm">
        Here’s what you can do — we’ll set up your profile in the next few steps.
      </p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          const isFlipped = flipped[feature.title] ?? false;
          return (
            <motion.button
              key={feature.title}
              variants={itemVariants}
              type="button"
              onClick={() => toggleFeature(feature.title)}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background"
              animate={{ rotate: isFlipped ? 360 : 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className={`shrink-0 p-2 rounded-lg ${feature.bgColor}`}>
                <Icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div className="min-w-0">
                {!isFlipped ? (
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.howItWorks}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WelcomeFeaturesStep;
