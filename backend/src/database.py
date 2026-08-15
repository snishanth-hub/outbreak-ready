import os

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "city-population")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "zombie_outbreak")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client[MONGO_DB]
collection = db[MONGO_COLLECTION]

try:
    collection.create_index([("lat", 1), ("lon", 1)])
except Exception:
    pass
