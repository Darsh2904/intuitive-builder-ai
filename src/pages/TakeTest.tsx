import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Brain,
  Target
} from 'lucide-react';

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  test_type: string | null;
  duration_minutes: number | null;
  max_score: number | null;
  questions: any;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const TakeTest = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user && id) {
      fetchTestData();
    }
  }, [user, id]);

  // Timer effect
  useEffect(() => {
    if (hasStarted && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasStarted, timeLeft]);

  const fetchTestData = async () => {
    try {
      const { data: testData, error: testError } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (testError) {
        console.error('Error fetching test:', testError);
        toast({
          title: "Error",
          description: "Failed to load test data.",
          variant: "destructive",
        });
        return;
      }

      if (!testData) {
        toast({
          title: "Not Found",
          description: "Test not found or you don't have access to it.",
          variant: "destructive",
        });
        navigate('/mock-tests');
        return;
      }

      setTest(testData);
      
      // Parse questions
      if (testData.questions && Array.isArray(testData.questions)) {
        setQuestions(testData.questions as unknown as Question[]);
      } else {
        toast({
          title: "Error",  
          description: "This test has no questions available.",
          variant: "destructive",
        });
        navigate('/mock-tests');
        return;
      }

      // Set timer if duration is specified
      if (testData.duration_minutes) {
        setTimeLeft(testData.duration_minutes * 60);
      }
    } catch (error) {
      console.error('Error fetching test data:', error);
      toast({
        title: "Error",
        description: "Unable to load test data.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const startTest = () => {
    setHasStarted(true);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    return Math.round((correctAnswers / questions.length) * 100);
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const finalScore = calculateScore();
      const timeTaken = test?.duration_minutes 
        ? test.duration_minutes - Math.floor((timeLeft || 0) / 60)
        : null;

      const { error } = await supabase
        .from('test_results')
        .insert({
          user_id: user!.id,
          test_id: id!,
          score: finalScore,
          time_taken_minutes: timeTaken,
          answers: answers,
        });

      if (error) throw error;

      setScore(finalScore);
      setShowResults(true);
      
      toast({
        title: "Test Completed!",
        description: `You scored ${finalScore}%. Results saved successfully.`,
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "Error",
        description: "Failed to save test results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.round(((currentQuestion + 1) / questions.length) * 100);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!test) {
    return <Navigate to="/mock-tests" replace />;
  }

  // Show results
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mock-tests')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-lg"></div>
              <h1 className="text-xl font-bold">Test Results</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              {score >= 70 ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : (
                <AlertCircle className="h-10 w-10 text-orange-500" />
              )}
            </div>
            <h2 className="text-3xl font-bold mb-2">Test Completed!</h2>
            <p className="text-muted-foreground mb-4">{test.title}</p>
            <div className="text-6xl font-bold text-primary mb-2">{score}%</div>
            <p className="text-muted-foreground">
              You answered {Object.keys(answers).filter(key => answers[parseInt(key)] === questions[parseInt(key)]?.correctAnswer).length} out of {questions.length} questions correctly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{score}%</div>
                <p className="text-sm text-muted-foreground">Final Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{getAnsweredCount()}/{questions.length}</div>
                <p className="text-sm text-muted-foreground">Questions Answered</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {test.duration_minutes ? Math.max(0, test.duration_minutes - Math.floor((timeLeft || 0) / 60)) : '--'}
                </div>
                <p className="text-sm text-muted-foreground">Minutes Taken</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/mock-tests')}>
              Back to Tests
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retake Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mock-tests')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-lg"></div>
              <h1 className="text-xl font-bold">Mock Test</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{test.title}</CardTitle>
              <CardDescription>
                {test.description || 'Ready to test your knowledge?'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {test.test_type && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{test.test_type}</Badge>
                  </div>
                )}
                {test.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{test.duration_minutes} minutes</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{questions.length} questions</span>
                </div>
                {test.max_score && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Max: {test.max_score} points</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Instructions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Answer all questions to the best of your ability</li>
                  <li>• You can navigate between questions using the question navigator</li>
                  {test.duration_minutes && <li>• The test will auto-submit when time runs out</li>}
                  <li>• Review your answers before submitting</li>
                </ul>
              </div>

              <Button onClick={startTest} className="w-full" size="lg">
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show test interface
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
      {/* Header with timer and progress */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-lg"></div>
                <h1 className="text-xl font-bold">{test.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={`font-mono ${timeLeft < 300 ? 'text-destructive' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {getAnsweredCount()}/{questions.length} answered
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
                <Progress value={getProgressPercentage()} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestion === index ? "default" : answers[index] !== undefined ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => goToQuestion(index)}
                      className="aspect-square p-0 text-xs"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Question {currentQuestion + 1} of {questions.length}
                    </CardTitle>
                    <CardDescription>
                      Choose the best answer
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {currentQuestion + 1}/{questions.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg font-medium">
                  {currentQ.question}
                </div>

                <RadioGroup
                  value={answers[currentQuestion]?.toString()}
                  onValueChange={(value) => handleAnswerChange(currentQuestion, parseInt(value))}
                >
                  {currentQ.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    {currentQuestion === questions.length - 1 ? (
                      <Button
                        onClick={handleSubmitTest}
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion}>
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;