"""
Unit Tests for Bid and AI Services
Tests the bid comparison service and AI analytics functionality
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from unittest.mock import patch, MagicMock
from apps.bids.services.comparison_service import BidComparisonService
from apps.ai_engine.services.analytics_service import AIAnalyticsService
from apps.ai_engine.models import AIUsageLog, MatchSuccessLog, AIAnalyticsSummary
from datetime import datetime, timedelta

User = get_user_model()


class BidComparisonServiceTest(TestCase):
    """Tests for BidComparisonService"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Client'
        )
        
        self.provider1 = User.objects.create_user(
            email='provider1@test.com',
            password='testpass123',
            first_name='Provider',
            last_name='One'
        )
        
        self.provider2 = User.objects.create_user(
            email='provider2@test.com',
            password='testpass123',
            first_name='Provider',
            last_name='Two'
        )
        
        # Create project (mock)
        from apps.projects.models import Project
        self.project = Project.objects.create(
            title='Test Project',
            description='Test description',
            client=self.client_user,
            budget_min=5000,
            budget_max=10000,
            status='open'
        )
        
        # Create bids
        from apps.bids.models import Bid
        self.bid1 = Bid.objects.create(
            project=self.project,
            service_provider=self.provider1,
            cover_letter='I have 5 years experience with React',
            proposed_amount=Decimal('7500.00'),
            proposed_timeline=45,
            ai_score=85,
            status='pending'
        )
        
        self.bid2 = Bid.objects.create(
            project=self.project,
            service_provider=self.provider2,
            cover_letter='Expert in web development',
            proposed_amount=Decimal('6000.00'),
            proposed_timeline=60,
            ai_score=75,
            status='pending'
        )
    
    def test_calculate_value_score(self):
        """Test value score calculation"""
        score = BidComparisonService._calculate_value_score(self.bid1)
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_calculate_experience_score(self):
        """Test experience score calculation"""
        score = BidComparisonService._calculate_experience_score(self.bid1)
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_calculate_reliability_score(self):
        """Test reliability score calculation"""
        score = BidComparisonService._calculate_reliability_score(self.bid1)
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_compare_bids(self):
        """Test bid comparison"""
        result = BidComparisonService.compare_bids([self.bid1.id, self.bid2.id])
        
        self.assertIn('bids', result)
        self.assertIn('comparison', result)
        self.assertIn('recommendation', result)
        self.assertEqual(len(result['bids']), 2)
        
        # Check comparison metrics
        comparison = result['comparison']
        self.assertIn('price', comparison)
        self.assertIn('timeline', comparison)
        self.assertIn('ai_score', comparison)
        
        # Check recommendation
        recommendation = result['recommendation']
        self.assertIn('recommended_bid_id', recommendation)
        self.assertIn('confidence', recommendation)
        self.assertIn('reasons', recommendation)
    
    def test_get_bid_comparison_insights(self):
        """Test getting insights for all bids on a project"""
        insights = BidComparisonService.get_bid_comparison_insights(self.project.id)
        
        self.assertEqual(insights['total_bids'], 2)
        self.assertTrue(insights['has_bids'])
        self.assertGreater(insights['avg_amount'], 0)
        self.assertGreater(insights['avg_timeline'], 0)


