from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.tenders.models import Tender
from apps.documents.models import TenderDocument
from .models import Proposal, ProposalSection, ProposalDocument
import json

User = get_user_model()


class ProposalModelTest(TestCase):
    """Test Proposal model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.tender = Tender.objects.create(
            title='Test Tender',
            description='Test Description',
            created_by=self.user
        )
    
    def test_proposal_creation(self):
        """Test creating a proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal',
            status='draft'
        )
        
        self.assertEqual(proposal.title, 'Test Proposal')
        self.assertEqual(proposal.status, 'draft')
        self.assertEqual(proposal.tender, self.tender)
        self.assertEqual(proposal.created_by, self.user)
        self.assertIsNotNone(proposal.created_at)
    
    def test_proposal_str(self):
        """Test proposal string representation"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal'
        )
        self.assertIn('Test Proposal', str(proposal))
        self.assertIn(self.tender.title, str(proposal))


class ProposalSectionModelTest(TestCase):
    """Test ProposalSection model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.tender = Tender.objects.create(
            title='Test Tender',
            description='Test Description',
            created_by=self.user
        )
        self.proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal'
        )
    
    def test_section_creation(self):
        """Test creating a proposal section"""
        section = ProposalSection.objects.create(
            proposal=self.proposal,
            name='Executive Summary',
            content='This is the executive summary content.',
            ai_generated=True
        )
        
        self.assertEqual(section.name, 'Executive Summary')
        self.assertEqual(section.proposal, self.proposal)
        self.assertTrue(section.ai_generated)
        self.assertIn('Executive Summary', str(section))
    
    def test_section_relationship(self):
        """Test section relationship with proposal"""
        section = ProposalSection.objects.create(
            proposal=self.proposal,
            name='Background',
            content='Background content'
        )
        
        self.assertEqual(self.proposal.sections.count(), 1)
        self.assertEqual(self.proposal.sections.first(), section)


class ProposalAPITest(TestCase):
    """Test Proposal API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.tender = Tender.objects.create(
            title='Test Tender',
            description='Test Description',
            created_by=self.user
        )
        
        # Create a tender document with AI summary for context building
        self.tender_doc = TenderDocument.objects.create(
            tender=self.tender,
            file='test.pdf',
            ai_processed=True,
            ai_summary=json.dumps({
                "summary": {"overview": "Test overview"},
                "requirements": {"key": "value"},
                "analysis": {"recommended_actions": []}
            })
        )
    
    def test_list_proposals(self):
        """Test listing proposals"""
        Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal 1'
        )
        Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal 2'
        )
        
        response = self.client.get('/api/v1/proposals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_proposal(self):
        """Test creating a proposal"""
        data = {
            'tender': self.tender.id,
            'title': 'New Proposal',
            'status': 'draft'
        }
        
        response = self.client.post('/api/v1/proposals/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Proposal.objects.count(), 1)
        self.assertEqual(Proposal.objects.first().title, 'New Proposal')
    
    def test_retrieve_proposal(self):
        """Test retrieving a proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal'
        )
        
        response = self.client.get(f'/api/v1/proposals/{proposal.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Proposal')
    
    def test_update_proposal(self):
        """Test updating a proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal',
            status='draft'
        )
        
        data = {
            'title': 'Updated Proposal',
            'status': 'final'
        }
        
        response = self.client.patch(f'/api/v1/proposals/{proposal.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        proposal.refresh_from_db()
        self.assertEqual(proposal.title, 'Updated Proposal')
        self.assertEqual(proposal.status, 'final')
    
    def test_delete_proposal(self):
        """Test deleting a proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal'
        )
        
        response = self.client.delete(f'/api/v1/proposals/{proposal.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Proposal.objects.count(), 0)
    
    def test_submit_proposal(self):
        """Test submitting a proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal',
            status='draft'
        )
        
        response = self.client.post(f'/api/v1/proposals/{proposal.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        proposal.refresh_from_db()
        self.assertEqual(proposal.status, 'final')
    
    def test_submit_already_submitted_proposal(self):
        """Test submitting an already submitted proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal',
            status='final'
        )
        
        response = self.client.post(f'/api/v1/proposals/{proposal.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_approve_proposal(self):
        """Test approving a proposal"""
        proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal'
        )
        
        response = self.client.post(f'/api/v1/proposals/{proposal.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('approved', response.data['status'].lower())


class ProposalSectionAPITest(TestCase):
    """Test ProposalSection API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.tender = Tender.objects.create(
            title='Test Tender',
            description='Test Description',
            created_by=self.user
        )
        
        self.proposal = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Test Proposal'
        )
    
    def test_list_sections(self):
        """Test listing proposal sections"""
        ProposalSection.objects.create(
            proposal=self.proposal,
            name='Section 1',
            content='Content 1'
        )
        ProposalSection.objects.create(
            proposal=self.proposal,
            name='Section 2',
            content='Content 2'
        )
        
        response = self.client.get('/api/v1/proposals/sections/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_list_sections_by_proposal(self):
        """Test filtering sections by proposal"""
        ProposalSection.objects.create(
            proposal=self.proposal,
            name='Section 1',
            content='Content 1'
        )
        
        proposal2 = Proposal.objects.create(
            tender=self.tender,
            created_by=self.user,
            title='Proposal 2'
        )
        ProposalSection.objects.create(
            proposal=proposal2,
            name='Section 2',
            content='Content 2'
        )
        
        response = self.client.get(f'/api/v1/proposals/sections/?proposal_id={self.proposal.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Section 1')
    
    def test_update_section_content(self):
        """Test updating section content"""
        section = ProposalSection.objects.create(
            proposal=self.proposal,
            name='Test Section',
            content='Original content',
            ai_generated=True
        )
        
        data = {'content': 'Updated content'}
        response = self.client.patch(f'/api/v1/proposals/sections/{section.id}/update_content/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        section.refresh_from_db()
        self.assertEqual(section.content, 'Updated content')
        self.assertFalse(section.ai_generated)  # Should be marked as manually edited
    
    def test_delete_section(self):
        """Test deleting a section"""
        section = ProposalSection.objects.create(
            proposal=self.proposal,
            name='Test Section',
            content='Content'
        )
        
        response = self.client.delete(f'/api/v1/proposals/sections/{section.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ProposalSection.objects.count(), 0)
