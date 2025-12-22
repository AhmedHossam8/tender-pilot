from rest_framework import serializers
from .models import TenderUser

class TenderUserAssignSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderUser
        fields = ("id", "user", "role")