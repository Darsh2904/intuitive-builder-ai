import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Bot,
  Brain,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const CreateTest = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    testType: '',
    duration: '',
    topic: '',
    difficulty: '',
    questionCount: '10',
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  // Redirect if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const generateAIQuestions = async () => {
    if (!testData.topic || !testData.testType) {
      toast({
        title: "Missing Information",
        description: "Please provide topic and test type for AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-test-questions', {
        body: {
          topic: testData.topic,
          testType: testData.testType,
          difficulty: testData.difficulty || 'intermediate',
          questionCount: parseInt(testData.questionCount) || 10,
        },
      });

      if (error) throw error;

      setQuestions(data.questions || []);
      setTestData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
      }));

      toast({
        title: "Questions Generated!",
        description: `${data.questions?.length || 0} questions have been created.`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const saveTest = async () => {
    if (!testData.title || questions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and at least one question.",
        variant: "destructive",
      });
      return;
    }

    // Validate all questions have content
    const invalidQuestions = questions.filter(q => 
      !q.question.trim() || 
      q.options.some(opt => !opt.trim()) ||
      q.correctAnswer < 0 || 
      q.correctAnswer >= q.options.length
    );

    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid Questions",
        description: "Please complete all questions with valid options and correct answers.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('mock_tests')
        .insert({
          user_id: user!.id,
          title: testData.title,
          description: testData.description,
          test_type: testData.testType,
          duration_minutes: testData.duration ? parseInt(testData.duration) : null,
          max_score: questions.length * 10, // 10 points per question
          questions: questions as any,
        });

      if (error) throw error;

      toast({
        title: "Test Created!",
        description: "Your mock test has been saved successfully.",
      });
      
      navigate('/mock-tests');
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save test. Please try again.",
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
            onClick={() => navigate('/mock-tests')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-lg"></div>
            <h1 className="text-xl font-bold">Create Mock Test</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create New Mock Test</h2>
          <p className="text-muted-foreground">
            Build a custom test or let AI generate questions based on your requirements
          </p>
        </div>

        <div className="space-y-6">
          {/* Test Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Test Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., JavaScript Fundamentals Quiz"
                    value={testData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={testData.testType} onValueChange={(value) => handleInputChange('testType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="aptitude">Aptitude</SelectItem>
                      <SelectItem value="logical">Logical Reasoning</SelectItem>
                      <SelectItem value="verbal">Verbal Ability</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test covers..."
                  value={testData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={testData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (for AI)</Label>
                  <Input
                    id="topic"
                    placeholder="React, Data Structures, etc."
                    value={testData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={testData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
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
            </CardContent>
          </Card>

          {/* AI Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Question Generation
              </CardTitle>
              <CardDescription>
                Let AI create questions based on your topic and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min="1"
                    max="50"
                    value={testData.questionCount}
                    onChange={(e) => handleInputChange('questionCount', e.target.value)}
                    className="w-24"
                  />
                </div>
                <Button 
                  onClick={generateAIQuestions} 
                  disabled={isGenerating || !testData.topic || !testData.testType}
                  className="mt-8"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Questions ({questions.length})
                </CardTitle>
                <CardDescription>
                  Add questions manually or use AI generation
                </CardDescription>
              </div>
              <Button onClick={addManualQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length > 0 ? (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary">Question {index + 1}</Badge>
                        <Button
                          onClick={() => removeQuestion(question.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question *</Label>
                          <Textarea
                            placeholder="Enter your question here..."
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Options *</Label>
                          <div className="grid gap-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Badge variant={question.correctAnswer === optionIndex ? "default" : "outline"}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </Badge>
                                <Input
                                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optionIndex] = e.target.value;
                                    updateQuestion(question.id, 'options', newOptions);
                                  }}
                                />
                                <Button
                                  onClick={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                                  variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                                  size="sm"
                                >
                                  Correct
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Explanation (Optional)</Label>
                          <Textarea
                            placeholder="Explain why this answer is correct..."
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No questions added</h3>
                  <p className="text-muted-foreground mb-4">
                    Use AI generation or add questions manually
                  </p>
                  <Button onClick={addManualQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Question
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Test */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Save your test to make it available for practice</span>
                </div>
                <Button 
                  onClick={saveTest} 
                  disabled={isSaving || !testData.title || questions.length === 0}
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Test'
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

export default CreateTest;