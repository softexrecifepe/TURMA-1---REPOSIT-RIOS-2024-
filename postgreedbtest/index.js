const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = 3000;

// Configuração do pool de conexão com a string de conexão fornecida
const pool = new Pool({
  connectionString: "postgresql://clinica_0o65_user:OKBy1oVhaX5kWiLmetvBoWIkFaIxByKq@dpg-cs6kbb2j1k6c73a5oac0-a.oregon-postgres.render.com/clinica_0o65",
  ssl: {
    rejectUnauthorized: false // Configuração de SSL, caso necessário
  }
});

// Middleware para interpretar o JSON
app.use(express.json());

// Rota para consultar todos os tutores
app.get("/tutores", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tutores");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao consultar tutores");
  }
});

// Rota para consultar todos os pets
app.get("/pets", async (req, res) => {
  try {
    console.log("Consultando a tabela pets...");
    const result = await pool.query("SELECT * FROM pets");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao consultar pets:", err);
    res.status(500).send("Erro ao consultar pets");
  }
});

// Rota para cadastrar um novo pet
app.post("/pets", async (req, res) => {
  const { nome, especie, raca, idade, tutor_id } = req.body;

  if (!nome || !tutor_id) {
    return res.status(400).send("Nome e tutor_id são obrigatórios");
  }

  try {
    const result = await pool.query(
      `INSERT INTO pets (nome, especie, raca, idade, tutor_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, especie, raca, idade, tutor_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao cadastrar pet");
  }
});

// Rota para consultar todos os pets internados
app.get("/pets/internados", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nome AS pet_nome, i.data_internamento, i.data_alta, i.observacoes
      FROM pets p
      JOIN internamentos i ON p.id = i.pet_id
      WHERE i.data_alta IS NULL
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao consultar pets internados");
  }
});

// Rota para consultar todos os pets com tratamentos
app.get("/pets/tratamentos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nome AS pet_nome, t.data_tratamento, t.descricao
      FROM pets p
      JOIN tratamentos t ON p.id = t.pet_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao consultar pets com tratamentos");
  }
});

// Rota para consultar todos os pets que tiveram altas
app.get("/pets/altas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nome AS pet_nome, i.data_internamento, i.data_alta
      FROM pets p
      JOIN internamentos i ON p.id = i.pet_id
      WHERE i.data_alta IS NOT NULL
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao consultar pets que tiveram altas");
  }
});

// Inicia a conexão com o banco e o servidor
pool
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log("conectado com sucesso ao banco de dados");
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao banco de dados", err.stack);
    process.exit(1); // Encerra o processo caso a conexão falhe
  });
