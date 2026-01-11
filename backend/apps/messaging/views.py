from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch, Q
from .models import Conversation, ConversationParticipant, Message
from .serializers import (
    ConversationSerializer, ConversationListSerializer, CreateConversationSerializer,
    MessageSerializer, SendMessageSerializer
)


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Highly optimized queryset with all necessary prefetches
        return (
            self.request.user.conversations
            .prefetch_related(
                Prefetch(
                    'conversationparticipant_set',
                    queryset=ConversationParticipant.objects.select_related('user')
                ),
                Prefetch(
                    'messages',
                    queryset=Message.objects.select_related('sender').order_by('-timestamp')[:1],
                    to_attr='prefetched_messages'
                )
            )
            .order_by('-updated_at')
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateConversationSerializer
        elif self.action == 'list':
            return ConversationListSerializer
        return ConversationSerializer

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print("=== ERROR IN CONVERSATION LIST ===")
            print(f"Error: {str(e)}")
            print(traceback.format_exc())
            print("=== END ERROR ===")
            return Response(
                {'error': 'Failed to fetch conversations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            conversation = serializer.save()

            # Use ConversationSerializer for the response
            output_serializer = ConversationSerializer(conversation, context={'request': request})
            headers = self.get_success_headers(output_serializer.data)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            print("=== ERROR IN CONVERSATION CREATE ===")
            print(f"Error: {str(e)}")
            print(traceback.format_exc())
            print("=== END ERROR ===")
            return Response(
                {'error': 'Failed to create conversation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.select_related('sender').order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)

        # Mark messages as read
        try:
            participant = ConversationParticipant.objects.get(
                user=request.user, 
                conversation=conversation
            )
            if messages.exists():
                participant.last_read_at = messages.last().timestamp
                participant.save(update_fields=['last_read_at'])
        except ConversationParticipant.DoesNotExist:
            pass

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = SendMessageSerializer(
            data=request.data, 
            context={'conversation': conversation, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class UnreadCountView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        try:
            user = request.user
            total_unread = 0
            
            # Optimize with select_related and only fetch necessary fields
            participants = user.conversationparticipant_set.select_related('conversation').only(
                'last_read_at', 'conversation_id'
            )
            
            for participant in participants:
                if participant.last_read_at:
                    total_unread += participant.conversation.messages.filter(
                        timestamp__gt=participant.last_read_at
                    ).count()
                else:
                    total_unread += participant.conversation.messages.count()
            
            return Response({'count': total_unread})
        except Exception as e:
            print(f"Error in unread count: {str(e)}")
            return Response({'count': 0})