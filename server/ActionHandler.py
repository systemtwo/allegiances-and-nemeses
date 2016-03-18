import json
import uuid

import tornado.web
from voluptuous import Schema, Required, MultipleInvalid

from AuthHandlers import BaseAuthHandler
from GameBoard import Util, BoardState
import Sessions


class ActionHandler(BaseAuthHandler):
    def initialize(self, config, gamesManager, gameSocket):
        super(ActionHandler, self).initialize(config=config)
        self.gamesManager = gamesManager
        self.gameSocket = gameSocket

    @tornado.web.authenticated
    def post(self, **params):
        boardId = str(params["boardId"])
        board = self.gamesManager.getBoard(boardId)

        def territoryByName(tName):
            return Util.getByName(board.territories, tName)

        if not board:
            self.send_error(404)
            return

        try:
            schema = Schema({
                Required("action"): unicode,
            }, extra=True)
            requestData = schema(json.loads(self.request.body.decode("utf-8")))
        except MultipleInvalid as e:
            self.send_error(400)
            return

        #See if it is the user's turn
        userSession = Sessions.SessionManager.getSession(self.current_user)
        userId = userSession.getValue("userid")
        if not board.isPlayersTurn(userId):
            self.send_error(403)  # Forbidden
            return

        #We are safe to do this, because we return in the except call (thereby eliminating the 
        #case where requestData is not set
        action = requestData["action"]

        if "nextPhase" == action:
            # TODO improve error handling
            self.assertPhase(requestData["currentPhase"], board)
            board.currentPhase.nextPhase()
            userSession = Sessions.SessionManager.getSession(self.current_user)
            boardInfo = BoardState.exportBoardToClient(board)
            boardInfo["isPlayerTurn"] = board.isPlayersTurn(userSession.getValue("userid"))
            self.write(json.dumps(boardInfo))

        elif "buy" == action:
            # buy units, with validation
            success = board.currentPhase.setBuyList(requestData["boughtUnits"])
            if not success:
                self.send_error()

        elif "moveMany" == action:
            self.assertMovePhase(board)
            unitIds = requestData["unitList"]
            units = [board.unitById(uuid.UUID(unitId)) for unitId in unitIds]
            assert len(unitIds) == len(units), "Could not find matching unit for every id"
            destinationTerritory = territoryByName(requestData["to"])
            success = board.currentPhase.moveUnits(units, destinationTerritory)

            if not success:
                self.send_error(400)

        elif "move" == action:
            self.assertMovePhase(board)
            unitId = uuid.UUID(requestData["unitId"])
            unit = board.unitById(unitId)
            assert unit is not None, "Could not find unit for id"
            destinationTerritory = territoryByName(requestData["to"])
            success = board.currentPhase.move(unit, destinationTerritory)
            if not success:
                self.send_error(400)

        elif "battleTick" == action:
            self.assertPhase("ResolvePhase", board)

        elif "retreat" == action:
            self.assertPhase("ResolvePhase", board)
            fromTerritory = territoryByName(requestData["from"])
            toTerritory = territoryByName(requestData["to"])
            board.currentPhase.retreat(fromTerritory, toTerritory)

        elif "autoResolve" == action:
            self.assertPhase("ResolvePhase", board)
            territory = territoryByName(requestData["territory"])
            assert territory is not None, "Invalid territory name %r" % requestData["territory"]
            board.currentPhase.autoResolve(territory)

        elif "autoResolveAll" == action:
            self.assertPhase("ResolvePhase", board)
            board.currentPhase.autoResolveAll()

        elif "placeUnit" == action:
            self.assertPhase("PlacementPhase", board)
            territory = territoryByName(requestData["territory"])
            board.currentPhase.place(requestData["unitType"], territory)

        elif "getEventLog" == action:
            pass  # TODO

        else:
            self.send_error()

        self.gameSocket.notifyByGameId(boardId, BoardState.exportBoardToClient(board), [self.current_user])

    def assertMovePhase(self, board):
        if board.currentPhase.name not in ["AttackPhase", "MovementPhase"]:
            self.send_error(400)

    def assertPhase(self, phaseName, board):
        if phaseName != board.currentPhase.name:
            self.send_error(400)
            raise NameError(phaseName + " did not equal " + board.currentPhase.name)
