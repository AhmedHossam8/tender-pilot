import React, { useState } from 'react';
import { useAnalyzeProject, useCheckCompliance, useGenerateOutline, useAIHealth } from '@/hooks/useAI';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { Sparkles, Shield, FileText, Activity, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
          toast.success(t('analysisComplete'));
          console.log('Analysis:', response.data);
        },
        onError: (error) => {
          toast.error(`${t('analysisFailed')}: ${error.message}`);
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
          toast.success(t('complianceCheckComplete'));
          console.log('Compliance:', response.data);
        },
        onError: (error) => {
          toast.error(`${t('complianceCheckFailed')}: ${error.message}`);
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
          toast.success(t('outlineGenerated'));
          console.log('Outline:', response.data);
        },
        onError: (error) => {
          toast.error(`${t('outlineGenerationFailed')}: ${error.message}`);
        }
      }
    );
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('aiFeaturesDemo')}</h2>
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
              {t('aiEngineStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">{t('provider')}</div>
                <div className="font-semibold">{health.provider}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('model')}</div>
                <div className="font-semibold">{health.model}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('requestsToday')}</div>
                <div className="font-semibold">{health.requests_today || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('available')}</div>
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
            {t('projectAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="quick">{t('quick')}</option>
              <option value="standard">{t('standard')}</option>
              <option value="detailed">{t('detailed')}</option>
            </select>
            
            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || !projectId}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {analyzing ? t('analyzing') : t('analyzeProject')}
            </Button>
          </div>
          
          {analysisData && (
            <div className="mt-4 space-y-3 p-4 bg-blue-50 rounded">
              <div className="font-semibold text-lg">{t('analysisResults')}</div>
              
              <div>
                <div className="text-sm text-gray-600">{t('summary')}</div>
                <p>{analysisData.data.analysis?.summary}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">{t('complexity')}</div>
                  <Badge>{analysisData.data.analysis?.estimated_complexity}</Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('confidence')}</div>
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
                  <div className="text-sm text-gray-600 mb-2">{t('keyRequirements')}</div>
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
                <span>{t('tokens')}: {analysisData.data.tokens_used}</span>
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
            {t('complianceCheck')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleCheckCompliance} 
            disabled={checking || !projectId}
          >
            <Shield className="h-4 w-4 mr-2" />
            {checking ? t('checking') : t('checkCompliance')}
          </Button>
          
          {complianceData && (
            <div className="mt-4 space-y-3 p-4 bg-green-50 rounded">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-lg">{t('complianceResults')}</div>
                <div className="text-2xl font-bold">
                  {complianceData.data.compliance_score}%
                </div>
              </div>
              
              {complianceData.data.gaps && complianceData.data.gaps.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">{t('gapsFound')}</div>
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
            {t('proposalOutline')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="brief">{t('brief')}</option>
              <option value="standard">{t('standard')}</option>
              <option value="detailed">{t('detailed')}</option>
              <option value="comprehensive">{t('comprehensive')}</option>
            </select>
            
            <Button 
              onClick={handleGenerateOutline} 
              disabled={generating || !projectId}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? t('generating') : t('generateOutline')}
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
                    {t('suggestedLength')}: {section.suggested_length}
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
            <div className="font-semibold">{t('notes')}:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>{t('note1')}</li>
              <li>{t('note2')}</li>
              <li>{t('note3')}</li>
              <li>{t('note4')}</li>
              <li>{t('note5')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIFeaturesDemo;
