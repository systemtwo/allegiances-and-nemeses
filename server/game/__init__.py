#Package init

#For import *
__all__ = ["Board", "Country", "Phases", "Territory", "Unit"]


#Lets move some classes into this namespace (so we do not need to do Board.Board())
from Board import Board
from Country import Country
from Territory import Territory
from Unit import Unit

import Phases
