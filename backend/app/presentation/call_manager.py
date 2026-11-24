from fastapi import WebSocket


# ponytail: in memory, like ConnectionManager: a single API process. Move both to
# Redis pub/sub if the API ever runs with more than one worker.
class CallManager:
    def __init__(self) -> None:
        # conversation_id → {user_id: the socket (tab) that is in the call}
        self._calls: dict[int, dict[int, WebSocket]] = {}

    def participants(self, conversation_id: int) -> list[int]:
        return sorted(self._calls.get(conversation_id, {}))

    def socket_of(self, conversation_id: int, user_id: int) -> WebSocket | None:
        return self._calls.get(conversation_id, {}).get(user_id)

    def call_of(self, user_id: int) -> int | None:
        return next((cid for cid, users in self._calls.items() if user_id in users), None)

    def join(
        self, conversation_id: int, user_id: int, websocket: WebSocket
    ) -> tuple[int | None, WebSocket | None]:
        # One call per person: returns the call and socket that were replaced, if any.
        previous_call = self.call_of(user_id)
        previous_socket = None

        if previous_call is not None:
            previous_socket = self._calls[previous_call].pop(user_id)
            if not self._calls[previous_call]:
                del self._calls[previous_call]

        self._calls.setdefault(conversation_id, {})[user_id] = websocket

        return previous_call, previous_socket

    def leave(self, conversation_id: int, user_id: int, websocket: WebSocket | None = None) -> bool:
        users = self._calls.get(conversation_id, {})

        if user_id not in users or (websocket is not None and users[user_id] is not websocket):
            return False

        del users[user_id]
        if not users:
            del self._calls[conversation_id]

        return True

    def leave_socket(self, user_id: int, websocket: WebSocket) -> int | None:
        conversation_id = self.call_of(user_id)

        if conversation_id is not None and self.leave(conversation_id, user_id, websocket):
            return conversation_id

        return None


calls = CallManager()
