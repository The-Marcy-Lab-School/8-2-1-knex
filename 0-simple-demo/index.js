const knex = require('./knex');

const getPets = async () => {
  const result = await knex.raw("SELECT * FROM pets");
  console.log(result.rows);
}

const main = async () => {
  await getPets();

  knex.destroy();
}

main();