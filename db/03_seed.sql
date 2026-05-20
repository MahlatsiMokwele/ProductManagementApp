-- 03_seed.sql
-- Seeds a default admin and a small starting category tree + products.
--
-- The seed admin password is the BCrypt hash of: Admin#123 (Used - https://bcrypt-generator.com/ to generate)
-- Deterministic admin id so we can reference it as audit_user_id below.

DO $$
DECLARE
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
    v_electronics_id UUID;
    v_laptops_id UUID;
    v_phones_id UUID;
    v_clothing_id UUID;
BEGIN
    -- Admin user
    INSERT INTO user_details (id, username, name, surname, role, password_hash, audit_user_id)
    VALUES (
        v_admin_id,
        'admin',
        'System',
        'Administrator',
        'admin',
        '$2a$12$K5IF9tyMoUU24NlRk2lyEuBbwCv09XgGbGAKC4LAPaY0FQuaQXsr.', -- Admin#123
        v_admin_id
    )
    ON CONFLICT (username) DO NOTHING;

    -- Categories: a 2-level tree to demonstrate hierarchical structure.
    INSERT INTO categories (name, description, parent_category_id, audit_user_id)
    VALUES ('Electronics', 'Consumer electronics', NULL, v_admin_id)
    RETURNING id INTO v_electronics_id;

    INSERT INTO categories (name, description, parent_category_id, audit_user_id)
    VALUES ('Laptops', 'Portable computers', v_electronics_id, v_admin_id)
    RETURNING id INTO v_laptops_id;

    INSERT INTO categories (name, description, parent_category_id, audit_user_id)
    VALUES ('Phones', 'Smartphones', v_electronics_id, v_admin_id)
    RETURNING id INTO v_phones_id;

    INSERT INTO categories (name, description, parent_category_id, audit_user_id)
    VALUES ('Clothing', 'Apparel', NULL, v_admin_id)
    RETURNING id INTO v_clothing_id;

    -- Products
    INSERT INTO products (name, description, sku, price, quantity, category_id, audit_user_id) VALUES
        ('Dell XPS 13', '13-inch ultrabook', 'LAP-XPS13', 1499.99, 12, v_laptops_id, v_admin_id),
        ('MacBook Pro 14', '14-inch M3 laptop', 'LAP-MBP14', 2299.00, 8,  v_laptops_id, v_admin_id),
        ('iPhone 15',     '128GB smartphone', 'PHN-IP15',   999.00, 25, v_phones_id,  v_admin_id),
        ('Pixel 8',       '128GB smartphone', 'PHN-PX8',    699.00, 30, v_phones_id,  v_admin_id),
        ('Cotton T-Shirt','Plain cotton tee', 'CLT-TSHIRT',  19.99, 100, v_clothing_id, v_admin_id);
END $$;
