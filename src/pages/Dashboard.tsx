import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  BookOpen, 
  Target, 
  Trophy, 
  Plus, 
  Calendar,
  TrendingUp,
  Building2
} from 'lucide-react';

interface Profile {
  full_name: string | null;
  university: string | null;
  graduation_year: number | null;
  degree: string | null;
  skills: string[] | null;
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  target_role: string | null;
  difficulty_level: string | null;
  estimated_duration_weeks: number | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, university, graduation_year, degree, skills')
        .eq('user_id', user!.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch user roadmaps
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('id, title, description, target_role, difficulty_level, estimated_duration_weeks, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (roadmapError) {
        console.error('Error fetching roadmaps:', roadmapError);
      } else {
        setRoadmaps(roadmapData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error loading data",
        description: "Unable to load your dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "See you next time!",
    });
  };

  if (loading || loadingData) {
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-lg"></div>
            <h1 className="text-xl font-bold">CrackIt AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, {profile?.full_name || 'Student'}!
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome to your Dashboard
          </h2>
          <p className="text-muted-foreground">
            Track your progress and continue your placement preparation journey
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-r from-primary to-primary/60 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Profile Overview</CardTitle>
                <CardDescription>
                  {profile?.university && profile?.graduation_year 
                    ? `${profile.university} • Class of ${profile.graduation_year}`
                    : 'Complete your profile to get started'
                  }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No skills added yet
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Active Roadmaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roadmaps.length}</div>
                <p className="text-sm text-muted-foreground">
                  Learning paths in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Goals Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">
                  Milestones achieved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Test Score Avg</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-sm text-muted-foreground">
                  Take tests to see your average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Roadmaps */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Roadmaps</CardTitle>
                <CardDescription>
                  Your latest learning paths and preparation plans
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => window.location.href = '/create-roadmap'}>
                <Plus className="h-4 w-4 mr-1" />
                Create New
              </Button>
            </CardHeader>
            <CardContent>
              {roadmaps.length > 0 ? (
                <div className="space-y-4">
                  {roadmaps.map((roadmap) => (
                    <div
                      key={roadmap.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/roadmap/${roadmap.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{roadmap.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {roadmap.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {roadmap.target_role && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {roadmap.target_role}
                            </span>
                          )}
                          {roadmap.estimated_duration_weeks && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {roadmap.estimated_duration_weeks} weeks
                            </span>
                          )}
                          {roadmap.difficulty_level && (
                            <Badge variant="outline" className="text-xs">
                              {roadmap.difficulty_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Progress value={0} className="w-20" />
                        <span className="text-xs text-muted-foreground">0% complete</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No roadmaps yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first AI-powered learning roadmap to get started
                  </p>
                  <Button onClick={() => window.location.href = '/create-roadmap'}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Your First Roadmap
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;