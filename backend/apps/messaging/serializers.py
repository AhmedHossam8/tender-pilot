from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, ConversationParticipant, Message

User = get_user_model()


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = ConversationParticipant
        fields = ['user', 'joined_at', 'last_read_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp']


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']

    def get_participants(self, obj):
        # Ensure we're working with a saved instance
        if not obj.pk:
            return []
    
        qs = obj.conversationparticipant_set.select_related('user').all()
        return ConversationParticipantSerializer(qs, many=True).data

    def get_last_message(self, obj):
        # Make sure to call .all() to get a queryset
        last_msg = obj.messages.all().order_by('-timestamp').first()
        return MessageSerializer(last_msg).data if last_msg else None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        try:
            participant = obj.conversationparticipant_set.get(user=user)
            if participant.last_read_at:
                return obj.messages.all().filter(timestamp__gt=participant.last_read_at).count()
            return obj.messages.all().count()
        except ConversationParticipant.DoesNotExist:
            return 0
        

class CreateConversationSerializer(serializers.Serializer):
    participants = serializers.ListField(child=serializers.IntegerField())

    def validate_participants(self, value):
        # Remove duplicates and ensure users exist
        users = User.objects.filter(id__in=value)
        if not users.exists():
            raise serializers.ValidationError("No valid users provided")
        return list(users.values_list('id', flat=True))

    def create(self, validated_data):
        participants_ids = validated_data['participants']
        user = self.context['request'].user
        if user.id not in participants_ids:
            participants_ids.append(user.id)

        conversation = Conversation.objects.create()

        # Create participants safely
        for uid in participants_ids:
            ConversationParticipant.objects.create(user_id=uid, conversation=conversation)

        return conversation
    
class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()

    def create(self, validated_data):
        conversation = self.context['conversation']
        user = self.context['request'].user
        
        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            content=validated_data['content']
        )
        return message