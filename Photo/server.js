const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// Crear carpeta de fotos si no existe
const fotosDir = path.join(__dirname, 'fotos');
if (!fs.existsSync(fotosDir)) {
    fs.mkdirSync(fotosDir, { recursive: true });
}

// Servir fotos estáticas
app.use('/fotos', express.static(fotosDir));

// Endpoint para listar fotos
app.get('/api/fotos', (req, res) => {
    try {
        const archivos = fs.readdirSync(fotosDir)
            .filter(file => file.endsWith('.png'))
            .map(file => {
                const filePath = path.join(fotosDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    url: `/fotos/${file}`,
                    timestamp: new Date(stats.mtime).toLocaleString('es-SV', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                };
            })
            .sort((a, b) => b.filename.localeCompare(a.filename));

        res.json({
            success: true,
            fotos: archivos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para guardar foto
app.post('/api/guardar-foto', (req, res) => {
    try {
        const { imagen } = req.body;

        if (!imagen) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió imagen'
            });
        }

        // Extraer datos base64
        const base64Data = imagen.replace(/^data:image\/png;base64,/, '');
        
        // Generar nombre único
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 9000) + 1000;
        const filename = `foto_${timestamp}_${random}.png`;
        const filepath = path.join(fotosDir, filename);

        // Guardar archivo
        fs.writeFileSync(filepath, base64Data, 'base64');

        res.json({
            success: true,
            filename: filename,
            url: `/fotos/${filename}`,
            timestamp: new Date().toLocaleString('es-SV', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        });
    } catch (error) {
        console.error('Error al guardar foto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para eliminar foto (opcional)
app.delete('/api/fotos/:filename', (req, res) => {
    try {
        const filepath = path.join(fotosDir, req.params.filename);
        
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({
                success: true,
                message: 'Foto eliminada'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Foto no encontrada'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Fotos guardadas en: ${fotosDir}`);
});