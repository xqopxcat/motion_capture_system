from dataclasses import dataclass
from datetime import UTC, datetime
import json
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.auth.errors import InvalidIdentityError, ProviderExchangeError


@dataclass(frozen=True)
class GoogleIdentity:
    subject: str
    email: str
    display_name: str
    avatar_url: str | None


class GoogleIdentityProviderContract(Protocol):
    def exchange(self, *, code: str, code_verifier: str, expected_nonce: str) -> GoogleIdentity: ...


class GoogleIdentityProvider:
    token_endpoint = "https://oauth2.googleapis.com/token"
    tokeninfo_endpoint = "https://oauth2.googleapis.com/tokeninfo"
    allowed_issuers = {"https://accounts.google.com", "accounts.google.com"}

    def __init__(self, *, client_id: str, client_secret: str, redirect_uri: str) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    def exchange(self, *, code: str, code_verifier: str, expected_nonce: str) -> GoogleIdentity:
        token = self._post_json(
            self.token_endpoint,
            {
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": self.redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            },
        )
        id_token = token.get("id_token")
        if not isinstance(id_token, str) or not id_token:
            raise ProviderExchangeError("Google did not return a valid identity token.")
        claims = self._get_json(f"{self.tokeninfo_endpoint}?{urlencode({'id_token': id_token})}")
        self._validate_claims(claims, expected_nonce)
        return GoogleIdentity(
            subject=str(claims["sub"]),
            email=str(claims["email"]),
            display_name=str(claims.get("name") or claims["email"]),
            avatar_url=str(claims["picture"]) if claims.get("picture") else None,
        )

    def _validate_claims(self, claims: dict[str, object], expected_nonce: str) -> None:
        try:
            exp = int(str(claims["exp"]))
        except (KeyError, TypeError, ValueError) as error:
            raise InvalidIdentityError("Google identity expiration is invalid.") from error
        if claims.get("iss") not in self.allowed_issuers:
            raise InvalidIdentityError("Google identity issuer is invalid.")
        if claims.get("aud") != self.client_id:
            raise InvalidIdentityError("Google identity audience is invalid.")
        if exp <= int(datetime.now(UTC).timestamp()):
            raise InvalidIdentityError("Google identity is expired.")
        if claims.get("nonce") != expected_nonce:
            raise InvalidIdentityError("Google identity nonce is invalid.")
        if not claims.get("sub"):
            raise InvalidIdentityError("Google identity subject is missing.")
        if not claims.get("email") or str(claims.get("email_verified")).lower() != "true":
            raise InvalidIdentityError("A verified Google email is required.")

    @staticmethod
    def _post_json(url: str, fields: dict[str, str]) -> dict[str, object]:
        request = Request(
            url,
            data=urlencode(fields).encode("utf-8"),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        return GoogleIdentityProvider._request_json(request)

    @staticmethod
    def _get_json(url: str) -> dict[str, object]:
        return GoogleIdentityProvider._request_json(Request(url, method="GET"))

    @staticmethod
    def _request_json(request: Request) -> dict[str, object]:
        try:
            with urlopen(request, timeout=10) as response:
                value = json.loads(response.read())
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            raise ProviderExchangeError("Google identity provider is unavailable.") from error
        if not isinstance(value, dict):
            raise ProviderExchangeError("Google identity provider returned an invalid response.")
        return value
