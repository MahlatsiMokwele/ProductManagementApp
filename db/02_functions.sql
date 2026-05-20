-- 02_functions.sql
-- Stored functions called by the C# repositories via Npgsql.
-- Functions can RETURN TABLE - maps cleanly onto a DataReader in the C# layer.
-- Naming convention: sp_<verb>_<entity>(...).
-- All functions are intentionally thin: validation lives in the C# layer.

-- ============================================================================
-- PRODUCTS
-- ============================================================================

-- Paginated, optionally filtered list of products.
-- p_search is matched against name (case-insensitive, substring).
-- p_category_id NULL = no category filter.
CREATE OR REPLACE FUNCTION sp_get_products(
    p_page          INT,
    p_size          INT,
    p_category_id   UUID,
    p_search        VARCHAR
)
RETURNS TABLE (
    id              UUID,
    name            VARCHAR,
    description     VARCHAR,
    sku             VARCHAR,
    price           NUMERIC,
    quantity        INT,
    category_id     UUID,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    audit_user_id   UUID,
    total_count     BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset INT := GREATEST(p_page - 1, 0) * GREATEST(p_size, 1);
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT p.*
        FROM products p
        WHERE (p_category_id IS NULL OR p.category_id = p_category_id)
          AND (p_search IS NULL OR p_search = '' OR LOWER(p.name) LIKE '%' || LOWER(p_search) || '%')
    ),
    counted AS (
        SELECT COUNT(*)::BIGINT AS total FROM filtered
    )
    SELECT  f.id, f.name, f.description, f.sku, f.price, f.quantity,
            f.category_id, f.created_at, f.updated_at, f.audit_user_id,
            c.total
    FROM filtered f
    CROSS JOIN counted c
    ORDER BY f.created_at DESC
    LIMIT GREATEST(p_size, 1)
    OFFSET v_offset;
END;
$$;

-- Single product by id.
CREATE OR REPLACE FUNCTION sp_get_product_by_id(p_id UUID)
RETURNS TABLE (
    id              UUID,
    name            VARCHAR,
    description     VARCHAR,
    sku             VARCHAR,
    price           NUMERIC,
    quantity        INT,
    category_id     UUID,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    audit_user_id   UUID
)
LANGUAGE sql
AS $$
    SELECT id, name, description, sku, price, quantity, category_id,
           created_at, updated_at, audit_user_id
    FROM products
    WHERE id = p_id;
$$;

-- Insert and return the new row.
CREATE OR REPLACE FUNCTION sp_insert_product(
    p_name          VARCHAR,
    p_description   VARCHAR,
    p_sku           VARCHAR,
    p_price         NUMERIC,
    p_quantity      INT,
    p_category_id   UUID,
    p_audit_user_id UUID
)
RETURNS TABLE (
    id              UUID,
    name            VARCHAR,
    description     VARCHAR,
    sku             VARCHAR,
    price           NUMERIC,
    quantity        INT,
    category_id     UUID,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    audit_user_id   UUID
)
LANGUAGE sql
AS $$
    INSERT INTO products (name, description, sku, price, quantity, category_id, audit_user_id)
    VALUES (p_name, p_description, p_sku, p_price, p_quantity, p_category_id, p_audit_user_id)
    RETURNING id, name, description, sku, price, quantity, category_id,
              created_at, updated_at, audit_user_id;
$$;

-- Update and return the updated row. Returns 0 rows if id not found.
CREATE OR REPLACE FUNCTION sp_update_product(
    p_id            UUID,
    p_name          VARCHAR,
    p_description   VARCHAR,
    p_sku           VARCHAR,
    p_price         NUMERIC,
    p_quantity      INT,
    p_category_id   UUID
)
RETURNS TABLE (
    id              UUID,
    name            VARCHAR,
    description     VARCHAR,
    sku             VARCHAR,
    price           NUMERIC,
    quantity        INT,
    category_id     UUID,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    audit_user_id   UUID
)
LANGUAGE sql
AS $$
    UPDATE products
       SET name        = p_name,
           description = p_description,
           sku         = p_sku,
           price       = p_price,
           quantity    = p_quantity,
           category_id = p_category_id,
           updated_at  = NOW()
     WHERE id = p_id
    RETURNING id, name, description, sku, price, quantity, category_id,
              created_at, updated_at, audit_user_id;
$$;