class AIAnalyticsServiceTest(TestCase):
    """Tests for AIAnalyticsService"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
    
    def test_log_usage(self):
        """Test logging AI usage"""
        log = AIAnalyticsService.log_usage(
            user=self.user,
            feature='match_score',
            project_id=1,
            execution_time=2.5,
            tokens_used=500,
            cost=Decimal('0.01'),
            cached=False,
            success=True
        )
        
        self.assertIsNotNone(log.id)
        self.assertEqual(log.feature, 'match_score')
        self.assertEqual(log.user, self.user)
        self.assertTrue(log.success)
    
    def test_log_match_prediction(self):
        """Test logging match prediction"""
        log = AIAnalyticsService.log_match_prediction(
            project_id=1,
            provider_id=2,
            predicted_match_score=85,
            predicted_success=True
        )
        
        self.assertIsNotNone(log.id)
        self.assertEqual(log.predicted_match_score, 85)
        self.assertTrue(log.predicted_success)
    
    def test_update_match_outcome(self):
        """Test updating match outcome"""
        # Create prediction
        log = AIAnalyticsService.log_match_prediction(
            project_id=1,
            provider_id=2,
            predicted_match_score=85,
            predicted_success=True
        )
        
        # Update outcome
        updated = AIAnalyticsService.update_match_outcome(
            project_id=1,
            provider_id=2,
            bid_submitted=True,
            bid_accepted=True
        )
        
        self.assertIsNotNone(updated)
        self.assertTrue(updated.bid_submitted)
        self.assertTrue(updated.bid_accepted)
        self.assertIsNotNone(updated.prediction_accuracy)
    
    def test_get_usage_stats(self):
        """Test getting usage statistics"""
        # Create some usage logs
        for i in range(5):
            AIAnalyticsService.log_usage(
                user=self.user,
                feature='match_score',
                execution_time=2.0,
                tokens_used=100,
                cost=Decimal('0.01'),
                cached=(i % 2 == 0),
                success=True
            )
        
        stats = AIAnalyticsService.get_usage_stats()
        
        self.assertEqual(stats['total_requests'], 5)
        self.assertEqual(stats['cached_requests'], 3)
        self.assertEqual(stats['failed_requests'], 0)
        self.assertGreater(stats['cache_hit_rate'], 0)
    
    def test_get_match_accuracy_stats(self):
        """Test getting match accuracy statistics"""
        # Create predictions with outcomes
        for i in range(10):
            log = AIAnalyticsService.log_match_prediction(
                project_id=i,
                provider_id=i+1,
                predicted_match_score=80,
                predicted_success=True
            )
            
            # Update outcome (80% accuracy)
            AIAnalyticsService.update_match_outcome(
                project_id=i,
                provider_id=i+1,
                bid_submitted=True,
                bid_accepted=(i < 8)  # 8 out of 10 succeed
            )
        
        stats = AIAnalyticsService.get_match_accuracy_stats()
        
        self.assertEqual(stats['total_predictions'], 10)
        self.assertGreater(stats['accuracy_rate'], 0)
        self.assertGreater(stats['precision'], 0)
    
    def test_generate_daily_summary(self):
        """Test generating daily summary"""
        # Create usage logs for today
        today = datetime.now().date()
        for i in range(3):
            AIAnalyticsService.log_usage(
                user=self.user,
                feature='match_score',
                execution_time=2.0,
                tokens_used=100,
                cost=Decimal('0.01'),
                success=True
            )
        
        summary = AIAnalyticsService.generate_daily_summary(today)
        
        self.assertEqual(summary.date, today)
        self.assertEqual(summary.total_requests, 3)
        self.assertGreater(summary.total_cost, 0)
    
    def test_get_cost_trend(self):
        """Test getting cost trend"""
        # Create summaries for past days
        for i in range(5):
            date = datetime.now().date() - timedelta(days=i)
            AIAnalyticsSummary.objects.create(
                date=date,
                total_requests=10,
                total_cost=Decimal('1.50'),
                avg_execution_time=2.0
            )
        
        trend = AIAnalyticsService.get_cost_trend(days=7)
        
        self.assertEqual(len(trend), 5)
        self.assertIn('date', trend[0])
        self.assertIn('total_cost', trend[0])
    
    def test_get_feature_usage_breakdown(self):
        """Test getting feature usage breakdown"""
        # Create logs for different features
        features = ['match_score', 'bid_generation', 'quality_score']
        for feature in features:
            for _ in range(5):
                AIAnalyticsService.log_usage(
                    user=self.user,
                    feature=feature,
                    execution_time=2.0,
                    tokens_used=100,
                    cost=Decimal('0.01'),
                    success=True
                )
        
        breakdown = AIAnalyticsService.get_feature_usage_breakdown(days=30)
        
        self.assertEqual(breakdown['total_requests'], 15)
        self.assertEqual(len(breakdown['features']), 3)


class MatchSuccessLogTest(TestCase):
    """Tests for MatchSuccessLog model"""
    
    def test_calculate_accuracy_correct_prediction(self):
        """Test accuracy calculation for correct prediction"""
        log = MatchSuccessLog.objects.create(
            project_id=1,
            provider_id=2,
            predicted_match_score=85,
            predicted_success=True,
            actual_success=True
        )
        
        accuracy = log.calculate_accuracy()
        self.assertEqual(accuracy, 1.0)
    
    def test_calculate_accuracy_wrong_prediction(self):
        """Test accuracy calculation for wrong prediction"""
        log = MatchSuccessLog.objects.create(
            project_id=1,
            provider_id=2,
            predicted_match_score=85,
            predicted_success=True,
            actual_success=False
        )
        
        accuracy = log.calculate_accuracy()
        self.assertEqual(accuracy, 0.0)
    
    def test_calculate_accuracy_no_outcome(self):
        """Test accuracy calculation when outcome is unknown"""
        log = MatchSuccessLog.objects.create(
            project_id=1,
            provider_id=2,
            predicted_match_score=85,
            predicted_success=True
        )
        
        accuracy = log.calculate_accuracy()
        self.assertIsNone(accuracy)


class AIAnalyticsSummaryTest(TestCase):
    """Tests for AIAnalyticsSummary model"""
    
    def test_cache_hit_rate_calculation(self):
        """Test cache hit rate property"""
        summary = AIAnalyticsSummary.objects.create(
            date=datetime.now().date(),
            total_requests=100,
            cached_requests=75
        )
        
        self.assertEqual(summary.cache_hit_rate, 75.0)
    
    def test_success_rate_calculation(self):
        """Test success rate property"""
        summary = AIAnalyticsSummary.objects.create(
            date=datetime.now().date(),
            total_requests=100,
            failed_requests=5
        )
        
        self.assertEqual(summary.success_rate, 95.0)
    
    def test_zero_requests(self):
        """Test calculations with zero requests"""
        summary = AIAnalyticsSummary.objects.create(
            date=datetime.now().date(),
            total_requests=0
        )
        
        self.assertEqual(summary.cache_hit_rate, 0)
        self.assertEqual(summary.success_rate, 0)
