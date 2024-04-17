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


const getPetsByOwnerNameAndType = async (ownerName, type) => {
  const query = `
    SELECT pets.name, pets.id
    FROM pets
      JOIN people ON pets.owner_id = people.id
    WHERE people.name=? AND pets.type=?
  `
  const { rows } = await knex.raw(query, [ownerName, type]);
  return rows;
}

const getBooksByAuthor = async (firstName, lastName) => {
  const query = `
    SELECT books.title, books.published_year, authors.first_name, authors.last_name
    FROM authors
      JOIN author_book ON author_book.author_id = authors.id
      JOIN books ON author_book.book_id = books.id
    WHERE authors.first_name=? AND authors.last_name=?;
  `
  const { rows } = await knex.raw(query, [firstName, lastName]);
  return rows;
}

const getProductsBoughtByCustomer = async (name) => {
  const query = `
    SELECT COUNT(*), products.name, products.price
    FROM customers
      JOIN orders ON orders.customer_id = customers.id
      JOIN products ON orders.product_id = products.id
    WHERE customers.name=?
    GROUP BY products.name, products.price;
  `
  const { rows } = await knex.raw(query, [name]);
  return rows;
}

const main = async () => {

  await createPet('Swiper', 'fox', 3);

  const pets = await getPets();
  const people = await getPeople();
  const annsDogs = await getPetsByOwnerNameAndType('Ann Duong', 'dog');
  const JamesBaldwinBooks = await getBooksByAuthor('James', 'Baldwin');
  const annsProducts = await getProductsBoughtByCustomer('Ann');

  console.log('all pets:', pets);
  console.log('all people:', people);
  console.log('anns dogs:', annsDogs);
  console.log('James Baldwin Books:', JamesBaldwinBooks);
  console.log('anns products:', annsProducts);

  knex.destroy();
}

main();