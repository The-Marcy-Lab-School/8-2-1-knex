# Knex

TablePlus and `psql` in our terminal are great for testing out SQL statements, but they can only take us so far since we have to manually run the SQL statements ourselves. 

In this lesson, we will learn [Knex](https://knexjs.org/), a library that allows a Node project to connect to a databases and execute SQL queries. This will enable our server applications to access data from a Postgres database and have a persistent data layer.

**Table of Contents**

- [Terms](#terms)
- [Getting Started: Setting up a Database](#getting-started-setting-up-a-database)
- [What is Knex?](#what-is-knex)
- [Configuring Knex](#configuring-knex)
  - [0) Installing modules](#0-installing-modules)
  - [1) Configuring a Connection: `knexfile.js`](#1-configuring-a-connection-knexfilejs)
  - [2) Create a `knex` object to connect to the database](#2-create-a-knex-object-to-connect-to-the-database)
  - [3) Use the `knex` connection object to execute queries](#3-use-the-knex-connection-object-to-execute-queries)
- [Writing queries using `knex.raw`](#writing-queries-using-knexraw)
  - [Multi-Line Queries](#multi-line-queries)
  - [Dynamic Queries](#dynamic-queries)
  - [Create, Update, and Delete](#create-update-and-delete)
- [Challenges](#challenges)


## Terms

* **Knex** - a library that allows a Node project to connect to a databases and execute SQL queries.
* **Environment Variables** - a variable that is defined outside the scope of the JavaScript execution context. We'll use it with Knex to configure the connection with a Postgres database.
* **`knexfile.js`** - a file that holds configuration data for connecting to a database
* **`knex.js`** - a file that exports a `knex` object which has been configured to execute SQL commands to a database.
* **`knex.raw(query)`** - a method used to execute a given SQL query.

## Getting Started: Setting up a Database

Take a look at the `0-simple-demo/db.sql` file. It contains the SQL commands to create and populate a database called `playground`. This database will have five tables: `people`, `pets`, `customers`, `orders`, `products`.

We can run these commands to set up our work (if working on windows, add `sudo -u postgres` before each command)
```
psql -c "DROP DATABASE playground;"
psql -c "CREATE DATABASE playground;"
psql -d playground -f db.sql
```
Alternatively, you can copy and paste the contents of `db.sql` and run in a SQL terminal or GUI like TablePlus. 


## What is Knex?

When we move the data of our server application out of the server's memory and into a database, we need some way of having our server application communicate with the database. That's where Knex comes in.

**Knex** is a library that allows a Node project to connect to a database and execute SQL queries to retrieve data from (or modify the data in) the database.

![client server and database diagram](./img/client-server-database-diagram.svg)

Assuming we already have a database, in order to use Knex in a server application, we must first provide all of the needed information to connect to the database. This will require us to 

1) Configure a connection with a `knexfile.js`
2) Create a `knex` object to connect to the database
3) Use the `knex` connection object to execute queries

## Configuring Knex

### 0) Installing modules

We will be using the `knex` and the `pg` modules from NPM:

```sh
npm i knex pg 
```

### 1) Configuring a Connection: `knexfile.js`

Now that we have a database to play with, we need to tell our application how to connect to it. 

Run the command `npx knex init` which will generate a `knexfile.js` file in the root of your project directory. The `knexfile.js` holds configuration data for connecting to a database.

> ⚠️ NOTE: The `knexfile.js` file MUST be located in the root of your project. Otherwise, other `knex` configurations won't know where to find it.

 The exported object contains configuration objects that can be used for various **deployment environments**.

```js
// knexfile.js
module.exports = {
  development: {},  // Work in progress. Only on your computer
  staging: {},      // "Fake" production, fake data, fake users, test integrations
  production: {},   // Full production - real users
}
```

For now, we'll be working in the `development` environment and can ignore the other environment configurations.

Each deployment environment needs a `client` that specifies the kind of database we're connecting to (we will use `pg` which is short for Postgres). The `connection` object is where we provide the username, password, and specific database we want to connect to.

```js
  development: {
    client: 'pg',
    connection: {
      user: 'username',
      password: 'password'
      database: 'db_name',
    }
  },
```

### 2) Create a `knex` object to connect to the database

To connect to the database specified by the `knexfile.js`, we need to create a `knex` object. 


```js
// src/db/knex.js
const env = 'development';
const knexConfig = require('./knexfile.js')[env];
const knex = require('knex')(knexConfig);

module.exports = knex;
```
* The `knexfile.js` file exports an object with configurations for various deployment environments. We want the `development` configuration.
* The `knex` Node module exports a function to create a `knex` object. It takes in our `knexConfig` as an argument.
* The `knex` object is our connection to the database specified in `knexfile.js`. We can export it so that other files can use the `knex` connection object.

### 3) Use the `knex` connection object to execute queries

We can play with our `knex` connection directly in our `index.js` file. 

> 💡 NOTE: In future projects, only our `models` will interact with `knex`.

The `knex` connection object has an _asynchronous_ method called `raw` that takes in SQL statements and returns a `result` object.

```js
// index.js
const knex = require('./db/knex.js');

const getPets = async () => {
  // knex.raw returns a query result object
  let result = await knex.raw("SELECT * FROM pets");
  
  // .rows is an array containing the query data
  return result.rows;
};

const getPeople = async () => {
  // often, we just destructure the rows and return
  let { rows } = await knex.raw("SELECT * FROM pets");
  return rows;
};

const main = async () => {
    const pets = await getPets()
    const people = await getPeople();

    knex.destroy(); // destroy the connection before ending the program.
};

main();
```

* Most of the time, we'll use the `.rows` property to get the results as an array.

## Writing queries using `knex.raw`

### Multi-Line Queries

```js
// Use `` to create multi-line strings
const getPeople = async () => {
  const query = `
    SELECT * 
    FROM people;
  `
  const { rows } = await knex.raw(query);
  return rows;
};
```

### Dynamic Queries

Consider the `pets` table below. 

| id  | name       | species | owner_id |
| --- | ---------- | ------- | -------- |
| 1   | Khalo      | dog     | 3        |
| 2   | Juan Pablo | dog     | 2        |
| 3   | Bora       | bird    | 1        |
| 4   | Tora       | dog     | 1        |
| 5   | Frida      | cat     | 3        |
| 6   | Pon Juablo | cat     | 2        |
| 7   | Kora       | dog     | 1        |

**Q: What is the SQL query to find the dogs owned by the Ann Duong?**

<details><summary>Answer</summary>

```sql
SELECT pets.name, pets.id
FROM pets
  JOIN people ON pets.owner_id = people.id
WHERE people.name='Ann Duong' AND pets.type='dog'
```

</details><br>

Let's make a function that can show us the pets of ANY given `type` owned by ANY given `owner_id`?

Ex: `getPetsByOwnerIdAndSpecies(3, 'cat')`

We will need to create a **dynamic query** with `knex.raw`:
* insert `?` as a placeholder for a dynamic piece of data.
* pass an array of values as a second argument to the `knex.raw` function containing the dynamic values to be used. 

```js
const getPetsByOwnerNameAndType = async (ownerName, type) => {
  const query = `
    SELECT pets.name, pets.id
    FROM pets
      JOIN people ON pets.owner_id = people.id
    WHERE people.name=? AND pets.type=?
  `
  const { rows } = await knex.raw(query, [ownerName, type]);
  console.log(rows);
  return rows;
}
```

In this query, the first `?` will be replaced by the value of the `ownerName` parameter, and the second `?` will be replaced by the value of the `species` parameter.

### Create, Update, and Delete

So far, we've read from the database, let's create, update, and delete using `knex.raw`.

**Create a pet:**

```js
const createPet = async(name, species, ownerId) => {
  let result = await knex.raw(`
    INSERT INTO pets (name, species, owner_id)
    VALUES (?, ?, ?)
    RETURNING *
  `, [name, species, ownerId]);

  console.log(result.rows[0]);
};
```

* `RETURNING *` returns the created record. Without this, `result.rows` will be an empty array.
* `result.rows[0]` will the one created value.

**Update a pet's name:**

```js
const updatePetNameByName = async(oldName, newName) => {
  let result = await knex.raw(`
    UPDATE pets
    SET name=?
    WHERE name=?
    RETURNING *
  `, [newName, oldName]);

  console.log(result.rows[0]);
}
```

**Delete a pet:**

```js
const deletePetByName = async(name) => {
  let result = await knex.raw(`
    DELETE FROM pets
    WHERE name=?
    RETURNING *
  `, [name]);

  console.log(result.rows[0]);
};
```

## Challenges

Level 1: `pets` and `people`
* get one pet by pet id
* get one person by person id
* get pets owned by a person by owner_id
* get pets owned by a person by the owner's first and last name
* create a new pet
* delete a pet
* update an owner's name

Level 2: `customers`, `products`, and `orders`
* get all the orders the belong to certain customer.
* get all the products that a certain customer has ever bought.
* get the top 3 most recent orders.
* get the cheapest product.
* get all the customers that have ever bought a certain product.
* create a new order
* delete an order
* update an order

Level 3: `authors`, `books`, and `author_book`
* get all the books that a certain author has ever written.
* get all the authors of a certain book.
* create a new book, by a provided author (make sure to connect them!)
* update the title of a book
* delete a book (make sure to remove the associated connection as well)

