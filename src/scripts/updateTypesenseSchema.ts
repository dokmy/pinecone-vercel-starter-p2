import type { Client as TypesenseClient } from 'typesense';

const { Client } = require("typesense");
const dotenv = require("dotenv");

dotenv.config();

const typesense = new Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: parseInt(process.env.TYPESENSE_PORT || "443"),
      protocol: process.env.TYPESENSE_PROTOCOL || "https",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 2,
}) as TypesenseClient;

const schema = {
  name: "2024-hkexnews",
  fields: [
    {
      name: "chunk_text",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "FILE_INFO",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "NEWS_ID",
      type: "string" as const,
      facet: true,
      optional: false,
    },
    {
      name: "SHORT_TEXT",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "TOTAL_COUNT",
      type: "int32" as const,
      facet: false,
      optional: false,
      sort: true,
    },
    {
      name: "DOD_WEB_PATH",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "STOCK_NAME",
      type: "string" as const,
      facet: true,
      optional: false,
    },
    {
      name: "TITLE",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "FILE_TYPE",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "DATE_TIME",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "LONG_TEXT",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "STOCK_CODE",
      type: "string" as const,
      facet: true,
      optional: false,
    },
    {
      name: "FILE_LINK",
      type: "string" as const,
      facet: false,
      optional: false,
    },
    {
      name: "unix_timestamp",
      type: "int64" as const,
      facet: false,
      optional: false,
      sort: true,
    },
    {
      name: "t1_code",
      type: "string" as const,
      facet: false,
      optional: false,
    },
  ],
};

async function updateSchema() {
  try {
    // 1. Drop existing collection
    console.log("Dropping existing collection...");
    try {
      await typesense.collections("2024-hkexnews").delete();
    } catch (error) {
      console.log("Collection doesn't exist, proceeding with creation");
    }

    // 2. Create new collection with updated schema
    console.log("Creating new collection with updated schema...");
    await typesense.collections().create(schema);
    console.log("Schema updated successfully!");

    // 3. You'll need to reindex your data here
    console.log("Please run your data indexing script now.");

  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

updateSchema(); 