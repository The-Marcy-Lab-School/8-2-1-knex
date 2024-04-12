# Knex

TablePlus and `psql` in our terminal are great for testing out SQL statements, but they can only take us so far since we have to manually run the SQL statements ourselves. 

In this lesson, we will learn [Knex](https://knexjs.org/), a library that allows a Node project to connect to a databases and execute SQL queries. This will enable our server applications to access data from a Postgres database and have a persistent data layer.

**Table of Contents**

- [Terms](#terms)
- [Getting Started: Setting up a Database](#getting-started-setting-up-a-database)
- [What is Knex?](#what-is-knex)
- [Configuring Knex](#configuring-knex)
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

Follow along by running `npm i knex pg` to install Knex and the `pg` (Postgres) modules.

Take a look at the `db.sql` file. It contains the SQL commands to create and populate a database called `playground`. This database will have five tables: `people`, `pets`, `customers`, `orders`, `products`.

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

Assuming we already have a database, in order to use Knex in a server application, we must first provide all of the needed information to connect to the database.

## Configuring Knex


### 1) Configuring a Connection: `knexfile.js`

Now that we have a database to play with, we need to tell our application how to connect to it. 

Run the command `npx knex init` which will generate a `knexfile.js` file in the root of your project directory.

> ⚠️ NOTE: The `knexfile.js` file MUST be located in the root of your project. Otherwise, other `knex` configurations won't know where to find it.

The `knexfile.js` holds configuration data for connecting to a database. It exports configuration objects that can be used for various **deployment environments**.

```js
// knexfile.js
module.exports = {
  development: {},  // Work in progress. Only on your computer
  staging: {},      // "Fake" production, fake data, fake users, test integrations
  production: {},   // Full production - real users
}
```

Each deployment environment needs a `client` and a `connection`. For now, we'll be working in the `development` environment and can ignore the other environment configurations.

```js
  development: {
    client: 'pg',
    connection: {
      database: 'db_name',
      user: 'username',
      password: 'password'
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

The `knex` connection object has an _asynchronous_ method called `raw` that takes in SQL statements and returns a `query` object.

```js
// index.js
const knex = require('./db/knex.js');

const getPets = async () => {
    let query = await knex.raw("SELECT * FROM pets");
    console.log(query);
};

const main = async () => {
    await getPets() // Test to see if knex is configured correctly to connect to your database

    knex.destroy(); // destroy the connection before ending the program.
};

main();
```

* Most of the time, we'll use the `query.rows` property to get the results as an array.

## Writing queries using `knex.raw`

### Multi-Line Queries

```js
// Use `` to create multi-line strings
const getPeople = async () => {
    let query = await knex.raw(`
      SELECT * 
      FROM people;
    `);
    console.log(query.rows);
};
```

### Dynamic Queries

Consider the `pets` table below. 

**Q: What is the SQL query to find the cats owned by the owner with id 3?**

<details><summary>Answer</summary>

> ```sql
> SELECT *
> FROM pets
> WHERE owner_id=3 AND species='cat'
> ```

</details>

| id  | name       | species | owner_id |
| --- | ---------- | ------- | -------- |
| 1   | Khalo      | dog     | 3        |
| 2   | Juan Pablo | dog     | 2        |
| 3   | Bora       | bird    | 1        |
| 4   | Tora       | dog     | 1        |
| 5   | Frida      | cat     | 3        |
| 6   | Pon Juablo | cat     | 2        |
| 7   | Kora       | cat     | 1        |

How can we make a function that can show us the pets of ANY given `species` owned by ANY given `owner_id`?

Ex: `getPetsByOwnerIdAndSpecies(3, 'cat')`

We will need to create a **dynamic query** with `knex.raw`:
* insert `?` as a placeholder for a dynamic piece of data.
* pass an array of values as a second argument to the `knex.raw` function containing the dynamic values to be used. 

```js
const getPetsByOwnerIdAndSpecies = async(ownerId, species) => {
  let query = await knex.raw(`
    SELECT *
    FROM pets
    WHERE owner_id=? AND species=?
  `, [ownerId, species]);

  console.log(query.rows);
}
```

In this query, the first `?` will be replaced by the value of the `ownerId` parameter, and the second `?` will be replaced by the value of the `species` parameter.

### Create, Update, and Delete

So far, we've read from the database, let's create, update, and delete using `knex.raw`.

**Create a pet:**

```js
const createPet = async(name, species, ownerId) => {
  let query = await knex.raw(`
    INSERT INTO pets (name, species, owner_id)
    VALUES (?, ?, ?)
    RETURNING *
  `, [name, species, ownerId]);

  console.log(query.rows[0]);
};
```

* `RETURNING *` returns the created record. Without this, `query.rows` will be an empty array.
* `query.rows[0]` will the one created value.

**Update a pet's name:**

```js
const updatePetNameByName = async(oldName, newName) => {
  let query = await knex.raw(`
    UPDATE pets
    SET name=?
    WHERE name=?
    RETURNING *
  `, [newName, oldName]);

  console.log(query.rows[0]);
}
```

**Delete a pet:**

```js
const deletePetByName = async(name) => {
  let query = await knex.raw(`
    DELETE FROM pets
    WHERE name=?
    RETURNING *
  `, [name]);

  console.log(query.rows[0]);
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

