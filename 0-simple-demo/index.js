const knex = require('./knex');

const setup = async () => {
  // For these queries, we don't care about the returned value
  await knex.raw('DROP TABLE IF EXISTS pets;')
  await knex.raw('DROP TABLE IF EXISTS people;')
  await knex.raw(`
    CREATE TABLE people (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
  `)
  await knex.raw(`
    CREATE TABLE pets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL, 
      type TEXT NOT NULL, 
      owner_id INTEGER REFERENCES people
    );
  `)
  await knex.raw(`INSERT INTO people (name) VALUES ('Ann Duong');`);
  await knex.raw(`INSERT INTO people (name) VALUES ('Reuben Ogbonna');`);
  await knex.raw(`INSERT INTO people (name) VALUES ('Carmen Salas');`);
  await knex.raw(`INSERT INTO people (name) VALUES ('Ben Spector');`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Khalo', 'dog', 3);`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Juan Pablo', 'dog', 2);`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Bora', 'bird', 1);`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Tora', 'dog', 1);`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Frida', 'cat', 3);`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Pon Juablo', 'cat', 2);`);
  await knex.raw(`INSERT INTO pets (name, type, owner_id) VALUES ('Kora', 'dog', 1);`);
}

const getPets = async () => {
  // knex.raw returns a query result object
  let result = await knex.raw("SELECT * FROM pets");

  // .rows is an array containing the query data
  return result.rows;
};

const getPeople = async () => {

};

const getPetsByOwnerNameAndType = async (ownerName, type) => {

}

const main = async () => {
  await setup();

  const pets = await getPets();

  console.log(pets);

  knex.destroy();
}

main();