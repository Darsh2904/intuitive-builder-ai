import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Users } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-success/10 to-primary/20 animate-gradient-x" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(120,119,198,0.2),transparent)]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="space-y-2">
              <div className="text-4xl font-bold gradient-text">10,000+</div>
              <div className="text-muted-foreground">Students Placed</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold gradient-text">500+</div>
              <div className="text-muted-foreground">Partner Companies</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold gradient-text">95%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* Main CTA */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
              <Rocket className="w-4 h-4" />
              Join Thousands of Successful Students
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Ready to
              <span className="gradient-text"> Crack </span>
              Your Dream Job?
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start your personalized placement preparation journey today. 
              Join our AI-powered platform and get placed in your dream company.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" className="group">
              Get Started for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="outline" size="xl" className="group">
              <Users className="w-5 h-5" />
              Join Community
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Trusted by students from top universities</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="font-semibold text-lg">IIT • NIT • BITS • VIT</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};