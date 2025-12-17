from django.db import models
from django.contrib.auth.models import UserManager ,  AbstractBaseUser , BaseUserManager , PermissionsMixin
from django.contrib.auth.models import User


class CustomUserManager(UserManager):
    def _create_user(self,email,password,**extra_field):
        if not email:
            raise ValueError("You have not proviaded a filed email address")
        
        email = self.normalize_email(email)
        user = self.model(email=email,**extra_field)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self,email=None , password = None , **extra_fileds):
        extra_fileds.setdefault('is_staff' , False)
        extra_fileds.setdefault('is_superuser',False)
        return self._create_user(email,password,**extra_fileds)
    

    def create_superuser(self,email=None , password = None , **extra_fileds):
        extra_fileds.setdefault('is_staff' , True)
        extra_fileds.setdefault('is_superuser',True)
        return self._create_user(email,password,**extra_fileds)
    

class User(AbstractBaseUser , PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)


    is_admin = models.BooleanField(default=False)
    is_proposal_manager = models.BooleanField(default=False)
    is_reviewer = models.BooleanField(default=False)

    # Required fields for Django admin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)


    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FILED  = 'email'
    REQUIRED_FIELDS = []


    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
