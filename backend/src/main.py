from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import collection

app = FastAPI(title="Outbreak Ready API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Outbreak Ready API"}


@app.get("/heatmap-data")
def get_heatmap_data(
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    limit: int = 100000,
):
    query = {}
    if min_lat is not None and max_lat is not None:
        query["lat"] = {"$gte": min_lat, "$lte": max_lat}
    if min_lon is not None and max_lon is not None:
        query["lon"] = {"$gte": min_lon, "$lte": max_lon}
    cursor = collection.find(query, {"_id": 0}).limit(limit)
    return list(cursor)
