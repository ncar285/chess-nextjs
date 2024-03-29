import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache'; 

import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  GamesTable,
  Bot,
  Game,
  GameMonth,
} from './definitions';
import { formatCurrency } from './utils';
import { auth } from '@/auth';
// import { auth, signIn, signOut } from '@/app/api/auth/[...nextauth]'

export async function fetchMonthlyGames() {
  noStore();

  const user = await fetchCurrentUser();
  const userId = user.id;

  try {
    const data = await sql<GameMonth>`
    SELECT
      EXTRACT(YEAR FROM g.created_at) AS year,
      TO_CHAR(g.created_at, 'Mon') AS month,
      COUNT(*) AS games_played
    FROM
      games g
    WHERE
      g.status != 'underway'
      AND (g.white_player_id = ${userId} OR g.black_player_id = ${userId})
    GROUP BY
      EXTRACT(YEAR FROM g.created_at),
      TO_CHAR(g.created_at, 'Mon'),
      EXTRACT(MONTH FROM g.created_at) 
    ORDER BY
      year,
      EXTRACT(MONTH FROM g.created_at);
    `;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}



export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).

  noStore();

  try {
    const data = await sql<Revenue>`SELECT * FROM revenue`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}


export async function fetchBots(){
  noStore();

  try {
    const data = await sql<Bot>`SELECT * FROM bots`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch bot data.');
  }
}


