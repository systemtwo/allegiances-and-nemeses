import json
import tornado.web
from server import BoardCollection


class ActionHandler(tornado.web.RequestHandler):
    def get(self, **params):
        try:
            require(["boardId"], params)
            board = BoardCollection.getBoard(params["boardId"])

            action = self.get_argument("action")
            if "buy" == action:
                # buy units, with validation
                success = board.currentPhase.setBuyList(json.loads(self.get_argument("boughtUnits")))
                if success:
                    board.currentPhase.nextPhase()
                self.write(json.dumps({"success": success}))

        except MissingParamException as e:
            print(e)
            self.send_error()


def require(attributes, dictionary):
    for attr in attributes:
        if attr not in dictionary:
            raise MissingParamException("Attribute not found in parameters: " + attr)


class MissingParamException(Exception):
    pass