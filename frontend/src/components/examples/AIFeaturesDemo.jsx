import React, { useState } from 'react';
import { useAnalyzeProject, useCheckCompliance, useGenerateOutline, useAIHealth } from '@/hooks/useAI';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { Sparkles, Shield, FileText, Activity, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AI Features Demo Component
 * 
 * This component demonstrates how to use the AI functionality in your app.
 * 
 * Features demonstrated:
 * 1. Health check - Check if AI is available
 * 2. Project analysis - Analyze project documents
 * 3. Compliance check - Check proposal compliance
 * 4. Outline generation - Generate proposal outline
 * 
 * Usage:
 * <AIFeaturesDemo projectId="your-project-uuid" />
 */
function AIFeaturesDemo({ projectId }) {
  const [selectedDepth, setSelectedDepth] = useState('standard');
  const [selectedStyle, setSelectedStyle] = useState('standard');
  
  // AI Health
  const { data: health, isLoading: healthLoading } = useAIHealth();
  
  // Analysis
  const { 
    mutate: analyzeProject, 
    data: analysisData, 
    isPending: analyzing 
  } = useAnalyzeProject();
  
  // Compliance
  const { 
    mutate: checkCompliance, 
    data: complianceData, 
    isPending: checking 
  } = useCheckCompliance();
  
  // Outline
  const { 
    mutate: generateOutline, 
    data: outlineData, 
    isPending: generating 
  } = useGenerateOutline();
  
  // Handlers
  const handleAnalyze = () => {
    analyzeProject(
      {
        projectId,
        payload: {
          analysis_depth: selectedDepth,
          force_refresh: false,
          include_documents: true
        }
      },
      {
        onSuccess: (response) => {
          toast.success('Analysis complete!');
          console.log('Analysis:', response.data);
        },
        onError: (error) => {
          toast.error(`Analysis failed: ${error.message}`);
        }
      }
    );
  };
  
  const handleCheckCompliance = () => {
    checkCompliance(
      {
        projectId,
        payload: {
          // You can provide proposal_id or proposal_content
          // proposal_id: 'some-proposal-uuid',
          sections_to_check: ['technical', 'financial']
        }
      },
      {
        onSuccess: (response) => {
          toast.success('Compliance check complete!');
          console.log('Compliance:', response.data);
        },
        onError: (error) => {
          toast.error(`Compliance check failed: ${error.message}`);
        }
      }
    );
  };
  
  const handleGenerateOutline = () => {
    generateOutline(
      {
        projectId,
        payload: {
          style: selectedStyle,
          include_examples: true,
          target_length: '30-40 pages'
        }
      },
      {
        onSuccess: (response) => {
          toast.success('Outline generated!');
          console.log('Outline:', response.data);
        },
        onError: (error) => {
          toast.error(`Outline generation failed: ${error.message}`);
        }
      }
    );
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Features Demo</h2>
        {health && (
          <Badge variant={health.status === 'healthy' ? 'success' : 'destructive'}>
            <Activity className="h-3 w-3 mr-1" />
            {health.status}
          </Badge>
        )}
      </div>
      
      {/* Health Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Engine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Provider</div>
                <div className="font-semibold">{health.provider}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Model</div>
                <div className="font-semibold">{health.model}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Requests Today</div>
                <div className="font-semibold">{health.requests_today || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Available</div>
                <div className="font-semibold">
                  {health.available ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Project Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Project Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="detailed">Detailed</option>
            </select>
            
            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || !projectId}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {analyzing ? 'Analyzing...' : 'Analyze Project'}
            </Button>
          </div>
          
          {analysisData && (
            <div className="mt-4 space-y-3 p-4 bg-blue-50 rounded">
              <div className="font-semibold text-lg">Analysis Results</div>
              
              <div>
                <div className="text-sm text-gray-600">Summary</div>
                <p>{analysisData.data.analysis?.summary}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Complexity</div>
                  <Badge>{analysisData.data.analysis?.estimated_complexity}</Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="font-semibold">
                    {analysisData.data.analysis?.confidence_level}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{analysisData.data.processing_time_ms}ms</span>
                </div>
              </div>
              
              {analysisData.data.analysis?.key_requirements && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Key Requirements</div>
                  <ul className="space-y-1">
                    {analysisData.data.analysis.key_requirements.slice(0, 3).map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500">•</span>
                        <span>{req.requirement}</span>
                        <Badge variant="outline" className="ml-auto">
                          {req.priority}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Tokens: {analysisData.data.tokens_used}</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {analysisData.data.cost?.toFixed(4) || '0.0000'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Compliance Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleCheckCompliance} 
            disabled={checking || !projectId}
          >
            <Shield className="h-4 w-4 mr-2" />
            {checking ? 'Checking...' : 'Check Compliance'}
          </Button>
          
          {complianceData && (
            <div className="mt-4 space-y-3 p-4 bg-green-50 rounded">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-lg">Compliance Results</div>
                <div className="text-2xl font-bold">
                  {complianceData.data.compliance_score}%
                </div>
              </div>
              
              {complianceData.data.gaps && complianceData.data.gaps.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Gaps Found</div>
                  {complianceData.data.gaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded mb-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{gap.requirement}</div>
                        <div className="text-sm text-gray-600">{gap.suggestion}</div>
                      </div>
                      <Badge variant={gap.severity === 'critical' ? 'destructive' : 'default'}>
                        {gap.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Outline Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposal Outline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="brief">Brief</option>
              <option value="standard">Standard</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
            
            <Button 
              onClick={handleGenerateOutline} 
              disabled={generating || !projectId}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Outline'}
            </Button>
          </div>
          
          {outlineData && (
            <div className="mt-4 space-y-3">
              <div className="font-semibold text-lg">
                {outlineData.data.outline?.title}
              </div>
              
              {outlineData.data.outline?.sections?.map((section, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold">
                      {section.section_number}. {section.name}
                    </div>
                    <Badge>{section.priority}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                  
                  <div className="text-xs text-gray-500">
                    Suggested length: {section.suggested_length}
                  </div>
                  
                  {section.key_points && section.key_points.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {section.key_points.map((point, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-500">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Usage Notes */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <div className="font-semibold">📝 Notes:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Project must have uploaded documents for analysis to work</li>
              <li>Results are cached for 24 hours (use force_refresh to bypass)</li>
              <li>Rate limit: 10 requests per hour per user</li>
              <li>Using Gemini 2.5 Flash (free tier) by default</li>
              <li>Check console for full response data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIFeaturesDemo;
