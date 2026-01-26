import { Users, Map, Sparkles, PlaneTakeoff, Camera, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Map,
    title: "Map & Countries",
    howItWorks: "Log countries per traveler and see them on an interactive world map.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Solo or Family",
    howItWorks: "Track just yourself or add companions; each person has their own stats.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Sparkles,
    title: "Trips & AI Planner",
    howItWorks: "Create trips, get AI itineraries, and manage day-by-day plans.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: PlaneTakeoff,
    title: "Flights",
    howItWorks: "Search, compare, and save flight options for your trips.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Camera,
    title: "Memories & Explore",
    howItWorks: "Store trip photos and discover new destinations.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Trophy,
    title: "Achievements & Year Wrapped",
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
          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
            >
              <div className={`shrink-0 p-2 rounded-lg ${feature.bgColor}`}>
                <Icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.howItWorks}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WelcomeFeaturesStep;
