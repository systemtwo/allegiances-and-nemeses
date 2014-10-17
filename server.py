import tornado.ioloop
import tornado.web

import os.path

import config


STATIC_CONTENT_PATH = config.STATIC_CONTENT_PATH


#A File handler that always serves files
class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
	def set_extra_headers(self, path):
		self.set_header("Cache-control", "no-cache")

	def should_return_304(self):
		return False


class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		with open(os.path.join(STATIC_CONTENT_PATH, "html", "index.html")) as f:
			self.write(f.read())


class BoardHandler(tornado.web.RequestHandler):
	def get(self, boardid):
		self.write(boardid)



class Server:
	def __init__(self):
		app = tornado.web.Application([
			(r"/", IndexHandler),
			(r"/board/([0-9]+)", BoardHandler), 
			(r"/static/(.*)", NoCacheStaticFileHandler, {"path": os.path.join(STATIC_CONTENT_PATH)}) #This is not a great way of doing this TODO: Change this to be more intuative
		])

		app.listen(8888)
		ioloop = tornado.ioloop.IOLoop.instance()

		print "Starting Server"
		ioloop.start()

