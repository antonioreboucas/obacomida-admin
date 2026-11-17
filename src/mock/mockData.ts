import type {
  AdminUser,
  Restaurant,
  Customer,
  Order,
  Category,
  Product,
  Promotion,
  Review,
  FinancialRecord,
  SupportTicket,
  AuditLog,
  PlatformSettings,
  OrderStatus,
  PaymentMethod,
  DeliveryType,
  ProductStatus,
  PromotionType,
  PromotionStatus,
  TargetAudience,
  TicketPriority,
  TicketStatus,
  RequesterType,
  PayoutStatus,
} from '../types';
import { getDefaultThemeForCategory } from '../utils/themePresets';

// Initial platform settings
export const initialSettings: PlatformSettings = {
  platformName: 'Oba Comida',
  companyName: 'Oba Comida Marketplace Tecnologia Ltda.',
  cnpj: '48.912.834/0001-90',
  supportEmail: 'suporte@obacomida.com.br',
  supportPhone: '(11) 4003-8921',
  logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
  primaryColor: '#ff6600',
  secondaryColor: '#e63946',
  defaultCommissionRate: 12.0,
  defaultFixedFee: 1.5,
  defaultServiceFeeRate: 3.5,
  minOrderValueDefault: 20.0,
  allowedPaymentMethods: ['Cartão de Crédito', 'Pix', 'Dinheiro', 'Vale Refeição'],
  maintenanceMode: false,
  autoApproveNewRestaurants: false,
  supportOperatingHours: '08:00 às 23:30 (Segunda a Domingo)',
};

// 10 Administrative Users
export const initialAdminUsers: AdminUser[] = [
  {
    id: 'usr-1',
    name: 'Carlos Albuquerque',
    email: 'carlos.super@obacomida.com.br',
    role: 'superadmin',
    status: 'Ativo',
    phone: '(11) 98765-4321',
    department: 'Diretoria Executiva',
    createdAt: '2025-01-10T10:00:00Z',
    lastLogin: '2026-11-16T15:20:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    name: 'Mariana Duarte',
    email: 'mariana.admin@obacomida.com.br',
    role: 'admin',
    status: 'Ativo',
    phone: '(11) 97654-3210',
    department: 'Operações Gerais',
    createdAt: '2025-02-15T09:30:00Z',
    lastLogin: '2026-11-16T14:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-3',
    name: 'Rodrigo Vasconcelos',
    email: 'rodrigo.admin@obacomida.com.br',
    role: 'admin',
    status: 'Ativo',
    phone: '(11) 96543-2109',
    department: 'Expansão & Novos Parceiros',
    createdAt: '2025-03-01T11:00:00Z',
    lastLogin: '2026-11-16T12:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-4',
    name: 'Beatriz Fonseca',
    email: 'beatriz.financeiro@obacomida.com.br',
    role: 'financial',
    status: 'Ativo',
    phone: '(11) 95432-1098',
    department: 'Controladoria & Finanças',
    createdAt: '2025-03-20T08:00:00Z',
    lastLogin: '2026-11-16T16:10:00Z',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-5',
    name: 'Felipe Mendonça',
    email: 'felipe.financeiro@obacomida.com.br',
    role: 'financial',
    status: 'Ativo',
    phone: '(11) 94321-0987',
    department: 'Faturamento & Repasses',
    createdAt: '2025-04-10T14:20:00Z',
    lastLogin: '2026-11-15T18:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-6',
    name: 'Camila Torres',
    email: 'camila.operador@obacomida.com.br',
    role: 'operator',
    status: 'Ativo',
    phone: '(11) 93210-9876',
    department: 'Central de Despacho & Monitoramento',
    createdAt: '2025-05-05T07:45:00Z',
    lastLogin: '2026-11-16T16:40:00Z',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-7',
    name: 'Lucas Pinho',
    email: 'lucas.operador@obacomida.com.br',
    role: 'operator',
    status: 'Ativo',
    phone: '(11) 92109-8765',
    department: 'Suporte ao Entregador & Restaurante',
    createdAt: '2025-06-12T10:15:00Z',
    lastLogin: '2026-11-16T13:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-8',
    name: 'Juliana Paes Leme',
    email: 'juliana.operador@obacomida.com.br',
    role: 'operator',
    status: 'Ativo',
    phone: '(11) 91098-7654',
    department: 'SAC & Reclamações',
    createdAt: '2025-07-01T13:00:00Z',
    lastLogin: '2026-11-16T11:20:00Z',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-9',
    name: 'Thiago Nogueira',
    email: 'thiago.admin@obacomida.com.br',
    role: 'admin',
    status: 'Inativo',
    phone: '(11) 90987-6543',
    department: 'Operações Regionais',
    createdAt: '2025-02-01T09:00:00Z',
    lastLogin: '2026-09-30T17:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-10',
    name: 'Amanda Carvalho',
    email: 'amanda.financeiro@obacomida.com.br',
    role: 'financial',
    status: 'Inativo',
    phone: '(11) 99876-5432',
    department: 'Auditoria Contábil',
    createdAt: '2025-04-01T08:30:00Z',
    lastLogin: '2026-10-15T16:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=80',
  },
];

