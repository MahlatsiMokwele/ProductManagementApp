-- 01_schema.sql
-- Creates tables for products, categories, and users.
-- Run automatically by docker-compose on first container start.

-- ============================================================
-- pgcrypto gives us gen_random_uuid() for default GUID values.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Categories
-- Self-referential parent_category_id allows a tree of any depth.
-- A NULL parent means the category is a root.
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255)    NOT NULL,
    description         VARCHAR(255)    NULL,
    parent_category_id  UUID            NULL REFERENCES categories(id) ON DELETE SET NULL,
    audit_user_id       UUID            NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);

-- ============================================================
-- Products
-- SKU is unique. category_id is optional (a product can be uncategorised).
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)    NOT NULL,
    description     VARCHAR(255)    NULL,
    sku             VARCHAR(50)     NOT NULL UNIQUE,
    price           NUMERIC(18, 2)  NOT NULL CHECK (price >= 0),
    quantity        INT             NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    category_id     UUID            NULL REFERENCES categories(id) ON DELETE SET NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    audit_user_id   UUID            NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products(LOWER(name));

-- ============================================================
-- Users
-- 'role' is constrained to 'admin' or 'employee'. The C# layer also enforces this,
-- but a CHECK constraint keeps bad data out at the DB level.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_details (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100)    NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    surname         VARCHAR(100)    NOT NULL,
    role            VARCHAR(20)     NOT NULL CHECK (role IN ('admin', 'employee')),
    password_hash   VARCHAR(255)    NOT NULL,
    audit_user_id   UUID            NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON user_details(LOWER(username));
