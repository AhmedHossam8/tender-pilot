from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, ConversationParticipant, Message

User = get_user_model()


# -----------------------------
# Participant Serializer
# -----------------------------
class ConversationParticipantSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = ConversationParticipant
        fields = ['user', 'name', 'joined_at', 'last_read_at']

    def get_name(self, obj):
        # Try different possible attributes for the user's name
        if hasattr(obj.user, 'full_name') and obj.user.full_name:
            return obj.user.full_name
        elif hasattr(obj.user, 'username'):
            return obj.user.username
        elif hasattr(obj.user, 'email'):
            return obj.user.email
        else:
            return f"User {obj.user.id}"


# -----------------------------
# Message Serializer
# -----------------------------
class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'content', 'timestamp']

    def get_sender_name(self, obj):
        # Try different possible attributes for the sender's name
        if hasattr(obj.sender, 'full_name') and obj.sender.full_name:
            return obj.sender.full_name
        elif hasattr(obj.sender, 'username'):
            return obj.sender.username
        elif hasattr(obj.sender, 'email'):
            return obj.sender.email
        else:
            return f"User {obj.sender.id}"


# -----------------------------
# Conversation List Serializer (Lightweight)
# -----------------------------
class ConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing conversations"""
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']

    def get_participants(self, obj):
        # Use prefetched data to avoid extra queries
        participants_data = []
        for participant in obj.conversationparticipant_set.all():
            user = participant.user
            name = None
            if hasattr(user, 'full_name') and user.full_name:
                name = user.full_name
            elif hasattr(user, 'username'):
                name = user.username
            elif hasattr(user, 'email'):
                name = user.email
            else:
                name = f"User {user.id}"
            
            participants_data.append({
                'user': user.id,
                'name': name,
                'joined_at': participant.joined_at,
                'last_read_at': participant.last_read_at
            })
        return participants_data

    def get_last_message(self, obj):
        # Get the first message from prefetched messages (ordered by -timestamp)
        messages = getattr(obj, 'prefetched_messages', [])
        if messages:
            msg = messages[0]
            sender_name = None
            if hasattr(msg.sender, 'full_name') and msg.sender.full_name:
                sender_name = msg.sender.full_name
            elif hasattr(msg.sender, 'username'):
                sender_name = msg.sender.username
            elif hasattr(msg.sender, 'email'):
                sender_name = msg.sender.email
            else:
                sender_name = f"User {msg.sender.id}"
            
            return {
                'id': msg.id,
                'sender': msg.sender.id,
                'sender_name': sender_name,
                'content': msg.content,
                'timestamp': msg.timestamp
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return 0
        
        user = request.user
        if not user or not user.is_authenticated:
            return 0
        
        # Find the participant for current user from prefetched data
        for participant in obj.conversationparticipant_set.all():
            if participant.user_id == user.id:
                if participant.last_read_at:
                    # Count messages after last_read_at
                    return obj.messages.filter(timestamp__gt=participant.last_read_at).count()
                return obj.messages.count()
        return 0


# -----------------------------
# Conversation Detail Serializer
# -----------------------------
class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, source='conversationparticipant_set', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']

    def get_last_message(self, obj):
        try:
            last_msg = obj.messages.order_by('-timestamp').first()
            return MessageSerializer(last_msg).data if last_msg else None
        except Exception as e:
            print(f"Error getting last message: {e}")
            return None

    def get_unread_count(self, obj):
        try:
            request = self.context.get('request')
            if not request or not hasattr(request, 'user'):
                return 0
            
            user = request.user
            if not user or not user.is_authenticated:
                return 0
            
            participant = obj.conversationparticipant_set.filter(user=user).first()
            if not participant:
                return 0
                
            if participant.last_read_at:
                return obj.messages.filter(timestamp__gt=participant.last_read_at).count()
            return obj.messages.count()
        except Exception as e:
            print(f"Error getting unread count: {e}")
            return 0


# -----------------------------
# Create Conversation Serializer
# -----------------------------
class CreateConversationSerializer(serializers.Serializer):
    participants = serializers.ListField(child=serializers.IntegerField())

    def validate_participants(self, value):
        if not value:
            raise serializers.ValidationError("At least one participant is required")
        
        # Remove duplicates and ensure users exist
        unique_ids = list(set(value))
        users = User.objects.filter(id__in=unique_ids)
        
        if not users.exists():
            raise serializers.ValidationError("No valid users provided")
        
        return list(users.values_list('id', flat=True))

    def create(self, validated_data):
        participants_ids = list(validated_data['participants'])
        request_user = self.context['request'].user

        # Ensure the requesting user is included
        if request_user.id not in participants_ids:
            participants_ids.append(request_user.id)

        # Check if a conversation already exists with exactly these participants
        from django.db.models import Count
        
        existing_convs = Conversation.objects.annotate(
            num_participants=Count('conversationparticipant')
        ).filter(
            num_participants=len(participants_ids),
            project_id__isnull=True
        )

        for conv in existing_convs:
            conv_participants = set(conv.conversationparticipant_set.values_list('user_id', flat=True))
            if conv_participants == set(participants_ids):
                return conv

        # Create new conversation
        conversation = Conversation.objects.create()

        # Add all participants
        for uid in participants_ids:
            ConversationParticipant.objects.create(user_id=uid, conversation=conversation)

        return conversation


# -----------------------------
# Send Message Serializer
# -----------------------------
class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=10000)

    def create(self, validated_data):
        conversation = self.context['conversation']
        user = self.context['request'].user
        
        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            content=validated_data['content']
        )
        
        # Update conversation's updated_at timestamp
        conversation.save(update_fields=['updated_at'])
        
        return message