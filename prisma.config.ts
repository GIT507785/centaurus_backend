import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "Prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});