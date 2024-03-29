const { db } = require('@vercel/postgres');
const {
  demoUser,
  invoices,
  customers,
  revenue,
  users,
  games, 
  bots, 
  humanIds
} = require('../app/lib/demo-user-data.js');
const bcrypt = require('bcrypt');


async function dropTables(client) {
    try {
      console.log(`Dropping all tables...`);
      await client.query('DROP TABLE IF EXISTS users, games, customers, invoices, revenue, friendships, bots CASCADE;');
      console.log('Dropped all tables');
    } catch (error) {
      console.error('Error dropping tables:', error);
      throw error;
    }
}


async function seedUsers(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Create the "users" table if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        image_url TEXT NULL
      );
    `;

    console.log(`Created "users" table`);

    // Insert data into the "users" table
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.sql`
        INSERT INTO users (id, name, email, image_url, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${user.image_url}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
      }),
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return {
      createTable,
      users: insertedUsers,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}


async function seedGames(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create the "games" table if it doesn't exist
    const createTable = await client.sql`
    CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    white_player_id UUID NOT NULL,
    black_player_id UUID NOT NULL,
    move_history TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(255) NOT NULL CHECK (status IN ('white-win', 'black-win', 'draw', 'underway')),
    fen VARCHAR(255) NOT NULL
  );
`;

    console.log(`Created "games" table`);

    // Insert data into the "games" table
    const insertedGames = await Promise.all(
      games.map(
        (game) => client.sql`
        INSERT INTO games (white_player_id, black_player_id, move_history, created_at, updated_at, status, fen)
        VALUES (${game.white_player_id}, ${game.black_player_id}, ${game.move_history}, 
          ${game.created_at}, ${game.updated_at}, ${game.status}, ${game.fen})
        ON CONFLICT (id) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedGames.length} games`);

    return {
      createTable,
      games: insertedGames,
    };
  } catch (error) {
    console.error('Error seeding games:', error);
    throw error;
  }
}

async function seedFriendships(client) {
  
  const demoUserId = demoUser.id;
  let friendUserIds = [];
  while (friendUserIds.length < 5) {
    const randomIndex = Math.floor(Math.random() * humanIds.length);
    const candidateId = humanIds[randomIndex];
    if (!friendUserIds.includes(candidateId)) {
      friendUserIds.push(candidateId);
    }
  }


  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create the "games" table if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS friendships (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user1 UUID NOT NULL,
        user2 UUID NOT NULL,
        CONSTRAINT fk_user1 FOREIGN KEY (user1) REFERENCES users(id),
        CONSTRAINT fk_user2 FOREIGN KEY (user2) REFERENCES users(id),
        CONSTRAINT unique_friendship UNIQUE (user1, user2)
      );
    `;

    console.log(`Created "friendships" table`);


    const insertedFriendships = await Promise.all(
      friendUserIds.map(userId => {
        return client.sql`
          INSERT INTO friendships (user1, user2)
          VALUES (${demoUserId}, ${userId})
          ON CONFLICT (user1, user2) DO NOTHING;
        `;
      })
    );

    console.log(`Seeded ${insertedFriendships.length} friendships`);

    return {
      createTable,
      friendships: insertedFriendships,
    };
  } catch (error) {
    console.error('Error seeding friendships:', error);
    throw error;
  }
}





async function seedBots(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Create the "bots" table if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS bots (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL UNIQUE
      );
    `;

    console.log(`Created "bots" table`);

    // Insert data into the "users" table
    const insertedBots = await Promise.all(
      bots.map(async (bot) => {
        return client.sql`
        INSERT INTO bots (id, name, description)
        VALUES (${bot.id}, ${bot.name}, ${bot.description})
        ON CONFLICT (id) DO NOTHING;
      `;
      }),
    );

    console.log(`Seeded ${insertedBots.length} bots`);

    return {
      createTable,
      bots: insertedBots,
    };
  } catch (error) {
    console.error('Error seeding bots:', error);
    throw error;
  }
}






async function seedInvoices(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create the "invoices" table if it doesn't exist
    const createTable = await client.sql`
    CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    date DATE NOT NULL
  );
`;

    console.log(`Created "invoices" table`);

    // Insert data into the "invoices" table
    const insertedInvoices = await Promise.all(
      invoices.map(
        (invoice) => client.sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);

    return {
      createTable,
      invoices: insertedInvoices,
    };
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create the "customers" table if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `;

    console.log(`Created "customers" table`);

    // Insert data into the "customers" table
    const insertedCustomers = await Promise.all(
      customers.map(
        (customer) => client.sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return {
      createTable,
      customers: insertedCustomers,
    };
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue(client) {
  try {
    // Create the "revenue" table if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;

    console.log(`Created "revenue" table`);

    // Insert data into the "revenue" table
    const insertedRevenue = await Promise.all(
      revenue.map(
        (rev) => client.sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return {
      createTable,
      revenue: insertedRevenue,
    };
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await dropTables(client);
  await seedUsers(client);
  await seedGames(client);
  await seedCustomers(client);
  await seedInvoices(client);
  await seedRevenue(client);
  await seedFriendships(client);
  await seedBots(client);

  await client.end();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
