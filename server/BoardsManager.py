import GameBoard

"""A class to manage game boards"""
class BoardsManager():
    def __init__(self):
        self.boards = {}
        self.lastId = 0
        print("Init'd")
    
    def getBoard(self, boardId):
        if boardId in self.boards:
            return self.boards[boardId]
        else:
            return None

    def getConflicts(self, boardId):
        board = self.getBoard(boardId)
        if not hasattr(board.currentPhase, "conflicts"):
            return None
        return [conflict.toDict() for conflict in board.currentPhase.conflicts]

    def newBoard(self, boardName, module):
        self.lastId += 1
        self.boards[self.lastId] = GameBoard.Board(boardName, module)
        return self.lastId

    def listBoards(self):
        #Have this return a more lightweight representation instead, like board 
        #title and ids
        return [{"id": boardId, "name": self.boards[boardId].name} for boardId in self.boards]
