import { NextResponse } from "next/server";
import pool from "@/app/lib/mysql";
import {
    CustomerField,
    CustomersTableType,
    InvoiceForm,
    InvoicesTable,
    LatestInvoiceRaw,
    Revenue,
  } from './definitions';
  import { formatCurrency } from './utils';

  export async function fetchRevenue() {
    try {
      const db = await pool.getConnection();

      console.log('Fetching revenue data...');
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const query = 'SELECT * FROM revenue'
      const [data] = await db.execute(query)
      db.release();

      console.log('Data fetch completed after 3 seconds.');

      return data;
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch revenue data.');
    }
  }

  export async function fetchLatestInvoices() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const db = await pool.getConnection();
      const [data] = await db.execute(`
        SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
        FROM invoices
        JOIN customers ON invoices.customer_id = customers.id
        ORDER BY invoices.date DESC
        LIMIT 5`);
      db.release();

      const latestInvoices = data.map((invoice) => ({
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
    try {
      // You can probably combine these into a single SQL query
      // However, we are intentionally splitting them to demonstrate
      // how to initialize multiple queries in parallel with JS.
      /* const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
      const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
      const invoiceStatusPromise = sql`SELECT
           SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
           SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
           FROM invoices`;
  
      const data = await Promise.all([
        invoiceCountPromise,
        customerCountPromise,
        invoiceStatusPromise,
      ]); */
  
      const numberOfInvoices = Number(20 ?? '0');
      const numberOfCustomers = Number(1 ?? '0');
      const totalPaidInvoices = formatCurrency(1000 ?? '0');
      const totalPendingInvoices = formatCurrency(2 ?? '0');
  
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

const ITEMS_PER_PAGE = 5;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const db = await pool.getConnection();
    const [data] = await db.execute(`
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
        customers.name LIKE ${`'%${query}%'`} OR
        customers.email LIKE ${`'%${query}%'`} OR
        invoices.amount LIKE ${`'%${query}%'`} OR
        invoices.date LIKE ${`'%${query}%'`} OR
        invoices.status LIKE ${`'%${query}%'`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `);
    db.release();

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const db = await pool.getConnection();
    const [data] = await db.execute(`SELECT COUNT(*) AS count
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name LIKE ${`'%${query}%'`} OR
        customers.email LIKE ${`'%${query}%'`} OR
        invoices.amount LIKE ${`'%${query}%'`} OR
        invoices.date LIKE ${`'%${query}%'`} OR
        invoices.status LIKE ${`'%${query}%'`}
    `);
    db.release();

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    //const totalPages = 1;
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchCustomers() {
  try {
    const db = await pool.getConnection();
    const [customers] = await db.execute(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `);
    db.release();

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchInvoiceById(id: string) {

  try {
    const db = await pool.getConnection();
    const [data] = await db.execute(`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `);
    db.release();

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}