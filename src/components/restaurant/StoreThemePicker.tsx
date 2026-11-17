import React, { useState, useEffect } from 'react';
import { THEME_PRESETS, type ThemePreset } from '../../utils/themePresets';
import type { StoreTheme } from '../../types';
import { Palette, Sparkles, Smartphone, Check, ShoppingBag, Star, Heart } from 'lucide-react';

interface StoreThemePickerProps {
  theme: StoreTheme;
  onChange: (theme: StoreTheme) => void;
  restaurantName?: string;
  categoryName?: string;
  logoUrl?: string;
}

export const StoreThemePicker: React.FC<StoreThemePickerProps> = ({
  theme,
  onChange,
  restaurantName = 'Nome da Loja',
  categoryName = 'Gastronomia',
  logoUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(theme.presetKey || 'padrao');
  const [showCustom, setShowCustom] = useState<boolean>(theme.presetKey === 'custom');

  useEffect(() => {
    setSelectedPreset(theme.presetKey || 'padrao');
    setShowCustom(theme.presetKey === 'custom');
  }, [theme.presetKey]);

  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedPreset(preset.key);
    setShowCustom(false);
    onChange({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      presetKey: preset.key,
    });
  };

  const handleCustomPrimary = (color: string) => {
    setSelectedPreset('custom');
    setShowCustom(true);
    onChange({
      ...theme,
      primaryColor: color,
      presetKey: 'custom',
    });
  };

  const handleCustomSecondary = (color: string) => {
    setSelectedPreset('custom');
    setShowCustom(true);
    onChange({
      ...theme,
      secondaryColor: color,
      presetKey: 'custom',
    });
  };

  return (
    <div className="space-y-6">
      {/* Introduction text */}
      <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <p className="font-bold text-slate-900">Personalização Visual da Loja (Multi-Tenant Theme)</p>
          <p className="mt-0.5 leading-relaxed text-slate-600">
            Defina o tema visual da loja no aplicativo. As cores primária e secundária estilizam o cabeçalho,
            botões de compra, badges de destaque e a experiência visual do consumidor no app.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Preset Selection & Color Pickers (Left / 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-orange-600" />
              Escolha um Template de Tema:
            </label>
            <button
              type="button"
              onClick={() => {
                setShowCustom(!showCustom);
                if (!showCustom) setSelectedPreset('custom');
              }}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              {showCustom ? 'Ver templates pré-definidos' : 'Personalizar cores livres'}
            </button>
          </div>

          {/* Preset list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {THEME_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.key && !showCustom;
              return (
                <div
                  key={preset.key}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">{preset.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center -space-x-1">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                        style={{ backgroundColor: preset.primaryColor }}
                        title={`Cor Primária: ${preset.primaryColor}`}
                      />
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                        style={{ backgroundColor: preset.secondaryColor }}
                        title={`Cor Secundária: ${preset.secondaryColor}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {preset.primaryColor} • {preset.secondaryColor}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</p>
                </div>
              );
            })}
          </div>

          {/* Custom Color Pickers */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Ajuste Fino de Cores (Hexadecimal):
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cor Primária (Ações & Banner)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleCustomPrimary(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleCustomPrimary(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cor Secundária (Destaques & Badges)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleCustomSecondary(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => handleCustomSecondary(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Mockup App Preview (Right / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3">
            <Smartphone className="w-4 h-4 text-orange-600" />
            <span>Simulador da Vitrine no App do Cliente</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-72 bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 text-slate-800 select-none">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

            {/* Inner Phone Screen */}
            <div className="bg-slate-50 rounded-[24px] overflow-hidden flex flex-col h-[450px] relative text-left">
              {/* Dynamic Header with Restaurant Primary Gradient */}
              <div
                className="p-4 text-white relative transition-colors duration-300"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                    Vitrine da Loja
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={logoUrl}
                    alt={restaurantName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/70 shadow-md shrink-0 bg-white"
                  />
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-sm text-white leading-tight truncate">
                      {restaurantName}
                    </h5>
                    <p className="text-[10px] text-white/80 mt-0.5 truncate">{categoryName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center text-[10px] font-bold bg-white text-slate-900 px-1.5 py-0.2 rounded">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" /> 4.9
                      </span>
                      <span className="text-[9px] text-white/90">25-35 min • R$ 6,90</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storefront Body */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 text-xs bg-slate-50">
                {/* Promo Badge with secondary color */}
                <div
                  className="px-2.5 py-1.5 rounded-xl text-white text-[10px] font-bold flex items-center justify-between shadow-xs transition-colors duration-300"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  <span>🔥 Promoção de Hoje</span>
                  <span>15% OFF no combo</span>
                </div>

                {/* Product Card Example */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-xs">Especial da Casa #1</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        Preparado artesanalmente com receita exclusiva e ingredientes selecionados.
                      </p>
                      <span
                        className="font-extrabold text-xs block mt-1 transition-colors duration-300"
                        style={{ color: theme.primaryColor }}
                      >
                        R$ 38,90
                      </span>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80"
                      alt="Prato"
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                  </div>

                  {/* Add Button styled with primary color */}
                  <button
                    type="button"
                    className="w-full py-1.5 rounded-lg text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1 transition-colors duration-300"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Adicionar à Sacola</span>
                  </button>
                </div>

                {/* Secondary Product Example */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-xs">Acompanhamento Premium</p>
                    <span
                      className="font-extrabold text-xs block mt-1 transition-colors duration-300"
                      style={{ color: theme.primaryColor }}
                    >
                      R$ 18,00
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 h-fit my-auto rounded-lg text-white font-bold text-[10px] transition-colors duration-300"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Bottom Navigation styled with brand accents */}
              <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400">Total: <strong>R$ 38,90</strong></span>
                <span
                  className="px-3 py-1.5 rounded-lg text-white font-bold transition-colors duration-300"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Ver Sacola (1)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
