from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Tender, TenderDocument, TenderRequirement
from .serializers import TenderSerializer, TenderDocumentSerializer, TenderRequirementSerializer

class TenderViewSet(viewsets.ModelViewSet):
    queryset = Tender.objects.all()
    serializer_class = TenderSerializer

    # Enable filtering, ordering, search
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['status', 'issuing_entity']
    search_fields = ['title']
    ordering_fields = ['deadline']
    ordering = ['deadline']
    
class TenderDocumentViewSet(viewsets.ModelViewSet):
    queryset = TenderDocument.objects.all()
    serializer_class = TenderDocumentSerializer

class TenderRequirementViewSet(viewsets.ModelViewSet):
    queryset = TenderRequirement.objects.all()
    serializer_class = TenderRequirementSerializer