"""
AI Integration Service

Automatically triggers AI analysis at key points in the business cycle:
- When documents are uploaded (auto-analyze project)
- When bids are created (auto-score and generate feedback)
- When projects are updated (refresh analysis if needed)
"""

import logging
from typing import Dict, Any, Optional
from django.utils import timezone
from apps.ai_engine.services.analysis_service import ProjectAnalysisService
from apps.ai_engine.services.matching_service import AIMatchingService

logger = logging.getLogger(__name__)


class AIIntegrationService:
    """
    Handles automatic AI integration in business workflows.
    """
    
    @staticmethod
    def auto_analyze_project_on_document_upload(project, user) -> Optional[Dict[str, Any]]:
        """
        Automatically analyze project when documents are uploaded.
        
        Args:
            project: Project instance
            user: User who uploaded the document
            
        Returns:
            Analysis result or None if failed
        """
        try:
            # Check if project has enough documents for analysis
            # Use try-except to handle case where documents table doesn't exist yet
            try:
                doc_count = project.projectdocument_set.filter(
                    is_active=True,
                    extracted_text__isnull=False
                ).exclude(extracted_text='').count()
            except Exception as doc_error:
                logger.info(f"Could not check documents for project {project.id}: {doc_error}")
                doc_count = 0
            
            # For demo purposes, allow analysis even without documents
            # In production, you might want to skip this
            if doc_count == 0:
                logger.info(f"Project {project.id} has no documents, will use basic info for analysis")
            
            # Only auto-analyze if not recently analyzed
            if project.ai_processed_at:
                hours_since_analysis = (timezone.now() - project.ai_processed_at).total_seconds() / 3600
                if hours_since_analysis < 1:  # Don't re-analyze within 1 hour
                    logger.info(f"Project {project.id} was analyzed {hours_since_analysis:.1f}h ago, skipping")
                    return None
            
            logger.info(f"Auto-analyzing project {project.id} after document upload")
            
            service = ProjectAnalysisService()
            result = service.analyze_project(
                project_id=str(project.id),
                user=user,
                force_refresh=False,
                analysis_depth='standard'
            )
            
            # Update project with AI data
            if 'analysis' in result:
                analysis = result['analysis']
                project.ai_summary = analysis.get('summary', '')
                project.ai_complexity = analysis.get('estimated_complexity', '').lower()
                project.ai_data = analysis
                project.ai_processed = True
                project.ai_processed_at = timezone.now()
                project.save(update_fields=[
                    'ai_summary', 'ai_complexity', 'ai_data', 
                    'ai_processed', 'ai_processed_at'
                ])
                
                logger.info(f"Project {project.id} auto-analysis complete: {project.ai_complexity} complexity")
            
            return result
            
        except Exception as e:
            logger.error(f"Auto-analysis failed for project {project.id}: {e}", exc_info=True)
            return None
    
    
    @staticmethod
    def auto_score_bid_on_submission(bid, user) -> Optional[Dict[str, Any]]:
        """
        Automatically score and analyze bid when submitted.
        
        Args:
            bid: Bid instance
            user: Service provider who submitted the bid
            
        Returns:
            Scoring result or None if failed
        """
        try:
            logger.info(f"Auto-scoring bid {bid.id} for project {bid.project.id}")
            
            # Use matching service to calculate score
            matching_service = AIMatchingService()
            
            # Prepare project data
            project_data = {
                'id': str(bid.project.id),
                'title': bid.project.title,
                'description': bid.project.description,
                'budget': float(bid.project.budget),
                'skills': list(bid.project.skills.values_list('name', flat=True)),
                'category': bid.project.category.name if bid.project.category else 'General',
            }
            
            # Prepare provider data
            provider = bid.service_provider
            provider_data = {
                'id': str(provider.id),
                'skills': list(provider.profile.skills.values_list('name', flat=True)) if hasattr(provider, 'profile') else [],
                'experience_years': getattr(provider.profile, 'experience_years', 0) if hasattr(provider, 'profile') else 0,
                'bio': provider.profile.bio if hasattr(provider, 'profile') else '',
                'hourly_rate': float(provider.profile.hourly_rate) if hasattr(provider, 'profile') and provider.profile.hourly_rate else 0,
            }
            
            # Calculate compatibility score
            score_result = matching_service.calculate_compatibility_score(
                project_data=project_data,
                provider_data=provider_data
            )
            
            if not score_result:
                logger.warning(f"No score result for bid {bid.id}")
                return None
            
            # Generate comprehensive AI feedback on the bid
            feedback = {
                'match_score': score_result.get('match_score', 0),
                'recommendation': score_result.get('recommendation', 'No recommendation'),
                'reasoning': score_result.get('reasoning', 'No detailed analysis available'),
                'matching_skills': score_result.get('matching_skills', []),
                'skill_gaps': score_result.get('skill_gaps', []),
                'budget_compatible': score_result.get('budget_compatible', True),
                'budget_assessment': score_result.get('budget_assessment', ''),
                'experience_assessment': score_result.get('experience_assessment', ''),
                'potential_concerns': score_result.get('potential_concerns', []),
                'strengths': score_result.get('strengths', []),
                'competitive_analysis': score_result.get('competitive_analysis', {}),
                'generated_at': timezone.now().isoformat(),
            }
            
            # Update bid with AI data
            bid.ai_score = score_result.get('match_score', 0)
            bid.ai_feedback = feedback
            bid.save(update_fields=['ai_score', 'ai_feedback'])
            
            logger.info(f"Bid {bid.id} auto-scored: {bid.ai_score}/100 with detailed feedback")
            
            return score_result
            
        except Exception as e:
            logger.error(f"Auto-scoring failed for bid {bid.id}: {e}", exc_info=True)
            return None
    
    
    @staticmethod
    def generate_cover_letter_suggestion(project, provider) -> Optional[str]:
        """
        Generate AI-suggested cover letter for a bid.
        
        Args:
            project: Project instance
            provider: User (service provider) instance
            
        Returns:
            Generated cover letter or None if failed
        """
        try:
            from apps.ai_engine.services.factory import get_ai_provider
            from apps.ai_engine.prompts.registry import get_prompt
            
            logger.info(f"Generating cover letter suggestion for provider {provider.id} on project {project.id}")
            
            # Get project requirements
            requirements_list = list(project.requirements.all())
            requirements = "\n".join([
                f"- {req.description}" for req in requirements_list
            ]) if requirements_list else "No specific requirements listed"
            
            # Get provider info - safely handle missing profile
            provider_skills = []
            try:
                if hasattr(provider, 'profile') and provider.profile:
                    provider_skills = list(provider.profile.skills.values_list('name', flat=True))
            except Exception as e:
                logger.warning(f"Could not access provider profile skills: {e}")
            
            # Get provider name
            provider_name = getattr(provider, 'full_name', None) or getattr(provider, 'email', 'Service Provider')
            
            # Build prompt
            prompt_template = """Generate a professional cover letter for a service provider bidding on this project.

PROJECT: {project_title}
DESCRIPTION: {project_description}
BUDGET: ${project_budget}
REQUIREMENTS:
{requirements}

PROVIDER SKILLS: {provider_skills}

Generate a compelling, professional cover letter (200-300 words) that:
1. Addresses the client's specific needs from the project description
2. Highlights relevant skills and experience
3. Shows enthusiasm for the project
4. Is professional but personable
5. Ends with a call to action

Return only the cover letter text without any additional formatting or markdown."""

            full_prompt = prompt_template.format(
                project_title=project.title,
                project_description=project.description[:500],
                project_budget=project.budget,
                requirements=requirements,
                provider_skills=", ".join(provider_skills) if provider_skills else "Experienced professional"
            )
            
            # Generate using AI provider
            try:
                provider_instance = get_ai_provider()
                response = provider_instance.generate(
                    prompt=full_prompt,
                    max_tokens=500,
                    temperature=0.7
                )
                
                logger.info(f"Cover letter generated successfully for provider {provider.id}")
                return response.content
                
            except Exception as ai_error:
                logger.error(f"AI generation failed: {ai_error}", exc_info=True)
                # Return a fallback template
                fallback = f"""Dear Project Owner,

I am writing to express my strong interest in your project "{project.title}".

With my experience and skills, I am confident I can deliver high-quality results that meet your requirements. I have carefully reviewed your project description and understand the scope and objectives.

I am committed to:
- Delivering quality work within the specified timeline
- Maintaining clear communication throughout the project
- Ensuring your complete satisfaction with the final deliverable

I would welcome the opportunity to discuss your project in more detail and demonstrate how I can add value to your business.

Looking forward to working with you!

Best regards"""
                return fallback
            
        except Exception as e:
            logger.error(f"Cover letter generation failed: {e}", exc_info=True)
            return None
    
    
    @staticmethod
    def refresh_project_analysis_if_stale(project, user) -> Optional[Dict[str, Any]]:
        """
        Refresh project analysis if it's stale (older than 24 hours).
        
        Args:
            project: Project instance
            user: User requesting analysis
            
        Returns:
            Analysis result or None if not needed/failed
        """
        try:
            # Check if analysis is stale
            if not project.ai_processed_at:
                logger.info(f"Project {project.id} never analyzed, triggering analysis")
                return AIIntegrationService.auto_analyze_project_on_document_upload(project, user)
            
            hours_since_analysis = (timezone.now() - project.ai_processed_at).total_seconds() / 3600
            
            if hours_since_analysis > 24:
                logger.info(f"Project {project.id} analysis is stale ({hours_since_analysis:.1f}h old), refreshing")
                return AIIntegrationService.auto_analyze_project_on_document_upload(project, user)
            
            logger.info(f"Project {project.id} analysis is fresh ({hours_since_analysis:.1f}h old)")
            return None
            
        except Exception as e:
            logger.error(f"Refresh check failed for project {project.id}: {e}", exc_info=True)
            return None
