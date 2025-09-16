import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Bot, Target, Clock, Zap } from 'lucide-react';

const CreateRoadmap = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetRole: '',
    currentSkills: '',
    difficultyLevel: '',
    duration: '',
  });

  const [aiSkills, setAiSkills] = useState<string[] | null>(null);
  const [aiMilestones, setAiMilestones] = useState<any[] | null>(null);


  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAIRoadmap = async () => {
    if (!formData.targetRole || !formData.currentSkills) {
      toast({
        title: "Missing Information",
        description: "Please provide target role and current skills for AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: {
          targetRole: formData.targetRole,
          currentSkills: formData.currentSkills,
          difficultyLevel: formData.difficultyLevel || 'intermediate',
          duration: formData.duration || '12',
        },
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        currentSkills: Array.isArray(data.skills) && data.skills.length ? data.skills.join(', ') : prev.currentSkills,
      }));

      setAiSkills(Array.isArray(data.skills) ? data.skills : null);
      setAiMilestones(Array.isArray(data.milestones) ? data.milestones : null);

      toast({
        title: "AI Roadmap Generated!",
        description: "Your personalized roadmap has been created. Review and save it.",
      });
    } catch (error) {
      console.error('Error generating roadmap:', error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Unable to generate AI roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRoadmap = async () => {
    if (!formData.title || !formData.targetRole) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a title and target role.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const skillsArray = formData.currentSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const finalSkills = aiSkills && aiSkills.length ? aiSkills : skillsArray;

      const { error } = await supabase
        .from('roadmaps')
        .insert({
          user_id: user!.id,
          title: formData.title,
          description: formData.description,
          target_role: formData.targetRole,
          difficulty_level: formData.difficultyLevel,
          estimated_duration_weeks: formData.duration ? parseInt(formData.duration) : null,
          skills_to_learn: finalSkills,
          milestones: aiMilestones || null,
          ai_generated: true,
        });

      if (error) throw error;

      toast({
        title: "Roadmap Saved!",
        description: "Your roadmap has been created successfully.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving roadmap:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-lg"></div>
            <h1 className="text-xl font-bold">Create AI Roadmap</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create Your Learning Roadmap</h2>
          <p className="text-muted-foreground">
            Let AI create a personalized placement preparation roadmap based on your goals and current skills
          </p>
        </div>

        <div className="grid gap-6">
          {/* AI Generation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI-Powered Generation
              </CardTitle>
              <CardDescription>
                Provide your details and let AI create a customized roadmap for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role *</Label>
                  <Input
                    id="targetRole"
                    placeholder="e.g., Software Engineer, Data Scientist"
                    value={formData.targetRole}
                    onChange={(e) => handleInputChange('targetRole', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                  <Select value={formData.difficultyLevel} onValueChange={(value) => handleInputChange('difficultyLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSkills">Current Skills & Experience *</Label>
                <Textarea
                  id="currentSkills"
                  placeholder="Describe your current skills, programming languages, experience level, etc."
                  value={formData.currentSkills}
                  onChange={(e) => handleInputChange('currentSkills', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (weeks)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="12"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                />
              </div>

              <Button 
                onClick={generateAIRoadmap} 
                disabled={isGenerating || !formData.targetRole || !formData.currentSkills}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating AI Roadmap...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate AI Roadmap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Roadmap Details
              </CardTitle>
              <CardDescription>
                Review and customize your roadmap details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Roadmap Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Frontend Developer Placement Preparation"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this roadmap will help you achieve..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Save your roadmap to start tracking progress</span>
                </div>
                <Button 
                  onClick={saveRoadmap} 
                  disabled={isSaving || !formData.title || !formData.targetRole}
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Roadmap'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateRoadmap;