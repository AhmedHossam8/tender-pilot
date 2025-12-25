from rest_framework.throttling import UserRateThrottle

class DocumentUploadThrottling(UserRateThrottle):
    scope = 'document_upload'


class DocumentReadThrottling(UserRateThrottle):
    scope = 'document_read'