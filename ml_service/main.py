from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Load pre‑trained model (placed at /app/model.pkl after training)
try:
    model = joblib.load("/app/model.pkl")
except Exception as e:
    model = None
    print(f"[ML service] Model load error: {e}")

class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    risk_score: float

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    X = np.array([req.features])
    # Assume binary classifier with predict_proba
    prob = model.predict_proba(X)[0, 1]
    return PredictResponse(risk_score=float(prob))
