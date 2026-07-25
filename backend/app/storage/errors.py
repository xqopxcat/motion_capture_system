class StorageError(RuntimeError):
    code = "STORAGE_ERROR"


class StorageConfigurationError(StorageError):
    code = "STORAGE_CONFIGURATION_ERROR"


class StorageProviderError(StorageError):
    code = "STORAGE_PROVIDER_ERROR"

