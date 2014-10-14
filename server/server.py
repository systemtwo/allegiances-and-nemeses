import tornado.ioloop
import tornado.web

import os.path


STATIC_CONTENT_PATH = "static/"


#A File handler that always serves files
class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
	def set_extra_headers(self, path):
		self.set_header("Cache-control", "no-cache")

	def should_return_304(self):
		return False

class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		self.write("The Allegiances and the Nemeses says \"Hello, World!\"")


app = tornado.web.Application([
	(r"/", IndexHandler),
	(r"/js/(.*)", NoCacheStaticFileHandler, {"path": os.path.join(STATIC_CONTENT_PATH, "js")})
])


#Import guard 
if __name__ == "__main__":
	app.listen(8888)


	#Allow Ctrl-C to stop application
	#    http://stackoverflow.com/questions/17101502/how-to-stop-the-tornado-web-server-with-ctrlc

	try:
		print "Starting Server"
		tornado.ioloop.IOLoop.instance().start()
	except KeyboardInterrupt:
		print "Stopping Server"
		tornado.ioloop.IOLoop.instance().stop()


