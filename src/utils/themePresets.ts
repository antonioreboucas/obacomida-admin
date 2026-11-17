import type { StoreTheme } from '../types';

export interface ThemePreset {
  key: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  suggestedCategories: string[];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'acai',
    name: 'Açaí & Gelatos',
    description: 'Roxo açaí amazônico com magenta vibrante e toques tropicais',
    primaryColor: '#7B1FA2',
    secondaryColor: '#C2185B',
    suggestedCategories: ['Açaí', 'Sobremesas & Gelatos'],
  },
  {
    key: 'hamburgueria',
    name: 'Hamburgueria Artesanal',
    description: 'Laranja brasa quente com vermelho rústico e tons tostados',
    primaryColor: '#EA580C',
    secondaryColor: '#B91C1C',
    suggestedCategories: ['Hamburguerias', 'Lanches Rápidos', 'Frango Frito'],
  },
  {
    key: 'luxo',
    name: 'Restaurante Luxuoso / Alta Gastronomia',
    description: 'Ouro nobre sofisticado com preto ébano e estética premium',
    primaryColor: '#B45309',
    secondaryColor: '#1E293B',
    suggestedCategories: ['Restaurantes', 'Italiana'],
  },
  {
    key: 'pizzaria',
    name: 'Pizzaria & Forneria',
    description: 'Vermelho tomate italiano clássico com verde manjericão fresco',
    primaryColor: '#DC2626',
    secondaryColor: '#15803D',
    suggestedCategories: ['Pizzarias', 'Italiana'],
  },
  {
    key: 'japonesa',
    name: 'Japonesa & Oriental',
    description: 'Vermelho carmim tradicional oriental contrastando com preto profundo',
    primaryColor: '#E11D48',
    secondaryColor: '#0F172A',
    suggestedCategories: ['Japonesa'],
  },
  {
    key: 'saudavel',
    name: 'Saudável & Vegano',
    description: 'Verde folha fresco revigorante e tons orgânicos naturais',
    primaryColor: '#16A34A',
    secondaryColor: '#65A30D',
    suggestedCategories: ['Saudável & Fit', 'Vegetariana & Vegana'],
  },
  {
    key: 'doceria',
    name: 'Doceria & Confeitaria',
    description: 'Rosa doce pastel delicado com toques de calda e morango',
    primaryColor: '#DB2777',
    secondaryColor: '#F472B6',
    suggestedCategories: ['Doces & Bolos', 'Sobremesas & Gelatos'],
  },
  {
    key: 'cafeteria',
    name: 'Cafeteria & Padaria',
    description: 'Marrom café espresso torrado com âmbar caramelo quente',
    primaryColor: '#78350F',
    secondaryColor: '#D97706',
    suggestedCategories: ['Cafeterias', 'Padarias'],
  },
  {
    key: 'churrascaria',
    name: 'Churrascaria & Carnes',
    description: 'Vermelho fogo e braseiro com tonalidades de madeira nobre',
    primaryColor: '#991B1B',
    secondaryColor: '#451A03',
    suggestedCategories: ['Restaurantes', 'Marmitas & PFs'],
  },
  {
    key: 'padrao',
    name: 'Padrão Oba Comida (Delivery)',
    description: 'Laranja vibrante oficial com vermelho de alta energia',
    primaryColor: '#FF6600',
    secondaryColor: '#E63946',
    suggestedCategories: [],
  },
];

export const getDefaultThemeForCategory = (categoryName: string): StoreTheme => {
  const match = THEME_PRESETS.find((p) =>
    p.suggestedCategories.some((cat) => cat.toLowerCase() === categoryName.toLowerCase())
  );

  if (match) {
    return {
      primaryColor: match.primaryColor,
      secondaryColor: match.secondaryColor,
      presetKey: match.key,
    };
  }

  return {
    primaryColor: '#FF6600',
    secondaryColor: '#E63946',
    presetKey: 'padrao',
  };
};
