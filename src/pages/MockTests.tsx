import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  Target, 
  Brain,
  TrendingUp,
  Calendar,
  Play
} from 'lucide-react';

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  test_type: string | null;
  duration_minutes: number | null;
  max_score: number | null;
  questions: any;
  created_at: string;
}

interface TestResult {
  id: string;
  test_id: string;
  score: number | null;
  time_taken_minutes: number | null;
  completed_at: string;
}

const MockTests = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchTestsAndResults();
    }
  }, [user]);

  const fetchTestsAndResults = async () => {
    try {
      // Fetch user's mock tests
      const { data: testsData, error: testsError } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (testsError) {
        console.error('Error fetching tests:', testsError);
      } else {
        setTests(testsData || []);
      }

      // Fetch test results
      const { data: resultsData, error: resultsError } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false });

      if (resultsError) {
        console.error('Error fetching results:', resultsError);
      } else {
        setResults(resultsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Unable to load mock tests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getTestResults = (testId: string) => {
    return results.filter(result => result.test_id === testId);
  };

  const getBestScore = (testId: string) => {
    const testResults = getTestResults(testId);
    if (testResults.length === 0) return null;
    return Math.max(...testResults.map(r => r.score || 0));
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    const validScores = results.filter(r => r.score !== null).map(r => r.score!);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  };

  const getTotalTestsTaken = () => {
    return results.length;
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
          <div className="flex items-center gap-4">
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
              <h1 className="text-xl font-bold">Mock Tests</h1>
            </div>
          </div>
          <Button onClick={() => navigate('/create-test')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tests Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tests.length}</div>
              <p className="text-sm text-muted-foreground">
                Mock tests available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tests Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalTestsTaken()}</div>
              <p className="text-sm text-muted-foreground">
                Total attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAverageScore()}%</div>
              <p className="text-sm text-muted-foreground">
                Across all tests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mock Tests List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Mock Tests</CardTitle>
            <CardDescription>
              Create and take practice tests to prepare for placements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tests.length > 0 ? (
              <div className="space-y-4">
                {tests.map((test) => {
                  const testResults = getTestResults(test.id);
                  const bestScore = getBestScore(test.id);
                  const questionCount = Array.isArray(test.questions) ? test.questions.length : 0;
                  
                  return (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{test.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {test.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {test.test_type && (
                            <Badge variant="outline" className="text-xs">
                              {test.test_type}
                            </Badge>
                          )}
                          {test.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {test.duration_minutes} min
                            </span>
                          )}
                          {questionCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              {questionCount} questions
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {testResults.length} attempts
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {bestScore !== null && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{bestScore}%</div>
                            <p className="text-xs text-muted-foreground">Best Score</p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => navigate(`/take-test/${test.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          {testResults.length > 0 ? 'Retake' : 'Take Test'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No mock tests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first mock test to start practicing
                </p>
                <Button onClick={() => navigate('/create-test')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        {results.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Your latest test performance and scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.slice(0, 5).map((result) => {
                  const test = tests.find(t => t.id === result.test_id);
                  return (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h5 className="font-medium">{test?.title || 'Unknown Test'}</h5>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.completed_at).toLocaleDateString()}
                          {result.time_taken_minutes && ` • ${result.time_taken_minutes} minutes`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {result.score}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MockTests;