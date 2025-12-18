from rest_framework import serializers
from django.contrib.auth import get_user_model ,authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User  = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)


    class Meta:
        model = User
        fields = ('email','password','full_name')

    
    def create(self,validated_data):
        user = User.objects.create_user(
            email = validated_data['email'],
            password = validated_data['password'],
            full_name = validated_data.get('full_name','')
        )
        return user
    

class LoginSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        return data
    

class UserProfileSeralizer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = (
            'email',
            'full_name',
            'is_admin',
            'is_proposal_manager',
            'is_reviewer'
        )
