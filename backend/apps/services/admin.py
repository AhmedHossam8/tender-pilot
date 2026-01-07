from django.contrib import admin
from .models import Service, ServicePackage, Booking

admin.site.register(Service)
admin.site.register(ServicePackage)
admin.site.register(Booking)