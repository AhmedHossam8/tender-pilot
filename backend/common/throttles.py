from rest_framework.throttling import UserRateThrottle

class DocumentUploadThrottling(UserRateThrottle):
    scope = 'document_upload'


class DocumentReadThrottling(UserRateThrottle):
    scope = 'document_read'



class ProposalWriteThrottle(UserRateThrottle):
    scope = 'proposal_write'


class ProposalReadTrhottle(UserRateThrottle):
    scope = 'proposal_read'