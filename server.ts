import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Inicialización de Gemini con User-Agent de aistudio-build
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint para generar la explicación del resultado de orientación
app.post('/api/explicacion', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.opciones || !payload.perfil) {
      return res.status(400).json({ error: 'Payload de orientación inválido o incompleto' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const systemInstruction =
      'Eres el orientador educativo de Bachillerato en el País Vasco para el curso 2026-2027. ' +
      'Redacta en español, entre 120 y 180 palabras, con un tono cercano y motivador para un estudiante de Bachillerato. ' +
      'Explica con claridad por qué le salen estas opciones usando ÚNICAMENTE los datos del JSON proporcionado. ' +
      'Prohibido añadir, quitar o reordenar opciones recomendadas. ' +
      'Prohibido inventar notas de corte, precios, ni requisitos adicionales no presentes en los datos. ' +
      'Menciona las opciones en el mismo orden que aparecen en el JSON.';

    const prompt =
      `Datos del resultado del sistema experto de orientación:\n` +
      JSON.stringify(payload, null, 2) +
      `\n\nRedacta la explicación para el estudiante siguiendo exactamente las instrucciones del sistema.`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout al contactar Gemini API')), 6000)
    );

    const response: any = await Promise.race([aiPromise, timeoutPromise]);

    const texto = response.text || '';
    return res.json({ explicacion: texto });
  } catch (err: any) {
    console.error('Error en /api/explicacion:', err);
    return res.status(500).json({ error: 'Error al generar explicación con IA', detalle: err?.message });
  }
});

// Configuración de Vite o archivos estáticos
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Servidor Orientador FP y Universidad iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
