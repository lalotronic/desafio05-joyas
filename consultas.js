const { Pool } = require('pg');
const format = require('pg-format');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '1234',
    database: 'Joyas',
    allowExitOnIdle: true
});

// Función para obtener las joyas
const obtenerJoyas = async ({ limits, order_by = "stock", page = 0 }) => {
    if (typeof limits !== 'number' || limits <= 0) {
        throw new Error('Invalid limits');
    }
    if (typeof page !== 'number' || page < 0) {
        throw new Error('Invalid page');
    }

    const [campo, direccion] = order_by.split("_");
    const offset = page * limits;
    const formattedQuery = format('SELECT * FROM inventario ORDER BY %s %s LIMIT %s OFFSET %s', campo, direccion, limits, offset);

    const { rows: joyas } = await pool.query(formattedQuery);
    return joyas;
};

// Función para preparar HATEOAS
const prepararHATEOAS = (inventario) => {
    const results = inventario.map((m) => {
        return {
            name: m.nombre,
            href: `http://localhost:3000/joyas/${m.id}`,
        };
    }).slice(0, 6);
    
    const total = inventario.length;
    const HATEOAS = {
        total,
        results
    };
    return HATEOAS;
};
// Función para obtener joyas por ID
const obtenerJoyasPorId = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error('ID inválido'); // Manejo de ID inválido
    }
    const consulta = "SELECT * FROM inventario WHERE id = $1";
    try {
        const { rows: joya } = await pool.query(consulta, [id]);
        return joya.length > 0 ? joya : null; // Devuelve null si no se encuentra la joya
    } catch (error) {
        console.error("Error en la consulta:", error);
        throw error; // Re-lanzar el error para manejarlo más arriba
    }
};

// Función para obtener joyas por filtros
const obtenerJoyasPorFiltros = async ({ precio_min, precio_max, categoria, metal }) => {
    let filtros = [];
    const values = [];

    // Validación y conversión de precios
    if (precio_min !== undefined) {
        const minPrecio = parseFloat(precio_min);
        if (!isNaN(minPrecio)) {
            filtros.push(`precio >= $${values.length + 1}`);
            values.push(minPrecio);
        }
    }

    if (precio_max !== undefined) {
        const maxPrecio = parseFloat(precio_max);
        if (!isNaN(maxPrecio)) {
            filtros.push(`precio <= $${values.length + 1}`);
            values.push(maxPrecio);
        }
    }

    // Filtros de categoría y metal
    if (categoria) {
        filtros.push(`categoria = $${values.length + 1}`);
        values.push(categoria);
    }

    if (metal) {
        filtros.push(`metal = $${values.length + 1}`);
        values.push(metal);
    }

    let consulta = "SELECT * FROM inventario";
    
    if (filtros.length > 0) {
        const condiciones = filtros.join(" AND ");
        consulta += ` WHERE ${condiciones}`;
    }

    console.log("Consulta SQL:", consulta); // Para depuración
    console.log("Valores:", values); // Para depuración

    try {
        const { rows: joyas } = await pool.query(consulta, values);
        return joyas;
    } catch (error) {
        console.error("Error en la consulta:", error);
        throw error; // Re-lanzar el error para manejo posterior
    }
};

module.exports = { obtenerJoyas, obtenerJoyasPorId, obtenerJoyasPorFiltros, prepararHATEOAS };