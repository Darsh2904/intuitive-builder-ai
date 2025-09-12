import { Card } from "@/components/ui/card";
import { 
  Brain, 
  Target, 
  MessageCircle, 
  TrendingUp, 
  CheckCircle, 
  Users 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Roadmaps",
    description: "Get personalized learning paths tailored to your target company and current skill level.",
    gradient: "bg-gradient-primary"
  },
  {
    icon: Target,
    title: "Smart Goal Setting", 
    description: "Define your dream company, domain, and tech stack preferences for focused preparation.",
    gradient: "bg-gradient-success"
  },
  {
    icon: CheckCircle,
    title: "Progress Tracking",
    description: "Visual progress bars and completion checklists to monitor your preparation journey.",
    gradient: "bg-gradient-primary"
  },
  {
    icon: TrendingUp,
    title: "Mock Tests & Feedback",
    description: "Topic-wise assessments with AI-generated feedback and weak area identification.",
    gradient: "bg-gradient-success"
  },
  {
    icon: MessageCircle,
    title: "Company Chat Rooms", 
    description: "Real-time discussions with peers targeting the same companies and roles.",
    gradient: "bg-gradient-primary"
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Connect with like-minded students, share resources, and learn together.",
    gradient: "bg-gradient-success"
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-gradient-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent)]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Platform Features
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="gradient-text"> Succeed</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive platform combines AI intelligence with community support 
            to give you the best placement preparation experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 border-0 bg-gradient-card hover:shadow-soft transition-all duration-500 hover:-translate-y-2 group"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.gradient} mb-6 shadow-primary`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold mb-4 group-hover:gradient-text transition-all duration-300">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};