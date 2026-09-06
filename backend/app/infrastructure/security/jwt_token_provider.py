from datetime import datetime, timedelta, timezone

import jwt

from app.domain.ports import TokenProvider


class JwtTokenProvider(TokenProvider):
    def __init__(self, secret_key: str, algorithm: str, expire_minutes: int) -> None:
        self._secret_key = secret_key
        self._algorithm = algorithm
        self._expire_minutes = expire_minutes

    def create_access_token(self, subject: str) -> str:
        issued_at = datetime.now(timezone.utc)

        payload = {
            "sub": subject,
            "iat": issued_at,
            "exp": issued_at + timedelta(minutes=self._expire_minutes),
        }

        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    def read_subject(self, token: str) -> str | None:
        try:
            payload = jwt.decode(
                token, self._secret_key, algorithms=[self._algorithm]
            )
        except jwt.PyJWTError:
            return None

        return payload.get("sub")