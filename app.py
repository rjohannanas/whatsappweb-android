# app.py
import os
from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv

# Carga las variables de entorno (tu API Key de Gemini)
load_dotenv()

# Configura la API de Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

# Crea la aplicación Flask
app = Flask(__name__)

# Define el endpoint que procesará el texto
@app.route('/procesar', methods=['POST'])
def procesar_texto():
    # Obtenemos el JSON que nos envía Node.js
    data = request.get_json()

    # Validamos que nos hayan enviado el campo 'texto'
    if not data or 'texto' not in data:
        return jsonify({"error": "No se proporcionó texto para procesar"}), 400

    prompt = data['texto']

    try:
        # Aquí ocurre la magia: enviamos el prompt a Gemini
        print(f"Recibido para Gemini: {prompt}")
        response = model.generate_content(prompt)

        # Devolvemos la respuesta de Gemini en formato JSON
        return jsonify({"respuesta": response.text})

    except Exception as e:
        print(f"Error al contactar con Gemini: {e}")
        return jsonify({"error": "Hubo un problema al procesar tu solicitud"}), 500

# Inicia el servidor en el puerto 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