export async function fetchFriends() {
  noStore();

  const user = await fetchCurrentUser();
  const userId = user.id;

  try {
    const friendships = await sql`
      SELECT
        users.id,
        users.name,
        users.image_url
      FROM
        friendships
      JOIN
        users ON users.id = friendships.user2
      WHERE
        friendships.user1 = ${userId}
      UNION
      SELECT
        users.id,
        users.name,
        users.image_url
      FROM
        friendships
      JOIN
        users ON users.id = friendships.user1
      WHERE
        friendships.user2 = ${userId};
    `;

    return friendships.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch friends.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchChessCardData() {
  noStore();
  try {
    const user = await fetchCurrentUser();
    const userId = user.id;

    console.log("user ID: ",userId)

    const totalGameCountPromise = sql`
    SELECT COUNT(*) FROM games as g 
    WHERE 
    (g.white_player_id = ${userId} OR g.black_player_id = ${userId})
    AND (g.status != 'underway')`

    const gamesWonCountPromise = sql`
    SELECT COUNT(*) FROM games AS g 
    WHERE (g.white_player_id = ${userId} AND g.status = 'white-win') 
    OR (g.black_player_id = ${userId} AND g.status = 'black-win');`

    const gamesLostCountPromise = sql`
    SELECT COUNT(*) FROM games AS g 
    WHERE (g.white_player_id = ${userId} AND g.status = 'black-win') 
    OR (g.black_player_id = ${userId} AND g.status = 'white-win');`

    const friendshipsCountPromise = sql`
    SELECT COUNT(*) FROM friendships AS f
    WHERE (f.user1 = ${userId}) 
    OR (f.user2 = ${userId});`

    const data = await Promise.all([
      totalGameCountPromise,
      gamesWonCountPromise,
      gamesLostCountPromise,
      friendshipsCountPromise,
    ]);

    const numberOfGames = Number(data[0].rows[0].count ?? '0');
    const numberOfGamesWon = Number(data[1].rows[0].count ?? '0');
    const numberOfGamesLost = Number(data[2].rows[0].count ?? '0');
    const numberOfFriends = Number(data[3].rows[0].count ?? '0');

    return {
      numberOfGames,
      numberOfGamesWon,
      numberOfGamesLost,
      numberOfFriends,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch chess card data.');
  }
}

const GAMES_PER_PAGE = 5;

export async function fetchFilteredGames(
  query: string,
  currentPage: number,
){
  noStore();
  const offset = (currentPage - 1) * GAMES_PER_PAGE;

  const user = await fetchCurrentUser();
  const userId = user.id;


  // should be ordering by name!!!

  try {
    const games = await sql<GamesTable>`
    SELECT
      g.id,
      g.created_at,
      CASE
      WHEN g.status = 'white-win' AND g.white_player_id = ${userId} THEN 'win'
      WHEN g.status = 'black-win' AND g.black_player_id = ${userId} THEN 'win'
      WHEN g.status = 'white-win' AND g.black_player_id = ${userId} THEN 'loss'
      WHEN g.status = 'black-win' AND g.white_player_id = ${userId} THEN 'loss'
      WHEN g.status = 'draw' THEN 'draw'
      END AS result,
      g.fen,
      CASE
      WHEN g.white_player_id = ${userId} THEN black_player.name
      ELSE white_player.name
      END AS opponent_name,
      CASE
      WHEN g.white_player_id = ${userId} THEN black_player.id
      ELSE white_player.id
      END AS opponent_id,
      EXTRACT(EPOCH FROM (g.updated_at - g.created_at)) / 60 AS duration,
      g.move_history AS moves
    FROM
      games g
      JOIN users AS white_player ON g.white_player_id = white_player.id
      JOIN users AS black_player ON g.black_player_id = black_player.id
      WHERE
      g.status != 'underway'
      AND
      (g.white_player_id = ${userId} OR g.black_player_id = ${userId})
      AND (
        (g.white_player_id = ${userId} AND black_player.name ILIKE ${`%${query}%`}) 
        OR
        (g.black_player_id = ${userId} AND white_player.name ILIKE ${`%${query}%`})
      )
      ORDER BY
        CASE 
          WHEN g.white_player_id = ${userId} THEN POSITION(lower(${`%${query}%`}) IN lower(black_player.name))
          ELSE POSITION(lower(${`%${query}%`}) IN lower(white_player.name))
        END,
        created_at DESC
      LIMIT ${GAMES_PER_PAGE} OFFSET ${offset};
      `;

    return games.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch games.');
  }
}

// order by substring position:
  // ORDER BY
  //   CASE 
  //     WHEN g.white_player_id = ${userId} THEN POSITION(lower(${`%${query}%`}) IN lower(black_player.name))
  //     ELSE POSITION(lower(${`%${query}%`}) IN lower(white_player.name))
  //   END,
  //   created_at DESC

// order by substring length
  // ORDER BY
  //   CASE 
  //     WHEN g.white_player_id = ${userId} THEN LENGTH(REPLACE(lower(black_player.name), lower(${`%${query}%`}), ''))
  //     ELSE LENGTH(REPLACE(lower(white_player.name), lower(${`%${query}%`}), ''))
  //   END,
  //   created_at DESC

// order by similarity score
// ORDER BY
//   CASE 
//     WHEN g.white_player_id = ${userId} THEN SIMILARITY(black_player.name, ${`%${query}%`})
//     ELSE SIMILARITY(white_player.name, ${`%${query}%`})
//   END DESC,
//   created_at DESC

// WHERE
//   (g.status != 'underway')
//   AND (
//     (g.white_player_id = ${userId} AND black_player.name ILIKE ${`%${query}%`})
//     OR
//     (g.black_player_id = ${userId} AND white_player.name ILIKE ${`%${query}%`})
//   )

// old query:
// WHERE
// (g.white_player_id = ${userId} OR g.black_player_id = ${userId})
// AND g.status != 'underway'
// AND (
//   black_player.name ILIKE ${`%${query}%`} OR 
//   white_player.name ILIKE ${`%${query}%`} OR 
//   (TO_CHAR(g.created_at, 'Dy') || ' ' || 
//   TO_CHAR(g.created_at, 'Mon') || ' ' || 
//   TO_CHAR(g.created_at, 'DD') || ' ' || 
//   TO_CHAR(g.created_at, 'YYYY')) ILIKE ${`%${query}%`}
// )



export async function fetchGamesPages(query: string) {
  try {
    noStore();

    const user = await fetchCurrentUser();
    const userId = user.id;

    const count = await sql`
    SELECT COUNT(*)
    FROM
      games g
      JOIN users AS white_player ON g.white_player_id = white_player.id
      JOIN users AS black_player ON g.black_player_id = black_player.id
    WHERE
      (g.white_player_id = ${userId} OR g.black_player_id = ${userId})
      AND g.status != 'underway'
      AND (
        black_player.name ILIKE ${`%${query}%`} OR 
        white_player.name ILIKE ${`%${query}%`} OR 
        (TO_CHAR(g.created_at, 'Dy') || ' ' || 
        TO_CHAR(g.created_at, 'Mon') || ' ' || 
        TO_CHAR(g.created_at, 'DD') || ' ' || 
        TO_CHAR(g.created_at, 'YYYY')) ILIKE ${`%${query}%`}
      );
    `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / GAMES_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}


const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    noStore();
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchGameById(id: string): Promise<Game | null> {
  noStore();
  try {
    const data = await sql`
      SELECT *
      FROM games
      WHERE games.id = ${id};
    `;

    if (data.rows.length > 0) {
      const gameRow = data.rows[0];
      const game: Game = {
        id,
        white_player_id: gameRow.white_player_id,
        black_player_id: gameRow.black_player_id,
        status: gameRow.status,
        fen: gameRow.fen,
        move_history: JSON.parse(gameRow.move_history),
        created_at: new Date(gameRow.created_at),
        updated_at: new Date(gameRow.updated_at),
      };

      // console.log("fetched game: ", game)
      return game;
    } else {
      return null;
    }

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to games.');
  }
}




export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    console.log(invoice); // Invoice is an empty array []
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function getUserById(id: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE id=${id}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function fetchBotById(id: string) {
  try {
    const bot = await sql`SELECT * FROM bots WHERE id=${id}`;
    return bot.rows[0] as Bot;
  } catch (error) {
    console.error('Failed to fetch bot:', error);
    throw new Error('Failed to fetch bot.');
  }
}


export async function fetchCurrentUser() {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    throw new Error('There is no active user session');
  }
  const user = await getUser(session.user.email);
  if (!user) {
    throw new Error('User not found');
  }
  return user
}



export async function fetchUserGameInfo(game: Game) {
  try {
    const user = await fetchCurrentUser();
    // debugger
    const type = user.email === 'user@nextmail.com' ? 'demo-user' : 'human';
    const userColor = user.id === game.white_player_id ? "white" : "black";
    return {
      user,
      type: type as "human" | "demo-user",
      color: userColor as "white" | "black"
    }
  } catch (error) {
    console.error('Failed to fetch full user information', error);
    throw new Error('Failed to fetch full user information.');
  }
}


export async function fetchOpponentGameInfo(game: Game, userId: string):Promise<{opponent: Bot | User; type: "human" | "bot"; color: "white" | "black"}> {
  try {
    const opponentId = userId === game.white_player_id ? game.black_player_id : game.white_player_id;
    const opponentColor = opponentId === game.white_player_id ? "white" : "black";


    // console.log("opponentColor", opponentColor)

    const type = await fetchOpponentType(opponentId)

    let opponent: Bot | User;
    if (type === "bot") {
      opponent = await fetchBotById(opponentId);
    } else {
      opponent = await getUserById(opponentId);
    }

    // console.log("opponent", opponent)

    return {
      opponent,
      type,
      color: opponentColor 
    }

  } catch (error) {
    console.error('Failed to fetch full opponent information', error);
    throw new Error('Failed to fetch full opponent information.');
  }
}


export async function fetchOpponentType(id: string): Promise<"human" | "bot"> {
  try {
    const [botResult, userResult] = await Promise.all([
      sql`SELECT * FROM bots WHERE id=${id}`,
      sql`SELECT * FROM users WHERE id=${id}`
    ]);
    if (botResult.rows.length > 0 && userResult.rows.length === 0) {
      return "bot";
    } else if (userResult.rows.length > 0 && botResult.rows.length === 0) {
      return "human";
    } else {
      throw new Error('Failed to determine user type.');
    }
  } catch (error) {
    console.error('Failed to determine user type', error);
    throw new Error('Failed to determine user type.');
  }
}