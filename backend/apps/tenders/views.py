from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Tender,
    TenderDocument,
    TenderRequirement,
    TenderUser,
)
from .serializers import (
    TenderSerializer,
    TenderDocumentSerializer,
    TenderRequirementSerializer,
    TenderUserAssignSerializer,
)
from .permissions import IsTenderManager
from apps.users.permissions import IsAdmin

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

class AssignUserToTenderAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin | IsTenderManager]


    def post(self, request, tender_id):
        serializer = TenderUserAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        TenderUser.objects.create(
            tender_id=tender_id,
            user=serializer.validated_data["user"],
            role=serializer.validated_data["role"]
        )

        return Response(
            {"detail": "User assigned successfully"},
            status=status.HTTP_201_CREATED
        )
    
class TenderUsersListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTenderManager]

    def get(self, request, tender_id):
        users = TenderUser.objects.filter(
            tender_id=tender_id,
            is_active=True
        )
        serializer = TenderUserAssignSerializer(users, many=True)
        return Response(serializer.data)