// 20 Categories
export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Hamburguerias', slug: 'hamburguerias', icon: 'Beef', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80', displayOrder: 1, active: true, productsCount: 38, description: 'Burgers artesanais, smash, batatas e combos' },
  { id: 'cat-2', name: 'Pizzarias', slug: 'pizzarias', icon: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', displayOrder: 2, active: true, productsCount: 32, description: 'Pizzas tradicionais, napolitanas e doces' },
  { id: 'cat-3', name: 'Restaurantes', slug: 'restaurantes', icon: 'UtensilsCrossed', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', displayOrder: 3, active: true, productsCount: 28, description: 'Pratos executivos, à la carte e gourmet' },
  { id: 'cat-4', name: 'Açaí', slug: 'acai', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80', displayOrder: 4, active: true, productsCount: 16, description: 'Tigelas, copos montados e complementos' },
  { id: 'cat-5', name: 'Doces & Bolos', slug: 'doces-bolos', icon: 'Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80', displayOrder: 5, active: true, productsCount: 22, description: 'Tortas, brownies, brigadeiros e sobremesas' },
  { id: 'cat-6', name: 'Japonesa', slug: 'japonesa', icon: 'Fish', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&auto=format&fit=crop&q=80', displayOrder: 6, active: true, productsCount: 26, description: 'Sushis, sashimis, temakis e combinados' },
  { id: 'cat-7', name: 'Brasileira', slug: 'brasileira', icon: 'Soup', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80', displayOrder: 7, active: true, productsCount: 25, description: 'Feijoada, moqueca, baião de dois e comida caseira' },
  { id: 'cat-8', name: 'Bebidas', slug: 'bebidas', icon: 'Wine', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80', displayOrder: 8, active: true, productsCount: 19, description: 'Refrigerantes, sucos naturais, cervejas e águas' },
  { id: 'cat-9', name: 'Padarias', slug: 'padarias', icon: 'Croissant', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', displayOrder: 9, active: true, productsCount: 18, description: 'Pães artesanais, salgados, frios e lanches' },
  { id: 'cat-10', name: 'Cafeterias', slug: 'cafeterias', icon: 'Coffee', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80', displayOrder: 10, active: true, productsCount: 14, description: 'Cafés especiais, cappuccinos e acompanhamentos' },
  { id: 'cat-11', name: 'Saudável & Fit', slug: 'saudavel-fit', icon: 'Salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80', displayOrder: 11, active: true, productsCount: 15, description: 'Saladas, wraps, low carb e refeições fitness' },
  { id: 'cat-12', name: 'Frango Frito', slug: 'frango-frito', icon: 'Flame', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80', displayOrder: 12, active: true, productsCount: 12, description: 'Baldes crocantes, tenders, asas e molhos' },
  { id: 'cat-13', name: 'Italiana', slug: 'italiana', icon: 'Utensils', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&auto=format&fit=crop&q=80', displayOrder: 13, active: true, productsCount: 16, description: 'Massas frescas, lasanhas, risotos e molhos' },
  { id: 'cat-14', name: 'Árabe', slug: 'arabe', icon: 'Apple', image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&auto=format&fit=crop&q=80', displayOrder: 14, active: true, productsCount: 14, description: 'Esfihas, quibes, homus, falafel e shawarmas' },
  { id: 'cat-15', name: 'Sobremesas & Gelatos', slug: 'sobremesas-gelatos', icon: 'IceCream', image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&auto=format&fit=crop&q=80', displayOrder: 15, active: true, productsCount: 12, description: 'Sorvetes artesanais, picolés e milkshakes' },
  { id: 'cat-16', name: 'Petiscos & Porções', slug: 'petiscos-porcoes', icon: 'Beer', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400&auto=format&fit=crop&q=80', displayOrder: 16, active: true, productsCount: 15, description: 'Iscas de peixe, mandioca frita, tábuas de frios' },
  { id: 'cat-17', name: 'Pastelarias', slug: 'pastelarias', icon: 'Cookie', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80', displayOrder: 17, active: true, productsCount: 13, description: 'Pastéis gigantes, doces e caldo de cana' },
  { id: 'cat-18', name: 'Marmitas & PFs', slug: 'marmitas', icon: 'Box', image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&auto=format&fit=crop&q=80', displayOrder: 18, active: true, productsCount: 18, description: 'Marmitex diárias com tempero caseiro' },
  { id: 'cat-19', name: 'Lanches Rápidos', slug: 'lanches-rapidos', icon: 'Sandwich', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&auto=format&fit=crop&q=80', displayOrder: 19, active: true, productsCount: 14, description: 'Cachorros-quentes prensados, mistos e baurus' },
  { id: 'cat-20', name: 'Vegetariana & Vegana', slug: 'vegetariana-vegana', icon: 'Leaf', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80', displayOrder: 20, active: true, productsCount: 11, description: 'Opções 100% vegetais cheias de sabor' },
];

// Helper data generators
const brazilianFirstNames = [
  'Lucas', 'Gabriel', 'Mateus', 'Enzo', 'Guilherme', 'Pedro', 'Arthur', 'Bernardo', 'Gustavo', 'Felipe',
  'Rafael', 'Leonardo', 'Bruno', 'Thiago', 'Matheus', 'Vinicius', 'Rodrigo', 'Eduardo', 'Diego', 'Daniel',
  'Mariana', 'Beatriz', 'Camila', 'Juliana', 'Larissa', 'Carolina', 'Amanda', 'Bruna', 'Fernanda', 'Leticia',
  'Gabriela', 'Jessica', 'Vanessa', 'Aline', 'Patricia', 'Renata', 'Natalia', 'Luana', 'Isabela', 'Julia',
  'Sofia', 'Helena', 'Alice', 'Laura', 'Manuela', 'Valentina', 'Lorena', 'Giovanna', 'Yasmin', 'Rafaela'
];

const brazilianLastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
  'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Moura', 'Cavalcanti', 'Borges', 'Pinto', 'Batista'
];

const cities = [
  { city: 'São Paulo', state: 'SP', neighborhoods: ['Pinheiros', 'Itaim Bibi', 'Vila Mariana', 'Moema', 'Jardins', 'Perdizes'] },
  { city: 'Campinas', state: 'SP', neighborhoods: ['Cambuí', 'Taquaral', 'Barão Geraldo', 'Castelo'] },
  { city: 'Rio de Janeiro', state: 'RJ', neighborhoods: ['Copacabana', 'Ipanema', 'Botafogo', 'Tijuca', 'Barra da Tijuca'] },
  { city: 'Belo Horizonte', state: 'MG', neighborhoods: ['Savassi', 'Lourdes', 'Funcionários', 'Buritis'] },
  { city: 'Curitiba', state: 'PR', neighborhoods: ['Batel', 'Água Verde', 'Bigorrilho', 'Centro'] },
];

// 30 Establishments
const rawRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Burger Brothers Smash',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
    category: 'Hamburguerias',
    categoryId: 'cat-1',
    ownerName: 'Marcos Vinicius Vieira',
    phone: '(11) 98111-2233',
    email: 'contato@burgerbrothers.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua dos Pinheiros, 742',
    zipCode: '05422-001',
    cnpj: '23.456.789/0001-12',
    createdAt: '2025-01-15T10:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 1420,
    totalRevenue: 106500.0,
    commissionRate: 11.5,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 6.9,
    isOpen: true,
    history: [
      { date: '2025-01-15T10:00:00Z', action: 'Cadastro realizado', adminName: 'Sistema' },
      { date: '2025-01-16T14:30:00Z', action: 'Aprovado para início operacional', adminName: 'Mariana Duarte' },
    ],
  },
  {
    id: 'rest-2',
    name: 'Bella Napoli Forneria',
    logo: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    category: 'Pizzarias',
    categoryId: 'cat-2',
    ownerName: 'Giovanni Rossi',
    phone: '(11) 98222-3344',
    email: 'sac@bellanapoli.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Alameda Lorena, 1205',
    zipCode: '01424-001',
    cnpj: '34.567.890/0001-23',
    createdAt: '2025-01-18T11:20:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 1280,
    totalRevenue: 121600.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 40.0,
    deliveryTimeMin: 35,
    deliveryTimeMax: 50,
    deliveryFee: 8.5,
    isOpen: true,
    history: [
      { date: '2025-01-18T11:20:00Z', action: 'Cadastro realizado', adminName: 'Sistema' },
      { date: '2025-01-19T09:10:00Z', action: 'Aprovado e taxas ajustadas', adminName: 'Rodrigo Vasconcelos' },
    ],
  },
  {
    id: 'rest-3',
    name: 'Sushiman Prime',
    logo: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80',
    category: 'Japonesa',
    categoryId: 'cat-6',
    ownerName: 'Kenji Takahashi',
    phone: '(11) 98333-4455',
    email: 'kenji@sushimanprime.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Tomás Gonzaga, 88',
    zipCode: '01506-000',
    cnpj: '45.678.901/0001-34',
    createdAt: '2025-02-01T15:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 1850,
    totalRevenue: 240500.0,
    commissionRate: 13.0,
    fixedFee: 2.0,
    minimumOrder: 50.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 9.9,
    isOpen: true,
    history: [
      { date: '2025-02-01T15:00:00Z', action: 'Cadastro efetuado', adminName: 'Sistema' },
      { date: '2025-02-02T16:00:00Z', action: 'Aprovado com validação sanitária', adminName: 'Carlos Albuquerque' },
    ],
  },
  {
    id: 'rest-4',
    name: 'Açaí Tropical Raiz',
    logo: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80',
    category: 'Açaí',
    categoryId: 'cat-4',
    ownerName: 'Juliana Mendes Santana',
    phone: '(21) 98444-5566',
    email: 'tropical@acaitropicalraiz.com.br',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Av. Nossa Senhora de Copacabana, 450',
    zipCode: '22020-001',
    cnpj: '56.789.012/0001-45',
    createdAt: '2025-02-10T14:10:00Z',
    status: 'Ativo',
    rating: 4.7,
    totalOrders: 980,
    totalRevenue: 39200.0,
    commissionRate: 12.0,
    fixedFee: 1.0,
    minimumOrder: 18.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 5.5,
    isOpen: true,
    history: [
      { date: '2025-02-10T14:10:00Z', action: 'Cadastro recebido', adminName: 'Sistema' },
      { date: '2025-02-11T10:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' },
    ],
  },
  {
    id: 'rest-5',
    name: 'Sabor de Minas Fogão a Lenha',
    logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    category: 'Brasileira',
    categoryId: 'cat-7',
    ownerName: 'Sebastião Antunes',
    phone: '(31) 98555-6677',
    email: 'contato@sabordeminas.com.br',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua Paraíba, 980',
    zipCode: '30130-141',
    cnpj: '67.890.123/0001-56',
    createdAt: '2025-02-20T09:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 1120,
    totalRevenue: 67200.0,
    commissionRate: 11.0,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 7.0,
    isOpen: true,
    history: [
      { date: '2025-02-20T09:00:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-02-21T11:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' },
    ],
  },
  {
    id: 'rest-6',
    name: 'Doceria & Confeitaria Amor Doce',
    logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    category: 'Doces & Bolos',
    categoryId: 'cat-5',
    ownerName: 'Renata Lins Guimarães',
    phone: '(19) 98666-7788',
    email: 'renata@amordoce.com.br',
    city: 'Campinas',
    state: 'SP',
    address: 'Av. Coronel Silva Telles, 530',
    zipCode: '13024-001',
    cnpj: '78.901.234/0001-67',
    createdAt: '2025-03-01T14:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 790,
    totalRevenue: 47400.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 20.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 6.0,
    isOpen: true,
    history: [
      { date: '2025-03-01T14:00:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-03-02T15:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' },
    ],
  },
  {
    id: 'rest-7',
    name: 'La Trattoria del Nonno',
    logo: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80',
    category: 'Italiana',
    categoryId: 'cat-13',
    ownerName: 'Matteo Colombo',
    phone: '(41) 98777-8899',
    email: 'contato@latrattoria.com.br',
    city: 'Curitiba',
    state: 'PR',
    address: 'Av. Batel, 1860',
    zipCode: '80420-090',
    cnpj: '89.012.345/0001-78',
    createdAt: '2025-03-10T16:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 860,
    totalRevenue: 68800.0,
    commissionRate: 12.5,
    fixedFee: 2.0,
    minimumOrder: 35.0,
    deliveryTimeMin: 35,
    deliveryTimeMax: 50,
    deliveryFee: 8.0,
    isOpen: true,
    history: [
      { date: '2025-03-10T16:00:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-03-11T12:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' },
    ],
  },
  {
    id: 'rest-8',
    name: 'Crispy Chick Frango no Balde',
    logo: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
    category: 'Frango Frito',
    categoryId: 'cat-12',
    ownerName: 'Eduardo Martins Ramos',
    phone: '(11) 98888-9900',
    email: 'chick@crispychick.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Domingos de Morais, 1800',
    zipCode: '04010-200',
    cnpj: '90.123.456/0001-89',
    createdAt: '2025-03-15T11:00:00Z',
    status: 'Ativo',
    rating: 4.6,
    totalOrders: 650,
    totalRevenue: 39000.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 30.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 7.5,
    isOpen: true,
    history: [
      { date: '2025-03-15T11:00:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-03-16T10:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' },
    ],
  },
  {
    id: 'rest-9',
    name: 'Sultão Shawarma & Esfihas',
    logo: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
    category: 'Árabe',
    categoryId: 'cat-14',
    ownerName: 'Tarek Mansour',
    phone: '(11) 98999-0011',
    email: 'tarek@sultaoshawarma.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua 25 de Março, 1020',
    zipCode: '01021-100',
    cnpj: '01.234.567/0001-90',
    createdAt: '2025-04-01T10:30:00Z',
    status: 'Ativo',
    rating: 4.7,
    totalOrders: 910,
    totalRevenue: 45500.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 22.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 6.5,
    isOpen: true,
    history: [
      { date: '2025-04-01T10:30:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-04-02T14:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' },
    ],
  },
  {
    id: 'rest-10',
    name: 'Green & Co. Bowls Naturais',
    logo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
    category: 'Saudável & Fit',
    categoryId: 'cat-11',
    ownerName: 'Camila Penteado',
    phone: '(11) 97000-1122',
    email: 'camila@greenco.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Oscar Freire, 340',
    zipCode: '01426-000',
    cnpj: '12.345.678/0001-01',
    createdAt: '2025-04-10T12:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 740,
    totalRevenue: 40700.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 28.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 7.0,
    isOpen: true,
    history: [
      { date: '2025-04-10T12:00:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-04-11T16:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' },
    ],
  },
  // Pending and In-Analysis restaurants
  {
    id: 'rest-11',
    name: 'Tacos & Guacamole Mexican Bar',
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
    category: 'Restaurantes',
    categoryId: 'cat-3',
    ownerName: 'Alejandro Morales',
    phone: '(11) 97111-2233',
    email: 'alejandro@tacosmexican.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Brigadeiro Faria Lima, 2200',
    zipCode: '01451-000',
    cnpj: '23.456.789/0001-11',
    createdAt: '2026-11-10T14:30:00Z',
    status: 'Pendente',
    rating: 0,
    totalOrders: 0,
    totalRevenue: 0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 30.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 7.5,
    isOpen: false,
    history: [
      { date: '2026-11-10T14:30:00Z', action: 'Inscrição efetuada no portal', adminName: 'Sistema' },
    ],
  },
  {
    id: 'rest-12',
    name: 'Gelateria Veneziana Artesanal',
    logo: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=800&auto=format&fit=crop&q=80',
    category: 'Sobremesas & Gelatos',
    categoryId: 'cat-15',
    ownerName: 'Alessandra Ferrari',
    phone: '(19) 97222-3344',
    email: 'veneziana@gelateria.com.br',
    city: 'Campinas',
    state: 'SP',
    address: 'Rua Emílio Ribas, 890',
    zipCode: '13025-141',
    cnpj: '34.567.890/0001-22',
    createdAt: '2026-11-12T11:00:00Z',
    status: 'Em análise',
    rating: 0,
    totalOrders: 0,
    totalRevenue: 0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 30,
    deliveryFee: 6.0,
    isOpen: false,
    history: [
      { date: '2026-11-12T11:00:00Z', action: 'Inscrição efetuada', adminName: 'Sistema' },
      { date: '2026-11-13T10:00:00Z', action: 'Documentação sob análise', adminName: 'Rodrigo Vasconcelos' },
    ],
  },
  {
    id: 'rest-13',
    name: 'Pão & Prosa Padaria Artesanal',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Padarias',
    categoryId: 'cat-9',
    ownerName: 'Claudio Silveira',
    phone: '(31) 97333-4455',
    email: 'claudio@paoeprosa.com.br',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua Sergipe, 1140',
    zipCode: '30130-171',
    cnpj: '45.678.901/0001-33',
    createdAt: '2026-11-13T09:15:00Z',
    status: 'Em análise',
    rating: 0,
    totalOrders: 0,
    totalRevenue: 0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 15.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 5.5,
    isOpen: false,
    history: [
      { date: '2026-11-13T09:15:00Z', action: 'Inscrição efetuada', adminName: 'Sistema' },
      { date: '2026-11-14T11:30:00Z', action: 'Verificando alvará', adminName: 'Mariana Duarte' },
    ],
  },
  {
    id: 'rest-14',
    name: 'Boteco do Chico Petiscaria',
    logo: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
    category: 'Petiscos & Porções',
    categoryId: 'cat-16',
    ownerName: 'Francisco Chagas',
    phone: '(21) 97444-5566',
    email: 'chico@botecodochico.com.br',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Rua Voluntários da Pátria, 230',
    zipCode: '22270-010',
    cnpj: '56.789.012/0001-44',
    createdAt: '2025-05-15T15:30:00Z',
    status: 'Suspenso',
    rating: 3.8,
    totalOrders: 310,
    totalRevenue: 18600.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 30.0,
    deliveryTimeMin: 40,
    deliveryTimeMax: 60,
    deliveryFee: 8.0,
    isOpen: false,
    history: [
      { date: '2025-05-15T15:30:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2025-05-16T12:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' },
      { date: '2026-10-20T17:00:00Z', action: 'Suspensão temporária por atrasos reiterados', adminName: 'Mariana Duarte' },
    ],
  },
  {
    id: 'rest-15',
    name: 'Pizzaria Noturna Express',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    category: 'Pizzarias',
    categoryId: 'cat-2',
    ownerName: 'Marcio Rogério Souza',
    phone: '(11) 97555-6677',
    email: 'noturna@pizzariaexpress.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Cupecê, 3100',
    zipCode: '04366-000',
    cnpj: '67.890.123/0001-55',
    createdAt: '2026-09-01T20:00:00Z',
    status: 'Reprovado',
    rating: 0,
    totalOrders: 0,
    totalRevenue: 0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 30.0,
    deliveryTimeMin: 45,
    deliveryTimeMax: 60,
    deliveryFee: 8.0,
    isOpen: false,
    history: [
      { date: '2026-09-01T20:00:00Z', action: 'Cadastro', adminName: 'Sistema' },
      { date: '2026-09-03T14:00:00Z', action: 'Reprovado: CNPJ inapto na Receita Federal', adminName: 'Carlos Albuquerque' },
    ],
  },
  // Additional active restaurants to complete 30
  {
    id: 'rest-16',
    name: 'Coffee Lab & Bakery',
    logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120&auto=format&fit=crop&q=80',
    category: 'Cafeterias',
    categoryId: 'cat-10',
    ownerName: 'Isabela Prado',
    phone: '(11) 97666-7788',
    email: 'contato@coffeelab.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Fradique Coutinho, 1340',
    zipCode: '05416-001',
    cnpj: '78.901.234/0001-66',
    createdAt: '2025-06-01T10:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 620,
    totalRevenue: 24800.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 15.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 5.0,
    isOpen: true,
    history: [{ date: '2025-06-01T10:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-17',
    name: 'Cantina Di Napoli Massas',
    logo: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=120&auto=format&fit=crop&q=80',
    category: 'Italiana',
    categoryId: 'cat-13',
    ownerName: 'Enzo Bertolucci',
    phone: '(11) 97777-8899',
    email: 'enzo@dinapoli.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua 13 de Maio, 840 (Bixiga)',
    zipCode: '01327-000',
    cnpj: '89.012.345/0001-77',
    createdAt: '2025-06-15T11:00:00Z',
    status: 'Ativo',
    rating: 4.7,
    totalOrders: 830,
    totalRevenue: 58100.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 35.0,
    deliveryTimeMin: 35,
    deliveryTimeMax: 50,
    deliveryFee: 7.5,
    isOpen: true,
    history: [{ date: '2025-06-15T11:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' }],
  },
  {
    id: 'rest-18',
    name: 'Pastel & Caldo da Feira',
    logo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=120&auto=format&fit=crop&q=80',
    category: 'Pastelarias',
    categoryId: 'cat-17',
    ownerName: 'Manoel da Silva',
    phone: '(11) 97888-9900',
    email: 'pasteldafeira@gmail.com',
    city: 'São Paulo',
    state: 'SP',
    address: 'Praça Charles Miller, 10',
    zipCode: '01234-010',
    cnpj: '90.123.456/0001-88',
    createdAt: '2025-07-01T08:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 940,
    totalRevenue: 28200.0,
    commissionRate: 10.0,
    fixedFee: 1.0,
    minimumOrder: 15.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 5.0,
    isOpen: true,
    history: [{ date: '2025-07-01T08:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-19',
    name: 'Marmita Caseira & Cia',
    logo: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=120&auto=format&fit=crop&q=80',
    category: 'Marmitas & PFs',
    categoryId: 'cat-18',
    ownerName: 'Dona Neusa Alvarenga',
    phone: '(11) 97999-0011',
    email: 'marmitasdaneusa@gmail.com',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Vergueiro, 2500',
    zipCode: '04102-000',
    cnpj: '01.234.567/0001-99',
    createdAt: '2025-07-10T09:30:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 1350,
    totalRevenue: 40500.0,
    commissionRate: 10.0,
    fixedFee: 1.0,
    minimumOrder: 18.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 4.5,
    isOpen: true,
    history: [{ date: '2025-07-10T09:30:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' }],
  },
  {
    id: 'rest-20',
    name: 'Veggie Joy Cozinha Saudável',
    logo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&auto=format&fit=crop&q=80',
    category: 'Vegetariana & Vegana',
    categoryId: 'cat-20',
    ownerName: 'Luciana Brandão',
    phone: '(41) 98000-1122',
    email: 'veggiejoy@gmail.com',
    city: 'Curitiba',
    state: 'PR',
    address: 'Rua Comendador Araújo, 400',
    zipCode: '80420-000',
    cnpj: '12.345.678/0001-10',
    createdAt: '2025-08-01T10:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 580,
    totalRevenue: 29000.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 6.5,
    isOpen: true,
    history: [{ date: '2025-08-01T10:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-21',
    name: 'The King Burger & Fries',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80',
    category: 'Hamburguerias',
    categoryId: 'cat-1',
    ownerName: 'Leandro Castro',
    phone: '(31) 98111-3344',
    email: 'theking@burgerfries.com.br',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Av. Cristóvão Colombo, 550',
    zipCode: '30140-150',
    cnpj: '23.456.789/0001-21',
    createdAt: '2025-08-15T12:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 1040,
    totalRevenue: 72800.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 6.9,
    isOpen: true,
    history: [{ date: '2025-08-15T12:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-22',
    name: 'Bebidas Já Geladas 24h',
    logo: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=120&auto=format&fit=crop&q=80',
    category: 'Bebidas',
    categoryId: 'cat-8',
    ownerName: 'Vitor Hugo Barcellos',
    phone: '(11) 98222-4455',
    email: 'geladas24h@bebidasja.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Paulista, 1578',
    zipCode: '01310-200',
    cnpj: '34.567.890/0001-32',
    createdAt: '2025-09-01T15:00:00Z',
    status: 'Ativo',
    rating: 4.6,
    totalOrders: 1560,
    totalRevenue: 62400.0,
    commissionRate: 9.0,
    fixedFee: 1.0,
    minimumOrder: 20.0,
    deliveryTimeMin: 15,
    deliveryTimeMax: 30,
    deliveryFee: 5.0,
    isOpen: true,
    history: [{ date: '2025-09-01T15:00:00Z', action: 'Aprovado', adminName: 'Carlos Albuquerque' }],
  },
  {
    id: 'rest-23',
    name: 'Temakeria Tokio Express',
    logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=120&auto=format&fit=crop&q=80',
    category: 'Japonesa',
    categoryId: 'cat-6',
    ownerName: 'Patricia Tanji',
    phone: '(19) 98333-5566',
    email: 'tokio@temakeriaexpress.com.br',
    city: 'Campinas',
    state: 'SP',
    address: 'Rua Maria Monteiro, 1200',
    zipCode: '13025-152',
    cnpj: '45.678.901/0001-43',
    createdAt: '2025-09-10T11:00:00Z',
    status: 'Ativo',
    rating: 4.7,
    totalOrders: 820,
    totalRevenue: 65600.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 35.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 7.0,
    isOpen: true,
    history: [{ date: '2025-09-10T11:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' }],
  },
  {
    id: 'rest-24',
    name: 'Fogão Caipira & Churrasco',
    logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80',
    category: 'Restaurantes',
    categoryId: 'cat-3',
    ownerName: 'José Geraldo Rezende',
    phone: '(31) 98444-6677',
    email: 'fogaocaipira@gmail.com',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Av. Fleming, 900',
    zipCode: '31310-490',
    cnpj: '56.789.012/0001-54',
    createdAt: '2025-09-20T10:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 920,
    totalRevenue: 73600.0,
    commissionRate: 11.5,
    fixedFee: 1.5,
    minimumOrder: 30.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 50,
    deliveryFee: 8.0,
    isOpen: true,
    history: [{ date: '2025-09-20T10:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-25',
    name: 'Hot Dog Prensado do Paulinho',
    logo: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=120&auto=format&fit=crop&q=80',
    category: 'Lanches Rápidos',
    categoryId: 'cat-19',
    ownerName: 'Paulo Roberto Camargo',
    phone: '(11) 98555-7788',
    email: 'paulinhohotdog@gmail.com',
    city: 'São Paulo',
    state: 'SP',
    address: 'Largo da Batata, 55',
    zipCode: '05423-010',
    cnpj: '67.890.123/0001-65',
    createdAt: '2025-10-01T16:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 1150,
    totalRevenue: 28750.0,
    commissionRate: 10.0,
    fixedFee: 1.0,
    minimumOrder: 15.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 5.0,
    isOpen: true,
    history: [{ date: '2025-10-01T16:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-26',
    name: 'Don Peppone Pizzas Forno a Lenha',
    logo: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=120&auto=format&fit=crop&q=80',
    category: 'Pizzarias',
    categoryId: 'cat-2',
    ownerName: 'Pietro Moretti',
    phone: '(21) 98666-8899',
    email: 'donpeppone@pizzas.com.br',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Rua Dias Ferreira, 420 (Leblon)',
    zipCode: '22431-050',
    cnpj: '78.901.234/0001-76',
    createdAt: '2025-10-15T12:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 890,
    totalRevenue: 80100.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 45.0,
    deliveryTimeMin: 35,
    deliveryTimeMax: 50,
    deliveryFee: 9.0,
    isOpen: true,
    history: [{ date: '2025-10-15T12:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' }],
  },
  {
    id: 'rest-27',
    name: 'Churrascaria Fogo Gaúcho',
    logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80',
    category: 'Restaurantes',
    categoryId: 'cat-3',
    ownerName: 'Darci dos Santos',
    phone: '(41) 98777-9900',
    email: 'fogogaucho@churrasco.com.br',
    city: 'Curitiba',
    state: 'PR',
    address: 'Av. Manoel Ribas, 3200 (Santa Felicidade)',
    zipCode: '82030-000',
    cnpj: '89.012.345/0001-87',
    createdAt: '2025-11-01T11:00:00Z',
    status: 'Ativo',
    rating: 4.7,
    totalOrders: 710,
    totalRevenue: 78100.0,
    commissionRate: 12.5,
    fixedFee: 2.0,
    minimumOrder: 50.0,
    deliveryTimeMin: 35,
    deliveryTimeMax: 55,
    deliveryFee: 9.5,
    isOpen: true,
    history: [{ date: '2025-11-01T11:00:00Z', action: 'Aprovado', adminName: 'Carlos Albuquerque' }],
  },
  {
    id: 'rest-28',
    name: 'Creperia Paris & Bistrô',
    logo: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=120&auto=format&fit=crop&q=80',
    category: 'Restaurantes',
    categoryId: 'cat-3',
    ownerName: 'Claire Dubois',
    phone: '(11) 98888-0011',
    email: 'claire@creperiaparis.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Bela Cintra, 1800',
    zipCode: '01415-002',
    cnpj: '90.123.456/0001-98',
    createdAt: '2025-11-15T14:00:00Z',
    status: 'Ativo',
    rating: 4.8,
    totalOrders: 640,
    totalRevenue: 38400.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 30.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 7.0,
    isOpen: true,
    history: [{ date: '2025-11-15T14:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
  {
    id: 'rest-29',
    name: 'Wok Master Culinária Asiática',
    logo: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=120&auto=format&fit=crop&q=80',
    category: 'Restaurantes',
    categoryId: 'cat-3',
    ownerName: 'Chen Wei',
    phone: '(19) 98999-1122',
    email: 'wokmaster@gmail.com',
    city: 'Campinas',
    state: 'SP',
    address: 'Av. Barão de Itapura, 2100',
    zipCode: '13020-432',
    cnpj: '01.234.567/0001-09',
    createdAt: '2025-12-01T10:00:00Z',
    status: 'Ativo',
    rating: 4.6,
    totalOrders: 530,
    totalRevenue: 29150.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 6.5,
    isOpen: true,
    history: [{ date: '2025-12-01T10:00:00Z', action: 'Aprovado', adminName: 'Rodrigo Vasconcelos' }],
  },
  {
    id: 'rest-30',
    name: 'Brownie & Cookie Lab',
    logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&auto=format&fit=crop&q=80',
    category: 'Doces & Bolos',
    categoryId: 'cat-5',
    ownerName: 'Sabrina Fagundes',
    phone: '(11) 99000-2233',
    email: 'sabrina@browniecookielab.com.br',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Harmonia, 410 (Vila Madalena)',
    zipCode: '05435-000',
    cnpj: '12.345.678/0001-20',
    createdAt: '2025-12-10T15:00:00Z',
    status: 'Ativo',
    rating: 4.9,
    totalOrders: 780,
    totalRevenue: 31200.0,
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 20.0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 6.0,
    isOpen: true,
    history: [{ date: '2025-12-10T15:00:00Z', action: 'Aprovado', adminName: 'Mariana Duarte' }],
  },
];

export const initialRestaurants: Restaurant[] = rawRestaurants.map((r) => ({
  ...r,
  theme: r.theme || getDefaultThemeForCategory(r.category),
}));

// Generate 100 Customers
export const generateCustomers = (): Customer[] => {
  const customers: Customer[] = [];
  for (let i = 1; i <= 100; i++) {
    const fName = brazilianFirstNames[(i - 1) % brazilianFirstNames.length];
    const lName = brazilianLastNames[Math.floor((i * 7) % brazilianLastNames.length)];
    const fullName = `${fName} ${lName}`;
    const cityObj = cities[i % cities.length];
    const neighborhood = cityObj.neighborhoods[i % cityObj.neighborhoods.length];
    const cleanName = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}`;
    const email = `${cleanName}@gmail.com`;
    const totalOrders = Math.max(1, Math.floor((i * 13) % 45));
    const totalSpent = Number((totalOrders * (45 + (i % 35))).toFixed(2));

    customers.push({
      id: `cust-${i}`,
      name: fullName,
      email,
      phone: `(11) 9${Math.floor(1000 + (i * 87) % 9000)}-${Math.floor(1000 + (i * 63) % 9000)}`,
      createdAt: new Date(2025, (i % 12), (i % 27) + 1, 10, 30).toISOString(),
      totalOrders,
      totalSpent,
      status: i % 15 === 0 ? 'Inativo' : 'Ativo',
      addresses: [
        {
          id: `addr-${i}-1`,
          title: 'Casa',
          street: `Rua das Flores, ${100 + i * 4}`,
          number: `${100 + i * 4}`,
          neighborhood,
          city: cityObj.city,
          state: cityObj.state,
          zipCode: `0${1000 + i * 20}-000`,
          isDefault: true,
        },
        {
          id: `addr-${i}-2`,
          title: 'Trabalho',
          street: `Av. Central, ${500 + i * 2}`,
          number: `${500 + i * 2}`,
          neighborhood: cityObj.neighborhoods[(i + 1) % cityObj.neighborhoods.length],
          city: cityObj.city,
          state: cityObj.state,
          zipCode: `0${2000 + i * 20}-000`,
          isDefault: false,
        },
      ],
      avatar: `https://images.unsplash.com/photo-${1530000000000 + (i * 1234567) % 80000000}?w=100&auto=format&fit=crop&q=80`,
    });
  }
  return customers;
};

export const initialCustomers = generateCustomers();

// Generate 200 Products distributed across restaurants
export const generateProducts = (restaurants: Restaurant[], categories: Category[]): Product[] => {
  const products: Product[] = [];
  const baseFoodTemplates = [
    { name: 'Smash Burger Clássico', desc: 'Dois blends de 90g ultra smash, cheddar inglês derretido e maionese da casa no pão brioche.', price: 32.9, cat: 'cat-1', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
    { name: 'Bacon Cheese Monster', desc: 'Blend 160g angus, tiras crocantes de bacon artesanal, molho barbecue e queijo prato.', price: 42.0, cat: 'cat-1', img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80' },
    { name: 'Batata Rústica Trufada', desc: 'Batatas rústicas fritas na hora com azeite de trufas brancas e queijo parmesão ralado.', price: 26.5, cat: 'cat-1', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80' },
    { name: 'Pizza Margherita Especial', desc: 'Molho pelati italiano, mozzarella de búfala, manjericão fresco e azeite extravirgem.', price: 68.0, cat: 'cat-2', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80' },
    { name: 'Pizza Calabresa Artesanal', desc: 'Calabresa curada fatiada fininha, cebola roxa, azeitonas pretas e orégano fresco.', price: 62.0, cat: 'cat-2', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&auto=format&fit=crop&q=80' },
    { name: 'Combo Sushi Premium 30 Peças', desc: '10 sashimis de salmão maçaricado, 8 uramakis filadélfia, 6 niguiris e 6 hossomakis.', price: 98.0, cat: 'cat-6', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&auto=format&fit=crop&q=80' },
    { name: 'Temaki Salmão Completo', desc: 'Cone de alga nori crocante recheado com salmão fresco em cubos, cream cheese e cebolinha.', price: 34.0, cat: 'cat-6', img: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=80' },
    { name: 'Tigela Açaí 500ml Turbinada', desc: 'Açaí puro do Pará batido na consistência cremosa, morangos, banana, leite ninho e granola.', price: 28.5, cat: 'cat-4', img: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80' },
    { name: 'Copo Açaí 300ml Supreme', desc: 'Camadas de creme de avelã, leite condensado, morangos frescos e paçoca.', price: 21.0, cat: 'cat-4', img: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80' },
    { name: 'Feijoada Completa Individual', desc: 'Acompanha arroz branco soltinho, couve refogada no alho, farofa crocante e laranja.', price: 46.0, cat: 'cat-7', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80' },
    { name: 'Torta Holandesa Fatia Gourmet', desc: 'Creme leve de baunilha, base crocante de biscoitos calipso e cobertura de ganache belga.', price: 18.5, cat: 'cat-5', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80' },
    { name: 'Bolo de Cenoura com Brigadeiro', desc: 'Massa fofinha de cenoura com cobertura vulcão de puro brigadeiro de panela.', price: 22.0, cat: 'cat-5', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80' },
    { name: 'Lasanha à Bolonhesa da Nona', desc: 'Massa artesanal intercalada com molho de carne especial cozido por 6h e queijo gratinado.', price: 54.0, cat: 'cat-13', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&auto=format&fit=crop&q=80' },
    { name: 'Balde de Frango Crocante Grande', desc: '12 pedaços generosos de peito e coxa empanados no tempero secreto com 2 molhos.', price: 65.0, cat: 'cat-12', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80' },
    { name: 'Shawarma Misto Especial', desc: 'Pão sírio enrolado com tiras de carne bovina e frango marinados, pasta de alho e batata.', price: 32.0, cat: 'cat-14', img: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&auto=format&fit=crop&q=80' },
    { name: 'Bowl Salada Caesar com Tiras de Frango', desc: 'Mix de folhas verdes, peito de frango grelhado, croutons dourados e molho caesar.', price: 35.0, cat: 'cat-11', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80' },
    { name: 'Croissant Recheado de Chocolate', desc: 'Folhado francês amanteigado recheado com generoso chocolate ao leite derretido.', price: 16.0, cat: 'cat-9', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80' },
    { name: 'Cappuccino Italiano Cremoso', desc: 'Café espresso especial extraído na hora com leite vaporizado e polvilhado de cacau.', price: 14.0, cat: 'cat-10', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80' },
    { name: 'Pastel Gigante de Carne e Queijo', desc: 'Pastel sequinho de 30cm recheado de carne temperada e queijo mussarela.', price: 18.0, cat: 'cat-17', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80' },
    { name: 'Marmitex Executivo Bife Acebolado', desc: 'Arroz, feijão carioca, bife acebolado macio, purê de batata e farofa da casa.', price: 27.0, cat: 'cat-18', img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&auto=format&fit=crop&q=80' },
  ];

  for (let i = 1; i <= 200; i++) {
    const tmpl = baseFoodTemplates[(i - 1) % baseFoodTemplates.length];
    const rest = restaurants[(i - 1) % restaurants.length];
    const cat = categories.find((c) => c.id === tmpl.cat) || categories[0];
    const status: ProductStatus = i % 25 === 0 ? 'Em moderação' : (i % 60 === 0 ? 'Rejeitado' : 'Aprovado');

    products.push({
      id: `prod-${i}`,
      restaurantId: rest.id,
      restaurantName: rest.name,
      categoryId: cat.id,
      categoryName: cat.name,
      name: `${tmpl.name} #${i}`,
      description: tmpl.desc,
      price: Number((tmpl.price + ((i % 10) * 1.5)).toFixed(2)),
      promotionalPrice: i % 4 === 0 ? Number((tmpl.price * 0.85).toFixed(2)) : undefined,
      image: tmpl.img,
      available: i % 18 !== 0,
      status,
      createdAt: '2025-05-10T12:00:00Z',
      moderationHistory: [
        {
          date: '2025-05-10T12:00:00Z',
          action: status === 'Aprovado' ? 'Item aprovado no catálogo' : 'Pendente de validação de imagem',
          justification: status === 'Rejeitado' ? 'Imagem fora do padrão visual ou descrição incompleta' : 'Conforme diretrizes',
          adminName: 'Mariana Duarte',
        },
      ],
    });
  }
  return products;
};

export const initialProducts = generateProducts(initialRestaurants, initialCategories);

// Generate 500 Orders
export const generateOrders = (
  customers: Customer[],
  restaurants: Restaurant[],
  products: Product[]
): Order[] => {
  const orders: Order[] = [];
  const statuses: OrderStatus[] = [
    'Entregue', 'Entregue', 'Entregue', 'Entregue', 'Entregue',
    'Em preparação', 'Saiu para entrega', 'Confirmado', 'Criado', 'Cancelado',
  ];
  const paymentMethods: PaymentMethod[] = ['Pix', 'Cartão de Crédito', 'Pix', 'Cartão de Crédito', 'Dinheiro', 'Vale Refeição'];

  const now = new Date(2026, 10, 16, 20, 0, 0); // Nov 16, 2026

  for (let i = 1; i <= 500; i++) {
    const cust = customers[(i - 1) % customers.length];
    // Favor active restaurants
    const activeRests = restaurants.filter((r) => r.status === 'Ativo');
    const rest = activeRests[(i * 3) % activeRests.length];

    // Status distribution
    let status: OrderStatus = 'Entregue';
    if (i <= 40) status = 'Em preparação';
    else if (i <= 75) status = 'Saiu para entrega';
    else if (i <= 100) status = 'Confirmado';
    else if (i <= 115) status = 'Criado';
    else if (i <= 145) status = 'Cancelado';
    else status = statuses[i % statuses.length];

    // Order items
    const restProds = products.filter((p) => p.restaurantId === rest.id);
    const prodList = restProds.length > 0 ? restProds : products.slice(0, 5);
    const itemsCount = (i % 3) + 1;
    let subtotal = 0;
    const items = [];

    for (let k = 0; k < itemsCount; k++) {
      const prod = prodList[k % prodList.length];
      const qty = (k % 2) + 1;
      const unitPrice = prod.promotionalPrice || prod.price;
      const totalPrice = Number((qty * unitPrice).toFixed(2));
      subtotal += totalPrice;
      items.push({
        id: `item-${i}-${k}`,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice,
        totalPrice,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const deliveryFee = i % 7 === 0 ? 0.0 : rest.deliveryFee;
    const serviceFee = Number((subtotal * 0.035).toFixed(2));
    const discount = i % 5 === 0 ? 10.0 : 0.0;
    const totalAmount = Number((subtotal + deliveryFee + serviceFee - discount).toFixed(2));

    // Date distribution: recent orders for today/yesterday/last 7 days/last 30 days
    // Spread evenly across 60 days
    const hoursAgo = (i - 1) * 2.8; // distributes over ~58 days
    const orderDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    const orderDateIso = orderDate.toISOString();

    const code = `#OBA-${String(9000 + i).padStart(5, '0')}`;
    const payment = paymentMethods[i % paymentMethods.length];
    const delivType: DeliveryType = i % 9 === 0 ? 'Retirada' : 'Entrega';

    // Status timeline
    const history: Order['statusHistory'] = [
      { status: 'Criado' as OrderStatus, timestamp: orderDateIso, note: 'Pedido transmitido com sucesso' },
    ];
    if (status !== 'Criado') {
      const confirmedDate = new Date(orderDate.getTime() + 2 * 60000).toISOString();
      history.push({ status: 'Confirmado' as OrderStatus, timestamp: confirmedDate, note: 'Restaurante aceitou o pedido' });
    }
    if (['Em preparação', 'Saiu para entrega', 'Entregue'].includes(status)) {
      const prepDate = new Date(orderDate.getTime() + 10 * 60000).toISOString();
      history.push({ status: 'Em preparação' as OrderStatus, timestamp: prepDate, note: 'Pratos em preparo na cozinha' });
    }
    if (['Saiu para entrega', 'Entregue'].includes(status)) {
      const dispatchDate = new Date(orderDate.getTime() + 30 * 60000).toISOString();
      history.push({ status: 'Saiu para entrega' as OrderStatus, timestamp: dispatchDate, note: 'Entregador retirou o pacote' });
    }
    if (status === 'Entregue') {
      const delivDate = new Date(orderDate.getTime() + 45 * 60000).toISOString();
      history.push({ status: 'Entregue' as OrderStatus, timestamp: delivDate, note: 'Confirmado via código PIN do cliente' });
    }
    if (status === 'Cancelado') {
      const cancelDate = new Date(orderDate.getTime() + 15 * 60000).toISOString();
      history.push({
        status: 'Cancelado' as OrderStatus,
        timestamp: cancelDate,
        note: i % 2 === 0 ? 'Cancelado pelo cliente (tempo de espera)' : 'Cancelado por falta de insumos no restaurante',
        adminName: i % 4 === 0 ? 'Mariana Duarte' : undefined,
      });
    }

    // Occurrences
    const occurrences = [];
    if (i % 12 === 0) {
      occurrences.push({
        id: `occ-${i}`,
        date: orderDateIso,
        type: i % 2 === 0 ? 'Atraso na entrega' : 'Item incorreto',
        description: i % 2 === 0 ? 'Cliente entrou em contato informando demora de 20min além da previsão.' : 'Refrigerante entregue diferente do solicitado.',
        resolved: status === 'Entregue',
        resolutionNote: status === 'Entregue' ? 'Cupom de R$ 10 gerado para o cliente e motoboy notificado.' : undefined,
      });
    }

    orders.push({
      id: `ord-${i}`,
      code,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      restaurantId: rest.id,
      restaurantName: rest.name,
      items,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      totalAmount,
      paymentMethod: payment,
      status,
      deliveryType: delivType,
      deliveryAddress: cust.addresses[0]?.street ? `${cust.addresses[0].street}, ${cust.addresses[0].neighborhood}` : 'Endereço Principal',
      city: rest.city,
      createdAt: orderDateIso,
      statusHistory: history,
      occurrences,
    });
  }
  return orders;
};

export const initialOrders = generateOrders(initialCustomers, initialRestaurants, initialProducts);

// Generate 50 Promotions
export const generatePromotions = (restaurants: Restaurant[], categories: Category[]): Promotion[] => {
  const promotions: Promotion[] = [];
  const promoTypes: PromotionType[] = ['percent', 'fixed', 'free_shipping', 'coupon', 'category', 'restaurant'];
  const audiences: TargetAudience[] = ['all', 'new_customers', 'vip', 'inactive'];
  const promoStatuses: PromotionStatus[] = ['Ativa', 'Ativa', 'Ativa', 'Agendada', 'Pausada', 'Expirada'];

  const promoTitles = [
    'Festival da Pizza com Desconto',
    'Frete Grátis na Primeira Compra',
    'Cupom Especial de Sexta-Feira',
    'Smash Burger Mania',
    'Sushi Week Oba Comida',
    'Desconto de Boas-Vindas Clientes Novos',
    'Açaí em Dobro Verão',
    'Quarta do PF Econômico',
    'Super Cupom Fim de Semana',
    'Cupom Fidelidade Clientes VIP',
  ];

  for (let i = 1; i <= 50; i++) {
    const pType = promoTypes[i % promoTypes.length];
    const audience = audiences[i % audiences.length];
    const status = promoStatuses[i % promoStatuses.length];
    const baseTitle = promoTitles[(i - 1) % promoTitles.length];
    const rest = i % 3 === 0 ? restaurants[i % restaurants.length] : undefined;
    const cat = i % 4 === 0 ? categories[i % categories.length] : undefined;
    const code = pType === 'coupon' || i % 2 === 0 ? `OBA${10 + (i * 3)}` : undefined;
    const discountVal = pType === 'percent' ? 15 + (i % 20) : (pType === 'fixed' ? 10 + (i % 15) : 0);

    promotions.push({
      id: `promo-${i}`,
      name: `${baseTitle} #${i}`,
      code,
      type: pType,
      discountValue: discountVal,
      minOrderValue: 25.0 + (i % 20),
      startDate: new Date(2026, 9, 1 + (i % 25)).toISOString().split('T')[0],
      endDate: new Date(2026, 11, 1 + (i % 28)).toISOString().split('T')[0],
      budget: 1000 + i * 200,
      usedBudget: Math.min(1000 + i * 200, Math.floor((1000 + i * 200) * (0.3 + (i % 6) * 0.1))),
      maxUses: 100 + i * 20,
      currentUses: Math.floor((100 + i * 20) * (0.35 + (i % 5) * 0.1)),
      targetAudience: audience,
      status,
      categoryId: cat?.id,
      categoryName: cat?.name,
      restaurantId: rest?.id,
      restaurantName: rest?.name,
      description: `Campanha promocional de incentivo de pedidos Oba Comida com benefício de ${pType}.`,
    });
  }
  return promotions;
};

export const initialPromotions = generatePromotions(initialRestaurants, initialCategories);

// Generate 100 Reviews
export const generateReviews = (
  customers: Customer[],
  restaurants: Restaurant[],
  orders: Order[]
): Review[] => {
  const reviews: Review[] = [];
  const positiveComments = [
    'Comida chegou extremamente quente e muito saborosa! Entregador super educado.',
    'Melhor custo-benefício da região, porção bem caprichada.',
    'Ingredientes fresquinhos, embalagem impecável. Com certeza vou pedir novamente!',
    'Chegou antes do prazo estipulado! Sensacional.',
    'Excelente atendimento e lanche divino. 5 estrelas com louvor!',
  ];
  const neutralComments = [
    'A comida é boa mas atrasou cerca de 15 minutos além do prazo.',
    'O sabor é agradável, mas faltou um pouco de tempero na carne.',
    'Lanche bom, só acho que o refrigerante poderia ter vindo mais gelado.',
  ];
  const negativeComments = [
    'Pedido veio totalmente revirado na sacola e o refrigerante estava quente.',
    'Demorou mais de 1 hora para chegar e a comida já estava gelada.',
    'Veio faltando um item do meu pedido e o restaurante não atendeu o telefone!',
  ];

  for (let i = 1; i <= 100; i++) {
    const cust = customers[(i - 1) % customers.length];
    const ord = orders[(i * 4) % orders.length];
    const rest = restaurants.find((r) => r.id === ord.restaurantId) || restaurants[0];

    let rating = 5;
    let comment = positiveComments[i % positiveComments.length];
    const isReported = i % 14 === 0;

    if (i % 7 === 0) {
      rating = 2;
      comment = negativeComments[i % negativeComments.length];
    } else if (i % 4 === 0) {
      rating = 4;
      comment = neutralComments[i % neutralComments.length];
    } else if (i % 11 === 0) {
      rating = 1;
      comment = negativeComments[i % negativeComments.length];
    }

    reviews.push({
      id: `rev-${i}`,
      customerId: cust.id,
      customerName: cust.name,
      restaurantId: rest.id,
      restaurantName: rest.name,
      orderId: ord.id,
      orderCode: ord.code,
      rating,
      comment,
      createdAt: ord.createdAt,
      reported: isReported,
      reportReason: isReported ? 'Restaurante alega linguagem ofensiva ou difamação indevida' : undefined,
      moderationStatus: isReported ? 'pending' : 'approved',
      moderationJustification: isReported ? undefined : 'Comentário em conformidade com as regras',
    });
  }
  return reviews;
};

export const initialReviews = generateReviews(initialCustomers, initialRestaurants, initialOrders);

// Generate 50 Financial Records
export const generateFinancialRecords = (restaurants: Restaurant[], orders: Order[]): FinancialRecord[] => {
  const records: FinancialRecord[] = [];
  const payoutStatuses: PayoutStatus[] = ['Pago', 'Pago', 'Processado', 'Pendente', 'Retido'];

  for (let i = 1; i <= 50; i++) {
    const ord = orders[(i * 9) % orders.length];
    const rest = restaurants.find((r) => r.id === ord.restaurantId) || restaurants[0];
    const commPct = rest.commissionRate;
    const gross = ord.totalAmount;
    const commAmount = Number(((gross * commPct) / 100).toFixed(2));
    const serviceFee = ord.serviceFee;
    const delivFee = ord.deliveryFee;
    const netAmount = Number((gross - commAmount - serviceFee).toFixed(2));
    const pStatus = payoutStatuses[i % payoutStatuses.length];

    records.push({
      id: `fin-${i}`,
      restaurantId: rest.id,
      restaurantName: rest.name,
      orderId: ord.id,
      orderCode: ord.code,
      date: ord.createdAt,
      grossAmount: gross,
      commissionAmount: commAmount,
      commissionPercentage: commPct,
      serviceFee,
      deliveryFee: delivFee,
      netAmount,
      payoutStatus: pStatus,
      payoutDate: pStatus === 'Pago' ? '2026-11-10T14:00:00Z' : undefined,
      referenceMonth: '2026-11',
    });
  }
  return records;
};

export const initialFinancialRecords = generateFinancialRecords(initialRestaurants, initialOrders);

// Generate 30 Support Tickets
export const initialSupportTickets: SupportTicket[] = [
  {
    id: 'tkt-1',
    code: '#TK-1001',
    requesterName: 'Marcos Vinicius Vieira',
    requesterEmail: 'contato@burgerbrothers.com.br',
    requesterType: 'Restaurante',
    subject: 'Dúvida sobre repasse do fechamento quinzenal',
    category: 'Financeiro',
    createdAt: '2026-11-16T14:20:00Z',
    assignedTo: 'Beatriz Fonseca',
    priority: 'Alta',
    status: 'Em atendimento',
    messages: [
      { id: 'm-1', sender: 'Marcos Vinicius Vieira', isStaff: false, timestamp: '2026-11-16T14:20:00Z', text: 'Boa tarde! O extrato da primeira quinzena de novembro ainda não reflete a bonificação da campanha do Dia do Hambúrguer.' },
      { id: 'm-2', sender: 'Beatriz Fonseca (Suporte Financeiro)', isStaff: true, timestamp: '2026-11-16T14:35:00Z', text: 'Olá Marcos! Estamos checando junto à equipe de campanhas e o ajuste do crédito será consolidado até o fim da tarde de hoje.' },
    ],
  },
  {
    id: 'tkt-2',
    code: '#TK-1002',
    requesterName: 'Mariana Silva',
    requesterEmail: 'mariana.silva1@gmail.com',
    requesterType: 'Cliente',
    subject: 'Cobrança duplicada no cartão via Pix',
    category: 'Pagamentos',
    createdAt: '2026-11-16T15:10:00Z',
    assignedTo: 'Camila Torres',
    priority: 'Urgente',
    status: 'Aberto',
    messages: [
      { id: 'm-3', sender: 'Mariana Silva', isStaff: false, timestamp: '2026-11-16T15:10:00Z', text: 'Meu pedido #OBA-09002 foi cobrado duas vezes pelo app do banco. Gostaria do estorno imediato.' },
    ],
  },
  {
    id: 'tkt-3',
    code: '#TK-1003',
    requesterName: 'Giovanni Rossi',
    requesterEmail: 'sac@bellanapoli.com.br',
    requesterType: 'Restaurante',
    subject: 'Solicitação de expansão do raio de entrega de 5km para 8km',
    category: 'Operacional',
    createdAt: '2026-11-15T18:00:00Z',
    assignedTo: 'Lucas Pinho',
    priority: 'Média',
    status: 'Aguardando resposta',
    messages: [
      { id: 'm-4', sender: 'Giovanni Rossi', isStaff: false, timestamp: '2026-11-15T18:00:00Z', text: 'Gostaríamos de atender os bairros vizinhos pois temos frota própria de motoboys.' },
      { id: 'm-5', sender: 'Lucas Pinho', isStaff: true, timestamp: '2026-11-16T09:00:00Z', text: 'Para autorizarmos o raio expandido, precisamos da confirmação do tempo médio de entrega estimado.' },
    ],
  },
  {
    id: 'tkt-4',
    code: '#TK-1004',
    requesterName: 'Carlos Entregador Motoboy',
    requesterEmail: 'carlos.motoboy@gmail.com',
    requesterType: 'Entregador',
    subject: 'Dificuldade de localização do endereço do cliente no mapa',
    category: 'Logística',
    createdAt: '2026-11-16T16:00:00Z',
    assignedTo: 'Juliana Paes Leme',
    priority: 'Alta',
    status: 'Em atendimento',
    messages: [
      { id: 'm-6', sender: 'Carlos Entregador Motoboy', isStaff: false, timestamp: '2026-11-16T16:00:00Z', text: 'O cliente não colocou o número do bloco do condomínio e não atende o chat.' },
    ],
  },
  {
    id: 'tkt-5',
    code: '#TK-1005',
    requesterName: 'Kenji Takahashi',
    requesterEmail: 'kenji@sushimanprime.com.br',
    requesterType: 'Restaurante',
    subject: 'Moderação de avaliação ofensiva com dados pessoais',
    category: 'Moderação',
    createdAt: '2026-11-14T11:20:00Z',
    assignedTo: 'Mariana Duarte',
    priority: 'Média',
    status: 'Resolvido',
    messages: [
      { id: 'm-7', sender: 'Kenji Takahashi', isStaff: false, timestamp: '2026-11-14T11:20:00Z', text: 'O cliente citou o nome completo do atendente de forma injuriosa.' },
      { id: 'm-8', sender: 'Mariana Duarte', isStaff: true, timestamp: '2026-11-14T14:10:00Z', text: 'Avaliação moderada e ocultada de acordo com as diretrizes da comunidade Oba Comida.' },
    ],
  },
];

// Complete 30 tickets
for (let t = 6; t <= 30; t++) {
  const reqTypes: RequesterType[] = ['Cliente', 'Restaurante', 'Entregador'];
  const priorities: TicketPriority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];
  const statuses: TicketStatus[] = ['Aberto', 'Em atendimento', 'Aguardando resposta', 'Resolvido', 'Encerrado'];
  const cats = ['Financeiro', 'Operacional', 'Cardápio', 'Atraso na Entrega', 'Cancelamento', 'Taxas'];

  initialSupportTickets.push({
    id: `tkt-${t}`,
    code: `#TK-${1000 + t}`,
    requesterName: `Usuário Chamado ${t}`,
    requesterEmail: `usuario${t}@suporte.com.br`,
    requesterType: reqTypes[t % reqTypes.length],
    subject: `Solicitação de suporte sobre ${cats[t % cats.length]} #${t}`,
    category: cats[t % cats.length],
    createdAt: new Date(2026, 10, 16 - (t % 15), 10, 30).toISOString(),
    assignedTo: t % 2 === 0 ? 'Camila Torres' : 'Lucas Pinho',
    priority: priorities[t % priorities.length],
    status: statuses[t % statuses.length],
    messages: [
      {
        id: `m-${t}-1`,
        sender: `Usuário Chamado ${t}`,
        isStaff: false,
        timestamp: new Date(2026, 10, 16 - (t % 15), 10, 30).toISOString(),
        text: `Olá, preciso de auxílio para resolver uma pendência relacionada a ${cats[t % cats.length]}.`,
      },
      {
        id: `m-${t}-2`,
        sender: 'Suporte Oba Comida',
        isStaff: true,
        timestamp: new Date(2026, 10, 16 - (t % 15), 11, 0).toISOString(),
        text: 'Sua solicitação está sendo tratada por nossos especialistas.',
      },
    ],
  });
}

// Generate 100 Audit Logs
export const generateAuditLogs = (): AuditLog[] => {
  const logs: AuditLog[] = [];
  const actions = [
    { mod: 'Restaurantes', act: 'Aprovação de cadastro', det: 'Restaurante aprovado para iniciar operações na plataforma.' },
    { mod: 'Restaurantes', act: 'Alteração de taxa de comissão', det: 'Comissão reduzida promocionalmente para 10%.' },
    { mod: 'Restaurantes', act: 'Suspensão de estabelecimento', det: 'Estabelecimento suspenso preventivamente por reincidência de atrasos.' },
    { mod: 'Pedidos', act: 'Cancelamento administrativo de pedido', det: 'Pedido cancelado por intervenção manual do operador.' },
    { mod: 'Pedidos', act: 'Estorno concedido ao cliente', det: 'Reembolso no valor integral lançado após não entrega.' },
    { mod: 'Financeiro', act: 'Aprovação de lote de repasse', det: 'Lote semanal de repasses PIX liberado para os parceiros.' },
    { mod: 'Promoções', act: 'Criação de cupom promocional', det: 'Novo cupom com limite de 500 utilizações configurado.' },
    { mod: 'Categorias', act: 'Reordenação de categorias na home', det: 'Categoria Hamburguerias movida para posição #1.' },
    { mod: 'Produtos', act: 'Moderação de produto', det: 'Item reprovado por qualidade baixa da imagem de capa.' },
    { mod: 'Configurações', act: 'Atualização das regras da plataforma', det: 'Taxa fixa padrão alterada de R$ 1,20 para R$ 1,50.' },
  ];

  const adminNames = ['Carlos Albuquerque', 'Mariana Duarte', 'Rodrigo Vasconcelos', 'Beatriz Fonseca', 'Camila Torres'];

  for (let a = 1; a <= 100; a++) {
    const act = actions[(a - 1) % actions.length];
    const admin = adminNames[a % adminNames.length];
    const date = new Date(2026, 10, 16 - Math.floor(a / 4), 18 - (a % 10), 10 + (a % 45)).toISOString();

    logs.push({
      id: `aud-${a}`,
      adminId: `usr-${(a % 5) + 1}`,
      adminName: admin,
      adminRole: a % 3 === 0 ? 'superadmin' : (a % 2 === 0 ? 'admin' : 'operator'),
      action: act.act,
      module: act.mod,
      timestamp: date,
      entityId: `ENT-${1000 + a}`,
      details: `${act.det} (Ref: #${1000 + a})`,
      previousValue: a % 2 === 0 ? 'Status: Pendente / Valor: R$ 0,00' : undefined,
      currentValue: a % 2 === 0 ? 'Status: Aprovado / Valor: R$ 100,00' : undefined,
    });
  }
  return logs;
};

export const initialAuditLogs = generateAuditLogs();
