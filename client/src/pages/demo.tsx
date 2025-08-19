import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Database, 
  TrendingUp, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Search,
  Zap,
  Target,
  Shield,
  FileText,
  MessageSquare,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export default function Demo() {
  const [activeDemo, setActiveDemo] = useState("exploratory");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [nlpQuery, setNlpQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);

  // Simulated hospital data
  const hospitalData = {
    patients: 2847,
    beds: 450,
    occupancyRate: 85,
    avgLOS: 4.2,
    readmissionRate: 12.3,
    staffUtilization: 92,
    departments: ['Emergency', 'ICU', 'Surgery', 'Cardiology', 'Orthopedics']
  };

  const admissionTrends = [
    { month: 'Jan', admissions: 850, discharges: 820, readmissions: 104 },
    { month: 'Feb', admissions: 920, discharges: 890, readmissions: 113 },
    { month: 'Mar', admissions: 1050, discharges: 1020, readmissions: 129 },
    { month: 'Apr', admissions: 980, discharges: 950, readmissions: 117 },
    { month: 'May', admissions: 1100, discharges: 1080, readmissions: 135 },
    { month: 'Jun', admissions: 1200, discharges: 1150, readmissions: 142 }
  ];

  const resourceUtilization = [
    { resource: 'ICU Beds', utilization: 95, capacity: 50 },
    { resource: 'OR Suites', utilization: 87, capacity: 12 },
    { resource: 'Emergency Bays', utilization: 78, capacity: 24 },
    { resource: 'General Beds', utilization: 82, capacity: 300 },
    { resource: 'Nursing Staff', utilization: 94, capacity: 180 }
  ];

  const patientRiskData = [
    { name: 'Low Risk', value: 65, count: 1850 },
    { name: 'Medium Risk', value: 25, count: 712 },
    { name: 'High Risk', value: 8, count: 228 },
    { name: 'Critical Risk', value: 2, count: 57 }
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#7C2D12'];

  const runExploratoryAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setInsights([]);

    const steps = [
      "Scanning patient records database...",
      "Analyzing admission patterns...",
      "Identifying resource utilization trends...", 
      "Detecting readmission risk factors...",
      "Correlating length of stay with outcomes...",
      "Generating actionable insights..."
    ];

    let step = 0;
    const interval = setInterval(() => {
      setAnalysisProgress((step + 1) * (100 / steps.length));
      
      if (step < steps.length) {
        if (step === 3) {
          // Add insight about readmissions
          setInsights(prev => [...prev, {
            type: "pattern",
            title: "Readmission Hotspot Identified",
            description: "Patients with diabetes and heart conditions show 34% higher readmission rates",
            impact: "High",
            action: "Implement specialized discharge protocols"
          }]);
        }
        
        if (step === 4) {
          // Add insight about LOS
          setInsights(prev => [...prev, {
            type: "efficiency",
            title: "Length of Stay Optimization",
            description: "Surgery patients staying >6 days have 2.3x higher costs with similar outcomes",
            impact: "Medium",
            action: "Review discharge criteria for surgical patients"
          }]);
        }

        if (step === 5) {
          // Add insight about resources
          setInsights(prev => [...prev, {
            type: "resource",
            title: "ICU Capacity Strain Detected",
            description: "ICU occupancy peaks Tuesday-Thursday, causing 18% of transfers to be delayed",
            impact: "High", 
            action: "Consider flexible staffing model for mid-week surge"
          }]);
        }
        
        step++;
      } else {
        clearInterval(interval);
        setIsAnalyzing(false);
      }
    }, 800);
  };

  const processNLPQuery = (query: string) => {
    // Simulate NLP processing
    const responses = {
      "readmission": {
        answer: "Current readmission rate is 12.3%. Primary factors: diabetes complications (31%), heart conditions (28%), and medication non-compliance (19%).",
        charts: ["readmission_trends"],
        recommendations: ["Implement diabetes education program", "Enhanced medication reconciliation"]
      },
      "beds": {
        answer: "Bed occupancy is 85% (383/450 beds). ICU at 95% capacity is the main bottleneck. Peak demand occurs Tuesday-Thursday.",
        charts: ["bed_utilization"],
        recommendations: ["Add 2 ICU beds", "Implement flexible staffing"]
      },
      "costs": {
        answer: "Average cost per patient is $12,500. Surgery patients staying >6 days drive 23% cost overruns with minimal outcome improvement.",
        charts: ["cost_analysis"],
        recommendations: ["Review surgical discharge protocols", "Implement cost monitoring dashboard"]
      }
    };

    const key = Object.keys(responses).find(k => query.toLowerCase().includes(k));
    return key ? responses[key as keyof typeof responses] : {
      answer: "I analyzed your query. Based on current data patterns, I recommend exploring patient flow optimization and resource allocation strategies.",
      charts: [],
      recommendations: ["Review current processes", "Implement data monitoring"]
    };
  };

  const generatePredictions = () => {
    setPredictions([
      {
        type: "Admissions",
        period: "Next 7 Days",
        predicted: 245,
        confidence: 87,
        trend: "up",
        impact: "Prepare 8 additional beds"
      },
      {
        type: "Readmissions", 
        period: "Next 30 Days",
        predicted: 67,
        confidence: 82,
        trend: "down",
        impact: "12% reduction from interventions"
      },
      {
        type: "Staff Demand",
        period: "Next Week",
        predicted: "High Tuesday-Thursday",
        confidence: 91,
        trend: "up",
        impact: "Schedule 15% more nurses Wed"
      },
      {
        type: "ICU Capacity",
        period: "Next 48 Hours", 
        predicted: "98% utilization",
        confidence: 95,
        trend: "up",
        impact: "Critical - prepare overflow plan"
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-50 via-white to-medical-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-clinical-gray-900 mb-4">
            MEDFLECT AI Live Demo
          </h1>
          <p className="text-xl text-clinical-gray-600 mb-6">
            Transforming Hospital Data into Actionable Clinical Intelligence
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>AI Models Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>FHIR Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Blockchain Secured</span>
            </div>
          </div>
        </div>

        {/* Problem Statement */}
        <Card className="mb-8 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Current Hospital Challenge</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Underutilized Data</h3>
                <p className="text-sm text-gray-600">Extensive datasets remain unexplored, limiting insights and optimization opportunities</p>
              </div>
              <div className="text-center">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Manual Analysis</h3>
                <p className="text-sm text-gray-600">No systematic approach to uncover patterns, correlations, or inefficiencies</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Reactive Operations</h3>
                <p className="text-sm text-gray-600">Lack of predictive capabilities to anticipate and prevent challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solution Tabs */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exploratory" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Exploratory Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="querying" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>NLP Querying</span>
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Predictive Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Decision Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Exploratory Analysis Tab */}
          <TabsContent value="exploratory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>Automated Exploratory Analysis</span>
                </CardTitle>
                <CardDescription>
                  AI-powered system processes hospital data to uncover hidden patterns and inefficiencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={runExploratoryAnalysis} 
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2"
                    >
                      {isAnalyzing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isAnalyzing ? 'Analyzing...' : 'Start Analysis'}</span>
                    </Button>
                    {isAnalyzing && (
                      <div className="flex-1">
                        <Progress value={analysisProgress} className="h-2" />
                        <p className="text-sm text-gray-600 mt-1">{analysisProgress.toFixed(0)}% Complete</p>
                      </div>
                    )}
                  </div>

                  {insights.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Discovered Insights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {insights.map((insight, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-sm">{insight.title}</h4>
                                <Badge variant={insight.impact === 'High' ? 'destructive' : 'secondary'}>
                                  {insight.impact}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                              <div className="flex items-center space-x-2 text-xs">
                                <ArrowRight className="w-3 h-3" />
                                <span className="font-medium">{insight.action}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Data Visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Admission Trends Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={admissionTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="admissions" stroke="#2563eb" strokeWidth={2} />
                            <Line type="monotone" dataKey="readmissions" stroke="#dc2626" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Resource Utilization</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={resourceUtilization}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="resource" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="utilization" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NLP Querying Tab */}
          <TabsContent value="querying" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span>Natural Language Querying</span>
                </CardTitle>
                <CardDescription>
                  Ask questions about your hospital data in plain English and get instant insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Ask about readmissions, bed utilization, costs, or any hospital metric..."
                      value={nlpQuery}
                      onChange={(e) => setNlpQuery(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && processNLPQuery(nlpQuery)}
                    />
                    <Button onClick={() => processNLPQuery(nlpQuery)}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Sample Queries */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Try these sample queries:</p>
                    <div className="flex flex-wrap gap-2">
                      {["What's driving readmissions?", "Show me bed utilization", "Why are costs increasing?"].map((query) => (
                        <Button
                          key={query}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNlpQuery(query);
                            processNLPQuery(query);
                          }}
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Mock Response */}
                  {nlpQuery && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Brain className="w-5 h-5 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">AI Analysis Result</h4>
                            <p className="text-sm mb-3">{processNLPQuery(nlpQuery).answer}</p>
                            {processNLPQuery(nlpQuery).recommendations.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Recommendations:</p>
                                <ul className="text-xs space-y-1">
                                  {processNLPQuery(nlpQuery).recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-center space-x-1">
                                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Real-time Metrics Dashboard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{hospitalData.patients}</p>
                        <p className="text-xs text-gray-600">Active Patients</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{hospitalData.occupancyRate}%</p>
                        <p className="text-xs text-gray-600">Bed Occupancy</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{hospitalData.avgLOS}</p>
                        <p className="text-xs text-gray-600">Avg LOS (days)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <RotateCcw className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{hospitalData.readmissionRate}%</p>
                        <p className="text-xs text-gray-600">Readmission Rate</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictive Analytics Tab */}
          <TabsContent value="predictive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>Predictive Analytics Engine</span>
                </CardTitle>
                <CardDescription>
                  ML models forecast future scenarios to enable proactive decision-making
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Button onClick={generatePredictions} className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Generate Predictions</span>
                  </Button>

                  {predictions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {predictions.map((pred, index) => (
                        <Card key={index} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{pred.type}</h4>
                              <Badge variant="outline">{pred.confidence}% confidence</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{pred.period}</p>
                            <p className="text-lg font-bold mb-2">{pred.predicted}</p>
                            <div className="flex items-center space-x-2 text-xs">
                              <Target className="w-3 h-3" />
                              <span className="font-medium">{pred.impact}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Risk Stratification */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Patient Risk Stratification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-6">
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={patientRiskData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {patientRiskData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {patientRiskData.map((risk, index) => (
                            <div key={risk.name} className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index] }}
                              ></div>
                              <span className="text-sm">{risk.name}: {risk.count} patients</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decision Support Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Actionable Decision Support</span>
                </CardTitle>
                <CardDescription>
                  AI-generated recommendations to optimize operations and improve patient care
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* High Priority Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span>Immediate Actions Required</span>
                    </h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">ICU Capacity Crisis</h4>
                            <Badge variant="destructive">Critical</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">ICU at 98% capacity with 3 incoming critical patients</p>
                          <p className="text-xs font-medium">Action: Activate overflow protocol and consider early discharge review</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Staffing Shortage Alert</h4>
                            <Badge variant="secondary">High</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Wednesday predicted to have 15% nursing shortage</p>
                          <p className="text-xs font-medium">Action: Schedule additional staff or consider per-diem coverage</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Strategic Improvements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span>Strategic Improvements</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Reduce Readmissions</h4>
                          <p className="text-sm text-gray-600 mb-2">Implement enhanced discharge planning for diabetes patients</p>
                          <div className="text-xs space-y-1">
                            <p><strong>Expected Impact:</strong> 23% reduction in 30-day readmissions</p>
                            <p><strong>Cost Savings:</strong> $2.3M annually</p>
                            <p><strong>Timeline:</strong> 6 weeks implementation</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Optimize OR Scheduling</h4>
                          <p className="text-sm text-gray-600 mb-2">Adjust surgical block times based on historical data</p>
                          <div className="text-xs space-y-1">
                            <p><strong>Expected Impact:</strong> 12% increase in OR utilization</p>
                            <p><strong>Revenue Increase:</strong> $1.8M annually</p>
                            <p><strong>Timeline:</strong> 2 weeks implementation</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* ROI Calculator */}
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <span>Projected Impact</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">$4.1M</p>
                          <p className="text-sm text-gray-600">Annual Savings</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">23%</p>
                          <p className="text-sm text-gray-600">Efficiency Gain</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">8.5x</p>
                          <p className="text-sm text-gray-600">ROI Multiple</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-medical-blue-600 to-medical-blue-700 text-white">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Transform Your Hospital Data Today</h2>
            <p className="text-lg mb-6">
              See how MEDFLECT AI turns your underutilized data into competitive advantage
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" variant="secondary">
                Schedule Demo
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Start Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}