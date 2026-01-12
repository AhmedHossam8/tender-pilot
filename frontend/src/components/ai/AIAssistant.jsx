/**
 * AI Assistant - Interactive AI Chat Interface
 * 
 * Provides a conversational interface for users to ask questions about projects,
 * get recommendations, and receive AI assistance in real-time.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from "react-i18next";

export function AIAssistant({ projectId, context = 'project' }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t("aiAssistantWelcome"),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  
  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const quickActions = [
    { icon: Lightbulb, label: t("optimizeMyBid"), action: 'optimize' },
    { icon: CheckCircle2, label: t("successProbability"), action: 'probability' },
    { icon: Sparkles, label: t("improveProposal"), action: 'improve' },
  ];
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = {
        role: 'assistant',
        content: generateContextualResponse(input, context, projectId, t),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: t("aiError"),
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickAction = (action) => {
    const prompts = {
      optimize: t("optimizeBidPrompt"),
      probability: t("probabilityPrompt"),
      improve: t("improveProposalPrompt")
    };
    
    setInput(prompts[action]);
  };
  
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          {t("aiAssistant")}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.error
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Quick Actions */}
        <div className="border-t border-b bg-gray-50 p-3">
          <div className="flex gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="flex-1"
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t("askMeAnything")}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {t("send")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function generateContextualResponse(question, context, projectId, t) {
  // Simulate intelligent responses based on context
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('optimize') || lowerQuestion.includes('improve')) {
    return t("optimizationResponse");
  }
  
  if (lowerQuestion.includes('probability') || lowerQuestion.includes('chances')) {
    return t("probabilityResponse");
  }
  
  if (lowerQuestion.includes('competition') || lowerQuestion.includes('other bids')) {
    return t("competitionResponse");
  }
  
  // Default response
  return t("defaultResponse");
}

export default AIAssistant;
