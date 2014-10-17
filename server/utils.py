import tornado.ioloop
import tornado.web

#A File handler that always serves files
class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
	def set_extra_headers(self, path):
		self.set_header("Cache-control", "no-cache")

	def should_return_304(self):
		return False
