from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Booking

@receiver(post_save, sender=Booking)
def send_booking_confirmation(sender, instance, created, **kwargs):
    if created:
        # Send email to user
        subject = f"Booking Confirmation - {instance.package.name}"
        message = f"""
        Your booking has been confirmed!

        Service: {instance.package.service.name}
        Package: {instance.package.name}
        Scheduled for: {instance.scheduled_for}
        Status: {instance.status}

        Thank you for using our service.
        """
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.user.email],
                fail_silently=True,
            )
        except Exception as e:
            # Log error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send booking confirmation email: {e}")