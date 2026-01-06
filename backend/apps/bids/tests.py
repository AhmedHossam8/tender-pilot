from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.bids.models import Bid, BidMilestone, BidAttachment, BidStatus
from decimal import Decimal

User = get_user_model()


class BidModelTest(TestCase):
    """Test cases for the Bid model"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='testpass123',
            first_name='Client',
            last_name='User'
        )
        self.provider_user = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            first_name='Provider',
            last_name='User'
        )
        
        # Create a tender/project
        self.project = Project.objects.create(
            title='Test Project',
            created_by=self.client_user,
            deadline='2026-12-31'
        )
        
        # Create a bid
        self.bid = Bid.objects.create(
            project=self.project,
            service_provider=self.provider_user,
            cover_letter='I am experienced in this field...',
            proposed_amount=Decimal('5000.00'),
            proposed_timeline=30,
            status=BidStatus.PENDING
        )
    
    def test_bid_creation(self):
        """Test that a bid can be created"""
        self.assertEqual(self.bid.project, self.project)
        self.assertEqual(self.bid.service_provider, self.provider_user)
        self.assertEqual(self.bid.proposed_amount, Decimal('5000.00'))
        self.assertEqual(self.bid.proposed_timeline, 30)
        self.assertEqual(self.bid.status, BidStatus.PENDING)
    
    def test_bid_status_transition_valid(self):
        """Test valid status transitions"""
        # Pending -> Shortlisted
        self.bid.change_status(
            new_status=BidStatus.SHORTLISTED,
            user=self.client_user,
            action='shortlist'
        )
        self.assertEqual(self.bid.status, BidStatus.SHORTLISTED)
        
        # Shortlisted -> Accepted
        self.bid.change_status(
            new_status=BidStatus.ACCEPTED,
            user=self.client_user,
            action='accept'
        )
        self.assertEqual(self.bid.status, BidStatus.ACCEPTED)
    
    def test_bid_status_transition_invalid(self):
        """Test invalid status transitions"""
        # Cannot go from PENDING directly to ACCEPTED
        with self.assertRaises(ValueError):
            self.bid.change_status(
                new_status=BidStatus.ACCEPTED,
                user=self.client_user,
                action='accept'
            )
    
    def test_bid_withdrawal(self):
        """Test bid withdrawal"""
        self.bid.change_status(
            new_status=BidStatus.WITHDRAWN,
            user=self.provider_user,
            action='withdraw'
        )
        self.assertEqual(self.bid.status, BidStatus.WITHDRAWN)
    
    def test_bid_string_representation(self):
        """Test string representation of bid"""
        expected = f"Bid by {self.provider_user} on {self.project.title}"
        self.assertEqual(str(self.bid), expected)


class BidMilestoneModelTest(TestCase):
    """Test cases for the BidMilestone model"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='testpass123'
        )
        self.provider_user = User.objects.create_user(
            email='provider@test.com',
            password='testpass123'
        )
        
        self.project = Project.objects.create(
            title='Test Project',
            created_by=self.client_user,
            deadline='2026-12-31'
        )
        
        self.bid = Bid.objects.create(
            project=self.project,
            service_provider=self.provider_user,
            cover_letter='Test cover letter',
            proposed_amount=Decimal('5000.00'),
            proposed_timeline=30
        )
    
    def test_milestone_creation(self):
        """Test creating a milestone"""
        milestone = BidMilestone.objects.create(
            bid=self.bid,
            order=1,
            title='Phase 1: Design',
            description='Create initial designs',
            duration_days=10,
            amount=Decimal('1500.00')
        )
        
        self.assertEqual(milestone.bid, self.bid)
        self.assertEqual(milestone.order, 1)
        self.assertEqual(milestone.title, 'Phase 1: Design')
        self.assertEqual(milestone.duration_days, 10)
        self.assertEqual(milestone.amount, Decimal('1500.00'))
    
    def test_milestone_ordering(self):
        """Test that milestones are ordered correctly"""
        BidMilestone.objects.create(
            bid=self.bid,
            order=2,
            title='Phase 2',
            duration_days=10,
            amount=Decimal('2000.00')
        )
        BidMilestone.objects.create(
            bid=self.bid,
            order=1,
            title='Phase 1',
            duration_days=10,
            amount=Decimal('1500.00')
        )
        
        milestones = list(self.bid.milestone_details.all())
        self.assertEqual(milestones[0].order, 1)
        self.assertEqual(milestones[1].order, 2)


class BidAttachmentModelTest(TestCase):
    """Test cases for the BidAttachment model"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='testpass123'
        )
        self.provider_user = User.objects.create_user(
            email='provider@test.com',
            password='testpass123'
        )
        
        self.project = Project.objects.create(
            title='Test Project',
            created_by=self.client_user,
            deadline='2026-12-31'
        )
        
        self.bid = Bid.objects.create(
            project=self.project,
            service_provider=self.provider_user,
            cover_letter='Test cover letter',
            proposed_amount=Decimal('5000.00'),
            proposed_timeline=30
        )
    
    def test_attachment_creation(self):
        """Test creating an attachment"""
        attachment = BidAttachment.objects.create(
            bid=self.bid,
            file_name='portfolio.pdf',
            file_type='application/pdf',
            description='My portfolio',
            file_size=1024000
        )
        
        self.assertEqual(attachment.bid, self.bid)
        self.assertEqual(attachment.file_name, 'portfolio.pdf')
        self.assertEqual(attachment.file_type, 'application/pdf')
        self.assertEqual(attachment.file_size, 1024000)