-- Delete by id. Returns the number of rows affected (0 or 1).
CREATE OR REPLACE FUNCTION sp_delete_product(p_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM products WHERE id = p_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE OR REPLACE FUNCTION sp_get_categories()
RETURNS TABLE (
    id                  UUID,
    name                VARCHAR,
    description         VARCHAR,
    parent_category_id  UUID,
    audit_user_id       UUID,
    created_at          TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT id, name, description, parent_category_id, audit_user_id, created_at
    FROM categories
    ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION sp_get_category_by_id(p_id UUID)
RETURNS TABLE (
    id                  UUID,
    name                VARCHAR,
    description         VARCHAR,
    parent_category_id  UUID,
    audit_user_id       UUID,
    created_at          TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT id, name, description, parent_category_id, audit_user_id, created_at
    FROM categories
    WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION sp_insert_category(
    p_name              VARCHAR,
    p_description       VARCHAR,
    p_parent_category_id UUID,
    p_audit_user_id     UUID
)
RETURNS TABLE (
    id                  UUID,
    name                VARCHAR,
    description         VARCHAR,
    parent_category_id  UUID,
    audit_user_id       UUID,
    created_at          TIMESTAMP
)
LANGUAGE sql
AS $$
    INSERT INTO categories (name, description, parent_category_id, audit_user_id)
    VALUES (p_name, p_description, p_parent_category_id, p_audit_user_id)
    RETURNING id, name, description, parent_category_id, audit_user_id, created_at;
$$;

-- Update name / description / parent. Returns the updated row.
-- Guards against direct self-parenting (a category can't be its own parent).
-- Deeper cycles (A -> B -> A) aren't checked here — would need a recursive walk.
-- Acceptable for the assignment; worth flagging in interview.
CREATE OR REPLACE FUNCTION sp_update_category(
    p_id                UUID,
    p_name              VARCHAR,
    p_description       VARCHAR,
    p_parent_category_id UUID
)
RETURNS TABLE (
    id                  UUID,
    name                VARCHAR,
    description         VARCHAR,
    parent_category_id  UUID,
    audit_user_id       UUID,
    created_at          TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_parent_category_id IS NOT NULL AND p_parent_category_id = p_id THEN
        RAISE EXCEPTION 'Category cannot be its own parent';
    END IF;

    RETURN QUERY
    UPDATE categories
       SET name               = p_name,
           description        = p_description,
           parent_category_id = p_parent_category_id
     WHERE categories.id = p_id
    RETURNING categories.id, categories.name, categories.description,
              categories.parent_category_id, categories.audit_user_id, categories.created_at;
END;
$$;

-- Delete. Returns the number of rows affected (0 if id not found, 1 otherwise).
-- ON DELETE SET NULL is set on both:
--   - products.category_id  -> deleted-category's products become uncategorised
--   - categories.parent_category_id  -> deleted-category's children become roots
-- So this is safe at the DB level; the UI just needs to warn the user.
CREATE OR REPLACE FUNCTION sp_delete_category(p_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM categories WHERE id = p_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================================================
-- USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION sp_get_user_by_username(p_username VARCHAR)
RETURNS TABLE (
    id              UUID,
    username        VARCHAR,
    name            VARCHAR,
    surname         VARCHAR,
    role            VARCHAR,
    password_hash   VARCHAR,
    audit_user_id   UUID,
    created_at      TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT id, username, name, surname, role, password_hash, audit_user_id, created_at
    FROM user_details
    WHERE LOWER(username) = LOWER(p_username);
$$;

CREATE OR REPLACE FUNCTION sp_insert_user(
    p_username      VARCHAR,
    p_name          VARCHAR,
    p_surname       VARCHAR,
    p_role          VARCHAR,
    p_password_hash VARCHAR,
    p_audit_user_id UUID
)
RETURNS TABLE (
    id              UUID,
    username        VARCHAR,
    name            VARCHAR,
    surname         VARCHAR,
    role            VARCHAR,
    password_hash   VARCHAR,
    audit_user_id   UUID,
    created_at      TIMESTAMP
)
LANGUAGE sql
AS $$
    INSERT INTO user_details (username, name, surname, role, password_hash, audit_user_id)
    VALUES (p_username, p_name, p_surname, p_role, p_password_hash, p_audit_user_id)
    RETURNING id, username, name, surname, role, password_hash, audit_user_id, created_at;
$$;
