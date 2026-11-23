from fastapi import WebSocket

class ConnectionManager:
    def __init__(self) -> None:
        self._sockets: dict[int, set[WebSocket]] = {}

    def connect(self, user_id: int, websocket: WebSocket) -> bool:
        """Returns True when this is the user's first connection (just came online)."""
        sockets = self._sockets.setdefault(user_id, set())
        sockets.add(websocket)

        return len(sockets) == 1

    def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        """Returns True when the user has no connections left (closed every tab)."""
        sockets = self._sockets.get(user_id, set())
        sockets.discard(websocket)

        if sockets:
            return False

        self._sockets.pop(user_id, None)
        return True

    async def send(self, user_ids: list[int], payload: dict) -> None:
        for user_id in user_ids:
            for websocket in list(self._sockets.get(user_id, ())):
                try:
                    await websocket.send_json(payload)
                except Exception:
                    # A dead socket must not make the sender's request fail.
                    self.disconnect(user_id, websocket)


connections = ConnectionManager()
