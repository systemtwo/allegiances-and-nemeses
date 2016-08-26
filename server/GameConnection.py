import sockjs.tornado
import Sessions
from GameBoard import BoardState


class GameConnection(sockjs.tornado.SockJSConnection):
    """Chat connection implementation"""
    # Class level variable
    participants = set()

    def on_open(self, info):
        # Send that someone joined
        self.broadcast(self.participants, {
            'type': 'message',
            'payload': 'Someone joined'
        })

        self.userId = info.get_argument('userId')
        self.gameId = int(info.get_argument('gameId'))

        # Add client to the clients list
        self.participants.add(self)

    def on_close(self):
        # Remove client from the clients list and broadcast leave message
        self.participants.remove(self)

        self.broadcast(self.participants, {
            'type': 'message',
            'payload': 'Someone left'
        })


class GameSocketRouter(sockjs.tornado.SockJSRouter):
    def notifyByGameId(self, gameId, board, excluded=None):
        gameState = BoardState.exportBoardToClient(board)
        if not excluded:
            excluded = []
        for p in self._connection.participants:
            if p.gameId == gameId:
                # Override a single field (doesn't copy the entire game state)
                gameState["isPlayerTurn"] = board.isPlayersTurn(p.userId)
                self.broadcast([p], {
                    'type': 'gameUpdate',
                    'payload': gameState
                })
