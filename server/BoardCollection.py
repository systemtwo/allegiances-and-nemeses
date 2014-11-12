# namespace for holding and creating boards
# Created to make accessing and handling boards simpler if using more than one handler
from game import Board


boards = {} # We use a map here so we can easily delete boards


def addBoard(board):
    if board.id in boards:
        raise Exception("Board id already in list")

    boards[board.id] = board


def getBoard(boardId):
        #We use ints for the id, so we force the boardId to be an int
        normalizedBoardId = int(boardId)
        if normalizedBoardId in boards:
            return boards[normalizedBoardId]
        return None

# TODO remove test code
addBoard(Board("default"))