import tornado.ioloop
import tornado.web

import os.path
import json

import utils
import game


import random




class IndexHandler(tornado.web.RequestHandler):
	def initialize(self, html_path):
		self.HTML_PATH = html_path

	def get(self):
		with open(os.path.join(self.HTML_PATH, "index.html")) as f:
			self.write(f.read())


class BoardHandler(tornado.web.RequestHandler):
	def initialize(self):
		pass

	def get(self):
		pass

	def post(self):
		pass


class BoardsHandler(tornado.web.RequestHandler):
	#TODO: Consider spliting this class to handle the different scenarios
	actions = utils.Enum(["ALL", "NEW", "ID"])

	def initialize(self, config, action):
		self.config = config
		self.action = action

	def get(self, **params):
		if self.action == self.actions.ALL:
			#Return list of active boards
			self.write("All")
		elif self.action == self.actions.NEW:
			#Make a new board
			self.redirect(r"/boards/" + str(random.randint(0, 100)))
		elif self.action == self.actions.ID:
			#Return info about board with id boardId
			self.write("Board" + str(params["boardId"]))


	def post(self, **params):
		if self.action == self.actions.ID:
			req = self.request
			self.write("boardid:" + str(params["boardId"]))
			self.write(str(req.body))
		else:
			self.set_status(405)
			self.write("Method Not Allowed")
		return




class Server:
	def __init__(self, config):
		self.app = tornado.web.Application([
			(r"/", IndexHandler, dict(html_path=os.path.join(config.STATIC_CONTENT_PATH, "html"))),
			(r"/boards/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ALL)), 
			(r"/boards/new/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.NEW)), 
			(r"/boards/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID)), #Consider using named regex here
			(r"/shared/(.*)", utils.NoCacheStaticFileHandler, {"path": config.SHARED_CONTENT_PATH}), 
			(r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": config.STATIC_CONTENT_PATH}) #This is not a great way of doing this TODO: Change this to be more intuative
		])

		self.app.listen(8888)
		self.ioloop = tornado.ioloop.IOLoop.instance()

	def start(self):
		print "Starting Server"
		self.ioloop.start()

