-- ==============================================================================
-- OBA COMIDA - SCRIPT DE POVOAMENTO INICIAL (SEED) PARA MYSQL / POSTGRESQL
-- Banco: anto8520_obacomida
-- Descrição: Insere categorias globais, estabelecimentos ativos, produtos, pedidos
--            e atribui permissões administrativas aos usuários seed oficiais.
-- ==============================================================================

-- 1. GARANTIR ROLES E PERMISSÕES ADMINISTRATIVAS
-- Promove admin1@obacomida.com.br para ADMIN e superadmin@obacomida.com.br para SUPER_ADMIN
INSERT IGNORE INTO roles (id, name, description, created_at)
VALUES 
  ('11111111-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Super Administrador Global do Marketplace', NOW()),
  ('11111111-0000-0000-0000-000000000002', 'ADMIN', 'Administrador Operacional Central', NOW()),
  ('11111111-0000-0000-0000-000000000003', 'PARTNER', 'Parceiro / Dono de Restaurante', NOW()),
  ('11111111-0000-0000-0000-000000000004', 'CUSTOMER', 'Consumidor / Cliente Final', NOW());

-- Vincular superadmin@obacomida.com.br à role SUPER_ADMIN
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'superadmin@obacomida.com.br' AND r.name = 'SUPER_ADMIN';

-- Vincular admin1@obacomida.com.br à role ADMIN
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'admin1@obacomida.com.br' AND r.name = 'ADMIN';


-- 2. INSERIR CATEGORIAS GLOBAIS DO MARKETPLACE
INSERT IGNORE INTO global_categories (id, name, slug, description, icon_url, sort_order, is_active, created_at, updated_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Hamburguerias', 'hamburguerias', 'Os melhores hambúrgueres artesanais e smash burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80', 1, 1, NOW(), NOW()),
  ('c1000000-0000-0000-0000-000000000002', 'Pizzarias', 'pizzarias', 'Pizzas napolitanas, tradicionais e artesanais', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', 2, 1, NOW(), NOW()),
  ('c1000000-0000-0000-0000-000000000003', 'Japonesa & Sushi', 'japonesa-sushi', 'Combinados de sushi, sashimi, temakis e rolls frescos', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&auto=format&fit=crop&q=80', 3, 1, NOW(), NOW()),
  ('c1000000-0000-0000-0000-000000000004', 'Comida Brasileira', 'comida-brasileira', 'Feijoada, pratos executivos, churrasco e culinária típica', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=80', 4, 1, NOW(), NOW()),
  ('c1000000-0000-0000-0000-000000000005', 'Sobremesas & Doces', 'sobremesas-doces', 'Bolos, tortas, açaí, sorvetes e doces artesanais', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80', 5, 1, NOW(), NOW());


-- 3. INSERIR ESTABELECIMENTOS INICIAIS (RESTAURANTES)
-- Estabelecimento 1: Burger Brothers Smash (Ativo)
INSERT IGNORE INTO restaurants (
  id, trade_name, corporate_name, cnpj, slug, status, description,
  logo_url, banner_url, global_category_id, phone, email,
  commission_rate, fixed_fee, minimum_order, delivery_fee,
  average_delivery_time_min, average_delivery_time_max, is_open, rating,
  created_at, updated_at
)
VALUES (
  'r1000000-0000-0000-0000-000000000001',
  'Burger Brothers Smash',
  'Burger Brothers Comercio de Alimentos Ltda',
  '23.456.789/0001-12',
  'burger-brothers-smash',
  'ACTIVE',
  'Hambúrgueres artesanais 100% Angus smash grelhados no ponto com queijo cheddar inglês derretido.',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
  'c1000000-0000-0000-0000-000000000001',
  '(11) 98111-2233',
  'contato@burgerbrothers.com.br',
  11.50,
  1.50,
  25.00,
  6.90,
  25,
  40,
  1,
  4.9,
  NOW(),
  NOW()
);

-- Estabelecimento 2: Bella Napoli Forneria (Ativo)
INSERT IGNORE INTO restaurants (
  id, trade_name, corporate_name, cnpj, slug, status, description,
  logo_url, banner_url, global_category_id, phone, email,
  commission_rate, fixed_fee, minimum_order, delivery_fee,
  average_delivery_time_min, average_delivery_time_max, is_open, rating,
  created_at, updated_at
)
VALUES (
  'r1000000-0000-0000-0000-000000000002',
  'Bella Napoli Forneria',
  'Bella Napoli Pizzaria & Forneria Ltda',
  '34.567.890/0001-23',
  'bella-napoli-forneria',
  'ACTIVE',
  'Pizzas de fermentação natural assadas em forno a lenha napolitano a 450°C.',
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'c1000000-0000-0000-0000-000000000002',
  '(11) 98222-3344',
  'sac@bellanapoli.com.br',
  12.00,
  1.50,
  35.00,
  8.50,
  35,
  55,
  1,
  4.8,
  NOW(),
  NOW()
);

-- Estabelecimento 3: Oba Burguer & Grill (Pendente de Aprovação para testes de moderação)
INSERT IGNORE INTO restaurants (
  id, trade_name, corporate_name, cnpj, slug, status, description,
  logo_url, banner_url, global_category_id, phone, email,
  commission_rate, fixed_fee, minimum_order, delivery_fee,
  average_delivery_time_min, average_delivery_time_max, is_open, rating,
  created_at, updated_at
)
VALUES (
  'r1000000-0000-0000-0000-000000000003',
  'Oba Burguer & Grill',
  'Oba Grill Gastronomia Ltda',
  '45.678.901/0001-34',
  'oba-burguer-grill',
  'PENDING',
  'Cardápio executivo com carnes nobres grelhadas na brasa, smash burgers e chopp gelado.',
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
  'c1000000-0000-0000-0000-000000000001',
  '(11) 98333-4455',
  'gerencia@obagrill.com.br',
  12.00,
  1.50,
  20.00,
  5.00,
  30,
  45,
  0,
  4.5,
  NOW(),
  NOW()
);


-- 4. INSERIR PRODUTOS EXEMPLO NO CARDÁPIO
INSERT IGNORE INTO products (id, restaurant_id, name, description, price, image_url, is_active, is_available, created_at, updated_at)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 'Smash Bacon Double', 'Dois blends Angus de 90g, cheddar inglês cremoso, fatias crocantes de bacon e maionese defumada.', 38.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80', 1, 1, NOW(), NOW()),
  ('p1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000001', 'Batata Rústica Trufada', 'Batatas rústicas com azeite de trufas brancas, parmesão ralado na hora e alecrim.', 24.50, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80', 1, 1, NOW(), NOW()),
  ('p1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000002', 'Pizza Margherita Di Bufala', 'Molho de tomate San Marzano DOP, mozzarella de búfala fresca, parmesão e manjericão fresco.', 64.90, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', 1, 1, NOW(), NOW());
