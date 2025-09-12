import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Target, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-gradient opacity-10" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent)]" />
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-primary">
                <Brain className="w-4 h-4" />
                AI-Powered Platform
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="gradient-text">Crack</span>
                <span className="text-foreground">It.</span>
                <span className="gradient-text">AI</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Transform your placement preparation with AI-powered personalized roadmaps, 
                smart assessments, and real-time community support. Get ready to crack your dream company.
              </p>
            </div>

            {/* Feature Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-card border border-border/50">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Smart Roadmaps</h3>
                  <p className="text-sm text-muted-foreground">Personalized learning paths</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-card border border-border/50">
                <div className="p-2 bg-gradient-success rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground">Real-time analytics</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="glass" size="xl">
                View Demo
              </Button>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative lg:ml-12 animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-primary rounded-2xl blur-2xl opacity-30 animate-glow-pulse" />
              <img
                src={heroImage}
                alt="CrackIt.AI Dashboard Preview"
                className="relative rounded-2xl shadow-2xl w-full max-w-2xl mx-auto border border-border/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};