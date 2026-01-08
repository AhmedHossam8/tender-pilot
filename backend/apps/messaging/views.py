from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Conversation, ConversationParticipant, Message
from .serializers import (
    ConversationSerializer, CreateConversationSerializer,
    MessageSerializer, SendMessageSerializer
)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Conversation.objects.all()

    def get_queryset(self):
        return self.request.user.conversations.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateConversationSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        # This will call CreateConversationSerializer.create()
        return serializer.save()  # Only call save() once and return the result

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = self.perform_create(serializer)

        # Use ConversationSerializer for the response
        output_serializer = ConversationSerializer(conversation, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)

        # mark messages as read
        participant = get_object_or_404(ConversationParticipant, user=request.user, conversation=conversation)
        if messages:
            participant.last_read_at = messages.last().timestamp
            participant.save()

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = SendMessageSerializer(data=request.data, context={'conversation': conversation, 'request': request})
        if serializer.is_valid():
            message = serializer.save()
            conversation.save()  # update updated_at
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnreadCountView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        total_unread = 0
        for participant in user.conversationparticipant_set.all():
            if participant.last_read_at:
                total_unread += participant.conversation.messages.filter(timestamp__gt=participant.last_read_at).count()
            else:
                total_unread += participant.conversation.messages.count()
        return Response({'unread_count': total_unread})