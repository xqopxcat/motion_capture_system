class AuthenticationFlowError(Exception):
    """Controlled authentication failure without sensitive provider details."""


class InvalidOAuthStateError(AuthenticationFlowError):
    pass


class InvalidIdentityError(AuthenticationFlowError):
    pass


class ProviderExchangeError(AuthenticationFlowError):
    pass


class InvalidRedirectError(AuthenticationFlowError):
    pass
