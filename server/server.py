import tornado.ioloop
import tornado.web

import os.path

import config
import utils

import game

STATIC_CONTENT_PATH = config.STATIC_CONTENT_PATH



class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		with open(os.path.join(STATIC_CONTENT_PATH, "html", "index.html")) as f:
			self.write(f.read())


class BoardHandler(tornado.web.RequestHandler):
	def get(self, boardid):
		iceland = game.Country("Iceland")

		t1 = game.Territory("Ontario", 10, iceland)
		t2 = game.Territory("Quebec", 10, iceland)
		t3 = game.Territory("Nova Scotia", 10, iceland)

		t1.connections.append(t2)
		t2.connections.append(t3)
		t2.connections.append(t1)
		t3.connections.append(t2)

		fighter = game.Unit("fighter", iceland, t1)

		board = game.Board([fighter], [iceland], config.unitListFile, config.territoryListFile)
		self.write(boardid)
		self.write(str(board.getPath(t1, t2, fighter)))

	def post(self, boardid):
		req = self.request
		self.write("boardid:" + str(boardid))
		self.write(str(req.body))
		#self.write(self.get_argument("key"))



class Server:
	def __init__(self):
		app = tornado.web.Application([
			(r"/", IndexHandler),
			(r"/boards/([0-9]+)", BoardHandler), 
			(r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": os.path.join(STATIC_CONTENT_PATH)}) #This is not a great way of doing this TODO: Change this to be more intuative
		])

		app.listen(8888)
		ioloop = tornado.ioloop.IOLoop.instance()

		print "Starting Server"
		ioloop.start()

