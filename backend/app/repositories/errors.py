class PersistenceError(RuntimeError):
    """Safe application-level persistence failure."""


class DuplicateResourceError(PersistenceError):
    pass


class ReferencedResourceMissingError(PersistenceError):
    pass
