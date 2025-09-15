import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Circle,
  Building2,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  target_role: string | null;
  difficulty_level: string | null;
  estimated_duration_weeks: number | null;
  milestones: any | null;
  skills_to_learn: string[] | null;
  created_at: string;
}

interface UserProgress {
  id: string;
  milestone_id: string;
  completed: boolean;
  notes: string | null;
  completion_date: string | null;
}

const RoadmapDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user && id) {
      fetchRoadmapData();
    }
  }, [user, id]);

  const fetchRoadmapData = async () => {
    try {
      // Fetch roadmap
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (roadmapError) {
        console.error('Error fetching roadmap:', roadmapError);
        toast({
          title: "Error",
          description: "Failed to load roadmap details.",
          variant: "destructive",
        });
        return;
      }

      if (!roadmapData) {
        toast({
          title: "Not Found",
          description: "Roadmap not found or you don't have access to it.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setRoadmap(roadmapData);

      // Fetch user progress for this roadmap
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('roadmap_id', id)
        .eq('user_id', user!.id);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      } else {
        setProgress(progressData || []);
        // Initialize notes state
        const notesObj: { [key: string]: string } = {};
        progressData?.forEach(p => {
          if (p.notes) notesObj[p.milestone_id] = p.notes;
        });
        setNotes(notesObj);
      }
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
      toast({
        title: "Error",
        description: "Unable to load roadmap data.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const toggleMilestoneCompletion = async (milestoneId: string, completed: boolean) => {
    try {
      const existingProgress = progress.find(p => p.milestone_id === milestoneId);
      
      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('user_progress')
          .update({
            completed: completed,
            completion_date: completed ? new Date().toISOString() : null,
            notes: notes[milestoneId] || null,
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress entry
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user!.id,
            roadmap_id: id!,
            milestone_id: milestoneId,
            completed: completed,
            completion_date: completed ? new Date().toISOString() : null,
            notes: notes[milestoneId] || null,
          });

        if (error) throw error;
      }

      // Refresh progress data
      await fetchRoadmapData();
      
      toast({
        title: completed ? "Milestone Completed!" : "Milestone Unchecked",
        description: completed 
          ? "Great progress! Keep up the good work." 
          : "Milestone marked as incomplete.",
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateNotes = async (milestoneId: string) => {
    try {
      const existingProgress = progress.find(p => p.milestone_id === milestoneId);
      
      if (existingProgress) {
        const { error } = await supabase
          .from('user_progress')
          .update({ notes: notes[milestoneId] || null })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress entry with notes
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user!.id,
            roadmap_id: id!,
            milestone_id: milestoneId,
            completed: false,
            notes: notes[milestoneId] || null,
          });

        if (error) throw error;
      }

      toast({
        title: "Notes Saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = () => {
    if (!roadmap?.milestones || !Array.isArray(roadmap.milestones) || roadmap.milestones.length === 0) return 0;
    const completedMilestones = progress.filter(p => p.completed).length;
    return Math.round((completedMilestones / roadmap.milestones.length) * 100);
  };

  const isCompleted = (milestoneId: string) => {
    return progress.find(p => p.milestone_id === milestoneId)?.completed || false;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!roadmap) {
    return <Navigate to="/dashboard" replace />;
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
            <h1 className="text-xl font-bold">Roadmap Details</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Roadmap Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{roadmap.title}</h2>
              <p className="text-muted-foreground mb-4">
                {roadmap.description || 'No description available'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{getProgressPercentage()}%</div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {roadmap.target_role && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {roadmap.target_role}
              </Badge>
            )}
            {roadmap.difficulty_level && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {roadmap.difficulty_level}
              </Badge>
            )}
            {roadmap.estimated_duration_weeks && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {roadmap.estimated_duration_weeks} weeks
              </Badge>
            )}
          </div>

          <Progress value={getProgressPercentage()} className="w-full" />
        </div>

        <div className="grid gap-6">
          {/* Skills Section */}
          {roadmap.skills_to_learn && roadmap.skills_to_learn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Skills to Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {roadmap.skills_to_learn.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Learning Milestones
              </CardTitle>
              <CardDescription>
                Track your progress through each milestone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roadmap.milestones && Array.isArray(roadmap.milestones) && roadmap.milestones.length > 0 ? (
                <div className="space-y-6">
                  {roadmap.milestones.map((milestone, index) => {
                    const milestoneId = milestone.id || `milestone-${index}`;
                    const completed = isCompleted(milestoneId);
                    
                    return (
                      <div
                        key={milestoneId}
                        className={`border rounded-lg p-4 transition-colors ${
                          completed ? 'bg-accent/30 border-primary/20' : 'hover:bg-accent/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-center pt-1">
                            <Checkbox
                              checked={completed}
                              onCheckedChange={(checked) => 
                                toggleMilestoneCompletion(milestoneId, checked as boolean)
                              }
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {completed ? 
                                <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              }
                              <h4 className={`font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                                {milestone.title}
                              </h4>
                              {milestone.week && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Week {milestone.week}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {milestone.description}
                            </p>

                            {milestone.tasks && milestone.tasks.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">Tasks:</p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                  {milestone.tasks.map((task: string, taskIndex: number) => (
                                    <li key={taskIndex}>{task}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Notes:</label>
                              <Textarea
                                placeholder="Add your notes, insights, or questions..."
                                value={notes[milestoneId] || ''}
                                onChange={(e) => setNotes(prev => ({ ...prev, [milestoneId]: e.target.value }))}
                                onBlur={() => updateNotes(milestoneId)}
                                className="min-h-[60px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No milestones available</h3>
                  <p className="text-muted-foreground">
                    This roadmap doesn't have detailed milestones yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetail;