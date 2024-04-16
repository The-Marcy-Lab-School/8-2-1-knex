const knex = require('./knex');

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
  const pets = await getPets();

  console.log(pets);

  knex.destroy();
}

main();