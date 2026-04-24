from fastapi import FastAPI, File, UploadFile
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

#entrar no ambiente virtual com: .\.venv\Scripts\activate
#subir o serviço python com: python -m uvicorn aiservice:app --port 8000 
#subir o serviço python antes do aplicativo node, para garantir que o serviço de IA esteja rodando e pronto para receber as requisições do aplicativo node.
app = FastAPI()

#caminho absoluto do modelo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "reconhecimento_incendio.keras")

#carregar modelo
model = tf.keras.models.load_model(model_path)

#classes
class_names = ['incendio', 'naoIncendio']

IMG_HEIGHT = 224
IMG_WIDTH = 224

#preprocessamento
def preprocess(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((IMG_HEIGHT, IMG_WIDTH))
    
    img_array = np.array(image)
    img_array = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)
    
    return img_array

#endpoint
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    img = preprocess(contents)

    predictions = model.predict(img)

    #IMPORTANTE
    score = tf.nn.softmax(predictions[0])

    predicted_class = class_names[np.argmax(score)]
    confidence = float(np.max(score) * 100)

    if predicted_class == "incendio":
        return {
            "resultado": "incendio",
            "confianca": confidence,
            "alerta": "🔥 INCÊNDIO DETECTADO!"
        }
    else:
        return {
            "resultado": "nao_incendio",
            "confianca": confidence,
            "mensagem": "Tudo normal 👍"
        }