from flask import Flask
import resources
from flask_restful import Api
from flask_cors import CORS

app = Flask(__name__)
api = Api(app)
CORS(app)

api.add_resource(resources.Prediction, '/prediction')