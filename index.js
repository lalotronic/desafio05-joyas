const cors = require('cors');
const express = require('express');
const { obtenerJoyas, obtenerJoyasPorId, obtenerJoyasPorFiltros, prepararHATEOAS } = require('./consultas');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para todas las rutas
app.use(cors());
app.use(express.json()); // Permite el middleware para parsear cuerpo de consulta

app.listen(PORT, () => {
    console.log(`SERVIDOR ENCENDIDO en el puerto ${PORT}`);
});

// Ruta para obtener joyas
app.get('/joyas', async (req, res) => {
    const limits = parseInt(req.query.limits);
    const order_by = req.query.order_by;
    const page = parseInt(req.query.page);

    if (isNaN(limits) && !order_by && isNaN(page)) {
        // Si no hay parámetros, devuelve la estructura HATEOAS
        try {
            const joyas = await obtenerJoyas({ limits: 10 }); // Obtener un número por defecto de joyas
            const HATEOAS = prepararHATEOAS(joyas);
            res.json(HATEOAS);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al obtener las joyas');
        }
    } else {
        // Validar y usar valores por defecto si es necesario
        const validLimits = isNaN(limits) || limits <= 0 ? 6 : limits; // Establecer un límite por defecto
        const validPage = isNaN(page) || page < 0 ? 0 : page; // Establecer la página por defecto
        const validOrderBy = order_by || 'stock_ASC'; // Valor por defecto para order_by

        try {
            const joyas = await obtenerJoyas({ limits: validLimits, order_by: validOrderBy, page: validPage });
            res.json(joyas); // Devuelve solo las joyas sin HATEOAS
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al obtener las joyas');
        }
    }
});

// Ruta para filtros
app.get('/joyas/filtros', async (req, res) => {
    const queryStrings = {
        precio_min: req.query.precio_min,
        precio_max: req.query.precio_max,
        categoria: req.query.categoria,
        metal: req.query.metal
    };

    // Impresión para depuración de parámetros
    console.log("Parámetros de consulta:", queryStrings);

    try {
        const joyas = await obtenerJoyasPorFiltros(queryStrings);
        res.json(joyas);
    } catch (error) {
        console.error("Error al obtener joyas por filtros:", error);
        res.status(500).send('Error al obtener las joyas');
    }
});

// Ruta para obtener joyas por ID
app.get("/joyas/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const joya = await obtenerJoyasPorId(id);
        if (!joya) {
            return res.status(404).send('Joya no encontrada'); // Manejo de caso sin resultados
        }
        res.json(joya);
    } catch (error) {
        console.error("Error al obtener joya por ID:", error);
        res.status(500).send('Error al obtener la joya');
    }
});

// Ruta para cualquier otra ruta no especidficada
app.get("*", (req, res) => {
    res.status(404).send("Esta ruta no existe");
});