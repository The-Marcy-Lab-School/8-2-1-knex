const knex = require('./knex');

const getPets = async () => {
  // knex.raw returns a query result object
  const result = await knex.raw("SELECT * FROM pets");

  // .rows is an array containing the query data
  return result.rows;
};

const getPeople = async () => {
  // We can use `` to create multi-line queries
  const query = `
    SELECT * 
    FROM people
  `
  // most of the time, we immediately destructure the rows out of the object
  const { rows } = await knex.raw(query);
  return rows;
};

const createPet = async (name, type, owner_id) => {
  // The ? is how we dynamically insert values into a query
  // To avoid SQL injection attacks, we want to avoid inserting
  // dynamic values into a SQL query through interpolation: `${}`
  const query = `
    INSERT INTO pets (name, type, owner_id)
    VALUES (?, ?, ?)
  `

  // We can set the value for each ? by providing an ordered array
  // as a second argument to knex.raw
  const { rows } = await knex.raw(query, [name, type, owner_id]);
  return rows;
};


// given an owner name and type, return
const getPetsByOwnerNameAndType = async (ownerName, type) => {

}

const main = async () => {
  await createPet('Swiper', 'fox', 3);

  const pets = await getPets();
  console.log('pets:', pets);

  const people = await getPeople();
  console.log('people:', people);

  const annsDogs = await getPetsByOwnerNameAndType('ann', 'dog');
  console.log('anns dogs:', annsDogs);

  knex.destroy();
}

main();