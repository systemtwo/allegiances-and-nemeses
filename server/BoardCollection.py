# namespace for holding and creating boards
# Created to make accessing and handling boards simpler if using more than one handler
import uuid
from game import Board


boards = {}  # We use a map here so we can easily delete boards


def addBoard(board):
    if board.id in boards:
        raise Exception("Board id already in list")

    boards[board.id] = board


def getBoard(boardId):
        normalizedBoardId = uuid.UUID(boardId)
        if normalizedBoardId in boards:
            return boards[normalizedBoardId]
        return None


def getBoardIds():
    return [k.hex for k in boards.keys()]

# TODO remove test code
addBoard(Board("default"))