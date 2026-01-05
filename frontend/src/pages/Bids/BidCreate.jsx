/**
 * BidCreate Page
 * 
 * Form for creating a new bid on a project.
 * 
 * Features:
 * - Project selection
 * - Cover letter editor with AI assistance
 * - Pricing input with AI suggestions
 * - Timeline estimator
 * - Milestone breakdown
 * - File attachments
 * - Real-time validation
 * - AI-powered assistance buttons
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bidService from '../../services/bid.service';
import { toast } from 'react-toastify';
import { AILoadingIndicator } from '../../components/ai';

const BidCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get project ID from URL if provided
  const projectIdFromUrl = searchParams.get('project');

  // Form state
  const [formData, setFormData] = useState({
    project: projectIdFromUrl || '',
    cover_letter: '',
    proposed_amount: '',
    proposed_timeline: '',
    milestones: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState({
    coverLetter: false,
    pricing: false,
  });
  
  // Real-time bid quality score
  const [bidQuality, setBidQuality] = useState(null);
  const [analyzingQuality, setAnalyzingQuality] = useState(false);

  /**
   * Handle form field changes.
   * Updates the form data state when user types in input fields.
   * Also triggers quality analysis when certain fields change.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Trigger quality analysis if cover letter changes and is long enough
    if (name === 'cover_letter' && value.length >= 50) {
      analyzeBidQuality();
    }
  };
  
  /**
   * Analyze bid quality in real-time as user types.
   * Provides instant feedback on bid strength.
   */
  const analyzeBidQuality = async () => {
    // Debounce: only analyze if we have enough content
    if (!formData.project || formData.cover_letter.length < 50) {
      setBidQuality(null);
      return;
    }
    
    try {
      setAnalyzingQuality(true);
      
      // In a real implementation, this would call an API endpoint
      // For demo purposes, we'll use a simple scoring algorithm
      const score = calculateLocalBidQuality();
      setBidQuality(score);
      
    } catch (error) {
      console.error('Error analyzing bid quality:', error);
    } finally {
      setAnalyzingQuality(false);
    }
  };
  
  /**
   * Calculate bid quality score locally (demo version).
   * In production, this would use an AI API endpoint.
   */
  const calculateLocalBidQuality = () => {
    let score = 0;
    const feedback = [];
    
    // Cover letter length check
    if (formData.cover_letter.length >= 200) {
      score += 25;
      feedback.push({ type: 'good', message: 'Good cover letter length' });
    } else {
      feedback.push({ type: 'warning', message: 'Consider adding more detail to your cover letter' });
    }
    
    // Has pricing
    if (formData.proposed_amount && parseFloat(formData.proposed_amount) > 0) {
      score += 25;
      feedback.push({ type: 'good', message: 'Pricing provided' });
    } else {
      feedback.push({ type: 'warning', message: 'Add pricing to improve your bid' });
    }
    
    // Has timeline
    if (formData.proposed_timeline && parseInt(formData.proposed_timeline) > 0) {
      score += 25;
      feedback.push({ type: 'good', message: 'Timeline specified' });
    } else {
      feedback.push({ type: 'warning', message: 'Add a timeline estimate' });
    }
    
    // Cover letter quality (basic checks)
    const hasKeywords = /experience|skill|project|deliver|quality/i.test(formData.cover_letter);
    if (hasKeywords) {
      score += 25;
      feedback.push({ type: 'good', message: 'Cover letter mentions relevant keywords' });
    } else {
      feedback.push({ type: 'warning', message: 'Consider mentioning your experience and skills' });
    }
    
    return { score, feedback };
  };

  /**
   * Validate the form before submission.
   * Returns true if valid, false otherwise.
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.project) {
      newErrors.project = t('bids.errors.projectRequired', 'Please select a project');
    }

    if (!formData.cover_letter || formData.cover_letter.trim().length < 50) {
      newErrors.cover_letter = t(
        'bids.errors.coverLetterTooShort',
        'Cover letter must be at least 50 characters'
      );
    }

    if (!formData.proposed_amount || parseFloat(formData.proposed_amount) <= 0) {
      newErrors.proposed_amount = t(
        'bids.errors.invalidAmount',
        'Please enter a valid amount greater than 0'
      );
    }

    if (!formData.proposed_timeline || parseInt(formData.proposed_timeline) <= 0) {
      newErrors.proposed_timeline = t(
        'bids.errors.invalidTimeline',
        'Please enter a valid timeline in days'
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   * Validates form and submits bid to the API.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('bids.errors.fixErrors', 'Please fix the errors in the form'));
      return;
    }

    try {
      setLoading(true);

      // Prepare bid data
      const bidData = {
        project: formData.project,
        cover_letter: formData.cover_letter,
        proposed_amount: parseFloat(formData.proposed_amount),
        proposed_timeline: parseInt(formData.proposed_timeline),
      };

      // Create the bid
      const response = await bidService.createBid(bidData);

      toast.success(t('bids.createSuccess', 'Bid submitted successfully!'));
      
      // Navigate to the bid detail page
      navigate(`/bids/${response.data.id}`);
    } catch (error) {
      console.error('Error creating bid:', error);
      toast.error(
        error.response?.data?.error ||
          t('bids.errors.createFailed', 'Failed to submit bid. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Use AI to generate a cover letter.
   * Calls the AI API to create a personalized cover letter based on the project.
   */
  const handleGenerateCoverLetter = async () => {
    if (!formData.project) {
      toast.warning(t('bids.errors.selectProjectFirst', 'Please select a project first'));
      return;
    }

    try {
      setAiLoading((prev) => ({ ...prev, coverLetter: true }));
      
      const response = await bidService.generateCoverLetter(formData.project);
      
      // Update the cover letter field with AI-generated content
      setFormData((prev) => ({
        ...prev,
        cover_letter: response.data.cover_letter,
      }));

      toast.success(t('bids.aiCoverLetterGenerated', 'Cover letter generated by AI!'));
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast.error(
        t('bids.errors.aiCoverLetterFailed', 'Failed to generate cover letter. Please try again.')
      );
    } finally {
      setAiLoading((prev) => ({ ...prev, coverLetter: false }));
    }
  };

  /**
   * Use AI to suggest competitive pricing.
   * Calls the AI API to analyze the project and suggest a good price.
   */
  const handleSuggestPricing = async () => {
    if (!formData.project) {
      toast.warning(t('bids.errors.selectProjectFirst', 'Please select a project first'));
      return;
    }

    try {
      setAiLoading((prev) => ({ ...prev, pricing: true }));
      
      const response = await bidService.suggestPricing(formData.project);
      
      // Update the amount field with AI-suggested pricing
      setFormData((prev) => ({
        ...prev,
        proposed_amount: response.data.suggested_amount,
      }));

      // Show additional pricing info
      const { pricing_strategy, win_probability } = response.data;
      toast.success(
        `${t('bids.aiPricingSuggested', 'Pricing suggested by AI')}! ` +
        `${t('bids.winProbability', 'Win probability')}: ${win_probability}`
      );

      // You could also show the pricing strategy in a modal or info box
      console.log('Pricing strategy:', pricing_strategy);
    } catch (error) {
      console.error('Error suggesting pricing:', error);
      toast.error(
        t('bids.errors.aiPricingFailed', 'Failed to suggest pricing. Please try again.')
      );
    } finally {
      setAiLoading((prev) => ({ ...prev, pricing: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('bids.createNew', 'Submit New Bid')}
        </h1>
        <p className="text-gray-600">
          {t('bids.createDescription', 'Create and submit your bid for a project')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Real-time Bid Quality Score */}
        {bidQuality && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bid Quality Score
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  bidQuality.score >= 75 ? 'text-green-600' :
                  bidQuality.score >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {bidQuality.score}/100
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  bidQuality.score >= 75 ? 'bg-green-500' :
                  bidQuality.score >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${bidQuality.score}%` }}
              />
            </div>
            
            {/* Feedback Items */}
            <div className="space-y-2">
              {bidQuality.feedback.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  {item.type === 'good' ? (
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm text-gray-700">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
        {/* Project Selection */}
        <div className="mb-6">
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
            {t('bids.project', 'Project')} <span className="text-red-500">*</span>
          </label>
          <select
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.project ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={projectIdFromUrl} // Disable if project is pre-selected
          >
            <option value="">{t('bids.selectProject', 'Select a project')}</option>
            {/* TODO: Load available projects from API */}
            <option value={projectIdFromUrl}>{t('bids.selectedProject', 'Selected Project')}</option>
          </select>
          {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
        </div>

        {/* Cover Letter with AI Assistance */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700">
              {t('bids.coverLetter', 'Cover Letter')} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateCoverLetter}
              disabled={aiLoading.coverLetter || !formData.project}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {aiLoading.coverLetter ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('bids.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  {t('bids.aiGenerate', 'AI Generate')}
                </>
              )}
            </button>
          </div>
          <textarea
            id="cover_letter"
            name="cover_letter"
            value={formData.cover_letter}
            onChange={handleChange}
            rows={10}
            placeholder={t('bids.coverLetterPlaceholder', 'Write a compelling cover letter explaining why you are the best fit for this project...')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.cover_letter ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cover_letter && (
            <p className="mt-1 text-sm text-red-600">{errors.cover_letter}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.cover_letter.length} {t('bids.characters', 'characters')} (minimum 50)
          </p>
        </div>

        {/* Proposed Amount with AI Suggestion */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="proposed_amount" className="block text-sm font-medium text-gray-700">
              {t('bids.proposedAmount', 'Proposed Amount')} ($) <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleSuggestPricing}
              disabled={aiLoading.pricing || !formData.project}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {aiLoading.pricing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('bids.suggesting', 'Suggesting...')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  {t('bids.aiSuggest', 'AI Suggest')}
                </>
              )}
            </button>
          </div>
          <input
            type="number"
            id="proposed_amount"
            name="proposed_amount"
            value={formData.proposed_amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="5000.00"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.proposed_amount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.proposed_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.proposed_amount}</p>
          )}
        </div>

        {/* Proposed Timeline */}
        <div className="mb-6">
          <label htmlFor="proposed_timeline" className="block text-sm font-medium text-gray-700 mb-2">
            {t('bids.proposedTimeline', 'Proposed Timeline')} (days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="proposed_timeline"
            name="proposed_timeline"
            value={formData.proposed_timeline}
            onChange={handleChange}
            min="1"
            placeholder="30"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.proposed_timeline ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.proposed_timeline && (
            <p className="mt-1 text-sm text-red-600">{errors.proposed_timeline}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
            {loading ? t('bids.submitting', 'Submitting...') : t('bids.submitBid', 'Submit Bid')}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
};

export default BidCreate;
