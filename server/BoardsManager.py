import game

"""A class to manage game boards"""
class BoardsManager():
    def __init__(self):
        self.boards = {}
        self.lastId = 0
        print "Init'd"
    
    def getBoard(self, boardId):
        if boardId in self.boards:
            return self.boards[boardId]
        else:
            return None

    def newBoard(self, module):
        self.lastId += 1
        self.boards[self.lastId] = game.Board(module)
        return self.lastId

    def listBoards(self):
        #Have this return a more lightweight representation instead, like board 
        #title and ids
        return [boardId for boardId in self.boards]
        return self.boards
