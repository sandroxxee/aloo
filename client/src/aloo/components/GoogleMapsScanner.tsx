import { maskContact } from '../utils/textProcessor';
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../types';
import { LeafletScannerMap } from './LeafletScannerMap';
import {
  executeProximityContactSearch
} from '../utils/searchEngines';
import {
  MapPin,
  Search,
  Filter,
  Play,
  RotateCw,
  Download,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  Globe,
  Star,
  Zap,
  Sparkles,
  Layers,
  Compass,
  Plus,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  BadgeCheck,
  Map as MapIcon,
  Navigation,
  Fuel,
  Truck,
  Wrench,
  Store,
  Briefcase,
  Bot,
  Pause,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Network
} from 'lucide-react';

interface GoogleMapsScannerProps {
  onSaveLead: (lead: Partial<Lead>) => void;
  onSaveMultipleLeads: (leads: Partial<Lead>[]) => void;
  onAddLog: (log: any) => void;
  existingLeads: Lead[];
}

export interface ScannedBusiness {
  id: string;
  name: string;
  category: string;
  categoryType: 'posto' | 'transportadora' | 'pecas' | 'concessionaria' | 'industria' | 'comercio' | 'outro';
  address: string;
  city: string;
  stateUf: string;
  phone: string;
  rawPhone: string;
  phoneType: 'Celular' | 'Fixo';
  email?: string;
  website?: string;
  rating: number;
  userRatingsTotal: number;
  openNow: boolean;
  lat: number;
  lng: number;
  formattedOpeningHours?: string;
  distributor?: string;
  niche?: string;
  saved: boolean;
}

export const BRAZIL_STATES_AND_CITIES: Record<string, { stateName: string; cities: { name: string; lat: number; lng: number }[] }> = {
  'SP': {
    stateName: 'São Paulo (SP)',
    cities: [
      { name: 'São Paulo, SP', lat: -23.5505, lng: -46.6333 },
      { name: 'Campinas, SP', lat: -22.9099, lng: -47.0626 },
      { name: 'Guarulhos, SP', lat: -23.4628, lng: -46.5333 },
      { name: 'São Bernardo do Campo, SP', lat: -23.6939, lng: -46.5650 },
      { name: 'Santo André, SP', lat: -23.6639, lng: -46.5383 },
      { name: 'Osasco, SP', lat: -23.5325, lng: -46.7917 },
      { name: 'São José dos Campos, SP', lat: -23.1894, lng: -45.8842 },
      { name: 'Ribeirão Preto, SP', lat: -21.1704, lng: -47.8103 },
      { name: 'Sorocaba, SP', lat: -23.5015, lng: -47.4581 },
      { name: 'Santos, SP', lat: -23.9608, lng: -46.3339 },
      { name: 'Bauru, SP', lat: -22.3147, lng: -49.0586 },
      { name: 'São José do Rio Preto, SP', lat: -20.8114, lng: -49.3758 },
      { name: 'Piracicaba, SP', lat: -22.7253, lng: -47.6492 },
      { name: 'Jundiaí, SP', lat: -23.1857, lng: -46.8892 },
      { name: 'Franca, SP', lat: -20.5386, lng: -47.4008 },
      { name: 'Presidente Prudente, SP', lat: -22.1256, lng: -51.3889 },
      { name: 'Araraquara, SP', lat: -21.7944, lng: -48.1756 },
      { name: 'Limeira, SP', lat: -22.5647, lng: -47.4017 },
      { name: 'Americana, SP', lat: -22.7392, lng: -47.3314 },
      { name: 'Taubaté, SP', lat: -23.0264, lng: -45.5558 }
    ]
  },
  'RJ': {
    stateName: 'Rio de Janeiro (RJ)',
    cities: [
      { name: 'Rio de Janeiro, RJ', lat: -22.9068, lng: -43.1729 },
      { name: 'Niterói, RJ', lat: -22.8833, lng: -43.1036 },
      { name: 'Duque de Caxias, RJ', lat: -22.7856, lng: -43.3117 },
      { name: 'Nova Iguaçu, RJ', lat: -22.7592, lng: -43.4511 },
      { name: 'Campos dos Goytacazes, RJ', lat: -21.7542, lng: -41.3244 },
      { name: 'Petrópolis, RJ', lat: -22.5050, lng: -43.1789 },
      { name: 'Volta Redonda, RJ', lat: -22.5228, lng: -44.1042 },
      { name: 'Macaé, RJ', lat: -22.3708, lng: -41.7869 },
      { name: 'Cabo Frio, RJ', lat: -22.8789, lng: -42.0186 },
      { name: 'Resende, RJ', lat: -22.4689, lng: -44.4489 }
    ]
  },
  'MG': {
    stateName: 'Minas Gerais (MG)',
    cities: [
      { name: 'Belo Horizonte, MG', lat: -19.9167, lng: -43.9345 },
      { name: 'Uberlândia, MG', lat: -18.9186, lng: -48.2772 },
      { name: 'Contagem, MG', lat: -19.9317, lng: -44.0536 },
      { name: 'Juiz de Fora, MG', lat: -21.7642, lng: -43.3497 },
      { name: 'Betim, MG', lat: -19.9678, lng: -44.1981 },
      { name: 'Montes Claros, MG', lat: -16.7281, lng: -43.8578 },
      { name: 'Uberaba, MG', lat: -19.7483, lng: -47.9319 },
      { name: 'Governador Valadares, MG', lat: -17.8575, lng: -42.1656 },
      { name: 'Ipatinga, MG', lat: -19.4689, lng: -42.5369 },
      { name: 'Sete Lagoas, MG', lat: -19.4664, lng: -44.2467 },
      { name: 'Divinópolis, MG', lat: -20.1436, lng: -44.8919 },
      { name: 'Poços de Caldas, MG', lat: -21.7878, lng: -46.5614 },
      { name: 'Pouso Alegre, MG', lat: -22.2300, lng: -45.9364 },
      { name: 'Varginha, MG', lat: -21.5558, lng: -45.4308 }
    ]
  },
  'PR': {
    stateName: 'Paraná (PR)',
    cities: [
      { name: 'Curitiba, PR', lat: -25.4284, lng: -49.2733 },
      { name: 'Londrina, PR', lat: -23.3045, lng: -51.1696 },
      { name: 'Maringá, PR', lat: -23.4205, lng: -51.9333 },
      { name: 'Ponta Grossa, PR', lat: -25.0950, lng: -50.1619 },
      { name: 'Cascavel, PR', lat: -24.9558, lng: -53.4553 },
      { name: 'Foz do Iguaçu, PR', lat: -25.5478, lng: -54.5881 },
      { name: 'São José dos Pinhais, PR', lat: -25.5342, lng: -49.2064 },
      { name: 'Guarapuava, PR', lat: -25.3906, lng: -51.4628 },
      { name: 'Paranaguá, PR', lat: -25.5206, lng: -48.5092 },
      { name: 'Toledo, PR', lat: -24.7136, lng: -53.7431 },
      { name: 'Arapongas, PR', lat: -23.4147, lng: -51.4247 },
      { name: 'Umuarama, PR', lat: -23.7661, lng: -53.3250 }
    ]
  },
  'RS': {
    stateName: 'Rio Grande do Sul (RS)',
    cities: [
      { name: 'Porto Alegre, RS', lat: -30.0346, lng: -51.2177 },
      { name: 'Caxias do Sul, RS', lat: -29.1681, lng: -51.1794 },
      { name: 'Pelotas, RS', lat: -31.7654, lng: -52.3376 },
      { name: 'Canoas, RS', lat: -29.9178, lng: -51.1836 },
      { name: 'Santa Maria, RS', lat: -29.6842, lng: -53.8069 },
      { name: 'Gravataí, RS', lat: -29.9439, lng: -50.9922 },
      { name: 'Novo Hamburgo, RS', lat: -29.6783, lng: -51.1308 },
      { name: 'Passo Fundo, RS', lat: -28.2628, lng: -52.4092 },
      { name: 'Rio Grande, RS', lat: -32.0350, lng: -52.0986 },
      { name: 'Bento Gonçalves, RS', lat: -29.1717, lng: -51.5186 },
      { name: 'Erechim, RS', lat: -27.6342, lng: -52.2739 }
    ]
  },
  'SC': {
    stateName: 'Santa Catarina (SC)',
    cities: [
      { name: 'Florianópolis, SC', lat: -27.5954, lng: -48.5480 },
      { name: 'Joinville, SC', lat: -26.3044, lng: -48.8464 },
      { name: 'Blumenau, SC', lat: -26.9194, lng: -49.0661 },
      { name: 'Chapecó, SC', lat: -27.1006, lng: -52.6153 },
      { name: 'Criciúma, SC', lat: -28.6775, lng: -49.3703 },
      { name: 'Itajaí, SC', lat: -26.9083, lng: -48.6622 },
      { name: 'Jaraguá do Sul, SC', lat: -26.4853, lng: -49.0808 },
      { name: 'Lages, SC', lat: -27.8161, lng: -50.3261 },
      { name: 'Balneário Camboriú, SC', lat: -26.9928, lng: -48.6347 },
      { name: 'Brusque, SC', lat: -27.0978, lng: -48.9103 },
      { name: 'Tubarão, SC', lat: -28.4742, lng: -49.0069 }
    ]
  },
  'BA': {
    stateName: 'Bahia (BA)',
    cities: [
      { name: 'Salvador, BA', lat: -12.9777, lng: -38.5016 },
      { name: 'Feira de Santana, BA', lat: -12.2667, lng: -38.9667 },
      { name: 'Vitória da Conquista, BA', lat: -14.8661, lng: -40.8386 },
      { name: 'Camaçari, BA', lat: -12.6975, lng: -38.3242 },
      { name: 'Juazeiro, BA', lat: -9.4128, lng: -40.5033 },
      { name: 'Itabuna, BA', lat: -14.7856, lng: -39.2800 },
      { name: 'Ilhéus, BA', lat: -14.7889, lng: -39.0494 },
      { name: 'Barreiras, BA', lat: -12.1528, lng: -44.9900 },
      { name: 'Lauro de Freitas, BA', lat: -12.8944, lng: -38.3272 },
      { name: 'Jequié, BA', lat: -13.8572, lng: -40.0839 },
      { name: 'Luís Eduardo Magalhães, BA', lat: -12.0961, lng: -45.7956 }
    ]
  },
  'PE': {
    stateName: 'Pernambuco (PE)',
    cities: [
      { name: 'Recife, PE', lat: -8.0476, lng: -34.8770 },
      { name: 'Jaboatão dos Guararapes, PE', lat: -8.1131, lng: -35.0150 },
      { name: 'Olinda, PE', lat: -8.0089, lng: -34.8553 },
      { name: 'Caruaru, PE', lat: -8.2839, lng: -35.9761 },
      { name: 'Petrolina, PE', lat: -9.3889, lng: -40.5028 },
      { name: 'Paulista, PE', lat: -7.9408, lng: -34.8728 },
      { name: 'Cabo de Santo Agostinho, PE', lat: -8.2861, lng: -35.0350 },
      { name: 'Vitória de Santo Antão, PE', lat: -8.1189, lng: -35.2936 },
      { name: 'Garanhuns, PE', lat: -8.8906, lng: -36.4928 }
    ]
  },
  'CE': {
    stateName: 'Ceará (CE)',
    cities: [
      { name: 'Fortaleza, CE', lat: -3.7319, lng: -38.5267 },
      { name: 'Caucaia, CE', lat: -3.7361, lng: -38.6531 },
      { name: 'Juazeiro do Norte, CE', lat: -7.2131, lng: -39.3150 },
      { name: 'Maracanaú, CE', lat: -3.8767, lng: -38.6256 },
      { name: 'Sobral, CE', lat: -3.6861, lng: -40.3497 },
      { name: 'Crato, CE', lat: -7.2344, lng: -39.4092 },
      { name: 'Itapipoca, CE', lat: -3.4944, lng: -39.5786 },
      { name: 'Maranguape, CE', lat: -3.8911, lng: -38.6858 }
    ]
  },
  'GO': {
    stateName: 'Goiás (GO)',
    cities: [
      { name: 'Goiânia, GO', lat: -16.6869, lng: -49.2648 },
      { name: 'Aparecida de Goiânia, GO', lat: -16.8228, lng: -49.2464 },
      { name: 'Anápolis, GO', lat: -16.3267, lng: -48.9528 },
      { name: 'Rio Verde, GO', lat: -17.7928, lng: -50.9192 },
      { name: 'Luziânia, GO', lat: -16.2525, lng: -47.9500 },
      { name: 'Águas Lindas de Goiás, GO', lat: -15.7622, lng: -48.2814 },
      { name: 'Valparaíso de Goiás, GO', lat: -16.0678, lng: -47.9753 },
      { name: 'Itumbiara, GO', lat: -18.4192, lng: -49.2153 },
      { name: 'Catalão, GO', lat: -18.1658, lng: -47.9464 },
      { name: 'Jataí, GO', lat: -17.8814, lng: -51.7144 }
    ]
  },
  'DF': {
    stateName: 'Distrito Federal (DF)',
    cities: [
      { name: 'Brasília, DF', lat: -15.7975, lng: -47.8919 },
      { name: 'Taguatinga, DF', lat: -15.8333, lng: -48.0500 },
      { name: 'Ceilândia, DF', lat: -15.8167, lng: -48.1167 },
      { name: 'Samambaia, DF', lat: -15.8778, lng: -48.0833 },
      { name: 'Gama, DF', lat: -16.0167, lng: -48.0667 },
      { name: 'Planaltina, DF', lat: -15.6167, lng: -47.6500 }
    ]
  },
  'MT': {
    stateName: 'Mato Grosso (MT)',
    cities: [
      { name: 'Cuiabá, MT', lat: -15.6010, lng: -56.0979 },
      { name: 'Várzea Grande, MT', lat: -15.6467, lng: -56.1325 },
      { name: 'Rondonópolis, MT', lat: -16.4674, lng: -54.6373 },
      { name: 'Sinop, MT', lat: -11.8642, lng: -55.5025 },
      { name: 'Tangará da Serra, MT', lat: -14.6228, lng: -57.4889 },
      { name: 'Sorriso, MT', lat: -12.5425, lng: -55.7111 },
      { name: 'Primavera do Leste, MT', lat: -15.5561, lng: -54.2961 },
      { name: 'Lucas do Rio Verde, MT', lat: -13.0500, lng: -55.9100 },
      { name: 'Barra do Garças, MT', lat: -15.8900, lng: -52.2567 }
    ]
  },
  'MS': {
    stateName: 'Mato Grosso do Sul (MS)',
    cities: [
      { name: 'Campo Grande, MS', lat: -20.4697, lng: -54.6201 },
      { name: 'Dourados, MS', lat: -22.2211, lng: -54.8056 },
      { name: 'Três Lagoas, MS', lat: -20.7847, lng: -51.7008 },
      { name: 'Corumbá, MS', lat: -19.0089, lng: -57.6528 },
      { name: 'Ponta Porã, MS', lat: -22.5361, lng: -55.7256 },
      { name: 'Naviraí, MS', lat: -23.0642, lng: -54.1925 },
      { name: 'Nova Andradina, MS', lat: -22.2397, lng: -53.3425 }
    ]
  },
  'PA': {
    stateName: 'Pará (PA)',
    cities: [
      { name: 'Belém, PA', lat: -1.4558, lng: -48.4902 },
      { name: 'Ananindeua, PA', lat: -1.3656, lng: -48.3722 },
      { name: 'Santarém, PA', lat: -2.4431, lng: -54.7083 },
      { name: 'Marabá, PA', lat: -5.3686, lng: -49.1178 },
      { name: 'Parauapebas, PA', lat: -6.0681, lng: -49.9014 },
      { name: 'Castanhal, PA', lat: -1.2978, lng: -47.9256 },
      { name: 'Abaetetuba, PA', lat: -1.7231, lng: -48.8786 }
    ]
  },
  'MA': {
    stateName: 'Maranhão (MA)',
    cities: [
      { name: 'São Luís, MA', lat: -2.5307, lng: -44.3068 },
      { name: 'Imperatriz, MA', lat: -5.5264, lng: -47.4764 },
      { name: 'São José de Ribamar, MA', lat: -2.5619, lng: -44.0542 },
      { name: 'Timon, MA', lat: -5.0936, lng: -42.8361 },
      { name: 'Caxias, MA', lat: -4.8589, lng: -43.3558 },
      { name: 'Codó, MA', lat: -4.4553, lng: -43.8864 }
    ]
  },
  'PB': {
    stateName: 'Paraíba (PB)',
    cities: [
      { name: 'João Pessoa, PB', lat: -7.1195, lng: -34.8450 },
      { name: 'Campina Grande, PB', lat: -7.2242, lng: -35.8833 },
      { name: 'Santa Rita, PB', lat: -7.1139, lng: -34.9781 },
      { name: 'Patos, PB', lat: -7.0264, lng: -37.2800 },
      { name: 'Bayeux, PB', lat: -7.1250, lng: -34.9322 },
      { name: 'Sousa, PB', lat: -6.7611, lng: -38.2289 }
    ]
  },
  'RN': {
    stateName: 'Rio Grande do Norte (RN)',
    cities: [
      { name: 'Natal, RN', lat: -5.7945, lng: -35.2110 },
      { name: 'Mossoró, RN', lat: -5.1889, lng: -37.3442 },
      { name: 'Parnamirim, RN', lat: -5.9156, lng: -35.2628 },
      { name: 'São Gonçalo do Amarante, RN', lat: -5.7931, lng: -35.3289 },
      { name: 'Ceará-Mirim, RN', lat: -5.6339, lng: -35.4258 }
    ]
  },
  'AL': {
    stateName: 'Alagoas (AL)',
    cities: [
      { name: 'Maceió, AL', lat: -9.6658, lng: -35.7353 },
      { name: 'Arapiraca, AL', lat: -9.7522, lng: -36.6608 },
      { name: 'Rio Largo, AL', lat: -9.4792, lng: -35.8528 },
      { name: 'Palmeira dos Índios, AL', lat: -9.4089, lng: -36.6322 }
    ]
  },
  'SE': {
    stateName: 'Sergipe (SE)',
    cities: [
      { name: 'Aracaju, SE', lat: -10.9111, lng: -37.0717 },
      { name: 'Nossa Senhora do Socorro, SE', lat: -10.8542, lng: -37.1264 },
      { name: 'Lagarto, SE', lat: -10.9169, lng: -37.6500 },
      { name: 'Itabaiana, SE', lat: -10.6850, lng: -37.4250 }
    ]
  },
  'PI': {
    stateName: 'Piauí (PI)',
    cities: [
      { name: 'Teresina, PI', lat: -5.0892, lng: -42.8019 },
      { name: 'Parnaíba, PI', lat: -2.9050, lng: -41.7767 },
      { name: 'Picos, PI', lat: -7.0769, lng: -41.4669 },
      { name: 'Piripiri, PI', lat: -4.2722, lng: -41.7769 },
      { name: 'Floriano, PI', lat: -6.7669, lng: -43.0225 }
    ]
  },
  'AM': {
    stateName: 'Amazonas (AM)',
    cities: [
      { name: 'Manaus, AM', lat: -3.1190, lng: -60.0217 },
      { name: 'Parintins, AM', lat: -2.6283, lng: -56.7358 },
      { name: 'Itacoatiara, AM', lat: -3.1431, lng: -58.4442 },
      { name: 'Manacapuru, AM', lat: -3.2997, lng: -60.6208 },
      { name: 'Coari, AM', lat: -4.0850, lng: -63.1414 }
    ]
  },
  'RO': {
    stateName: 'Rondônia (RO)',
    cities: [
      { name: 'Porto Velho, RO', lat: -8.7619, lng: -63.9039 },
      { name: 'Ji-Paraná, RO', lat: -10.8828, lng: -61.9519 },
      { name: 'Ariquemes, RO', lat: -9.9133, lng: -63.0408 },
      { name: 'Vilhena, RO', lat: -12.7406, lng: -60.1458 },
      { name: 'Cacoal, RO', lat: -11.4386, lng: -61.4472 }
    ]
  },
  'AC': {
    stateName: 'Acre (AC)',
    cities: [
      { name: 'Rio Branco, AC', lat: -9.9747, lng: -67.8100 },
      { name: 'Cruzeiro do Sul, AC', lat: -7.6306, lng: -72.6700 },
      { name: 'Sena Madureira, AC', lat: -9.0658, lng: -68.6569 }
    ]
  },
  'RR': {
    stateName: 'Roraima (RR)',
    cities: [
      { name: 'Boa Vista, RR', lat: 2.8235, lng: -60.6758 },
      { name: 'Rorainópolis, RR', lat: 0.9461, lng: -60.4072 }
    ]
  },
  'AP': {
    stateName: 'Amapá (AP)',
    cities: [
      { name: 'Macapá, AP', lat: 0.0347, lng: -51.0694 },
      { name: 'Santana, AP', lat: -0.0583, lng: -51.1817 },
      { name: 'Laranjal do Jari, AP', lat: -0.8419, lng: -52.5161 }
    ]
  },
  'TO': {
    stateName: 'Tocantins (TO)',
    cities: [
      { name: 'Palmas, TO', lat: -10.2491, lng: -48.3242 },
      { name: 'Araguaína, TO', lat: -7.1911, lng: -48.2072 },
      { name: 'Gurupi, TO', lat: -11.7292, lng: -49.0686 },
      { name: 'Porto Nacional, TO', lat: -10.7083, lng: -48.4172 }
    ]
  },
  'ES': {
    stateName: 'Espírito Santo (ES)',
    cities: [
      { name: 'Vitória, ES', lat: -20.3155, lng: -40.3128 },
      { name: 'Vila Velha, ES', lat: -20.3297, lng: -40.2925 },
      { name: 'Serra, ES', lat: -20.1286, lng: -40.3078 },
      { name: 'Cariacica, ES', lat: -20.2639, lng: -40.4200 },
      { name: 'Cachoeiro de Itapemirim, ES', lat: -20.8489, lng: -41.1128 },
      { name: 'Linhares, ES', lat: -19.3911, lng: -40.0722 },
      { name: 'Colatina, ES', lat: -19.5389, lng: -40.6300 },
      { name: 'São Mateus, ES', lat: -18.7161, lng: -39.8589 }
    ]
  }
};

export const ALL_BRAZIL_CITIES = Object.values(BRAZIL_STATES_AND_CITIES).flatMap(st => st.cities);

const PRESET_CITIES = ALL_BRAZIL_CITIES;

const CATEGORIES = [
  { id: 'all', label: 'Todas as Empresas Locais', icon: Building2 },
  { id: 'posto', label: 'Postos de Combustível & Conveniência', icon: Fuel },
  { id: 'transportadora', label: 'Transportadoras & Logística', icon: Truck },
  { id: 'pecas', label: 'Auto Peças & Oficinas Pesadas', icon: Wrench },
  { id: 'concessionaria', label: 'Concessionárias & Revendas', icon: Store },
  { id: 'industria', label: 'Indústrias & Distribuidoras', icon: Briefcase },
];

// Memoized Card Component for fast, scroll-optimized side-list rendering
const ScannedBusinessCard = React.memo(({
  b,
  isActive,
  onSelect,
  onSave
}: {
  b: ScannedBusiness;
  isActive: boolean;
  onSelect: (b: ScannedBusiness) => void;
  onSave: (b: ScannedBusiness) => void;
}) => {
  return (
    <div
      onClick={() => onSelect(b)}
      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
        isActive
          ? 'bg-blue-50/90 border-blue-500 shadow-2xs ring-1 ring-blue-400 font-semibold'
          : b.saved
          ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className=" text-xs text-slate-900 truncate">{b.name}</span>
          {b.saved && (
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          {b.distributor && (
            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs  truncate max-w-[130px]">
              {b.distributor}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <span className="font-mono font-bold text-slate-800">{maskContact(b.phone)}</span>
          <span className={`px-1.5 py-0.2 rounded text-xs font-bold ${
            b.phoneType === 'Celular' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {b.phoneType === 'Celular' ? 'WhatsApp' : 'Fixo'}
          </span>
          <span>•</span>
          <span className="truncate">{b.city}</span>
          {b.email && (
            <>
              <span>•</span>
              <span className="text-indigo-600 font-mono truncate max-w-[140px]">{maskContact(b.email)}</span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSave(b);
        }}
        disabled={b.saved}
        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
          b.saved
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
        }`}
        title={b.saved ? 'Lead já salvo' : 'Adicionar à base'}
      >
        {b.saved ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
});

export const GoogleMapsScanner: React.FC<GoogleMapsScannerProps> = ({
  onSaveLead,
  onSaveMultipleLeads,
  onAddLog,
  existingLeads
}) => {
  const [selectedStateUf, setSelectedStateUf] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);

  const currentCityList = React.useMemo(() => {
    if (selectedStateUf === 'ALL') return ALL_BRAZIL_CITIES;
    return BRAZIL_STATES_AND_CITIES[selectedStateUf]?.cities || ALL_BRAZIL_CITIES;
  }, [selectedStateUf]);
  const [customCityInput, setCustomCityInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scannedBusinesses, setScannedBusinesses] = useState<ScannedBusiness[]>([]);
  const [scanFeedback, setScanFeedback] = useState<{ kind: 'empty' | 'error'; message: string } | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<ScannedBusiness | null>(null);
  const [filterText, setFilterText] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'whatsapp' | 'email' | 'website'>('all');
  const [distributorFilter, setDistributorFilter] = useState<string>('all');
  const [mapViewStyle, setMapViewStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [soundAlert, setSoundAlert] = useState<boolean>(true);
  const [customMapCenter, setCustomMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Batch Extraction State (Extração em Lote Sequencial)
  const [isBatchScanning, setIsBatchScanning] = useState<boolean>(false);
  const [batchRadiusKm, setBatchRadiusKm] = useState<number>(30);
  const [batchPointsDensity, setBatchPointsDensity] = useState<number>(9);
  const [batchCurrentStep, setBatchCurrentStep] = useState<number>(0);
  const [batchTotalSteps, setBatchTotalSteps] = useState<number>(0);
  const [batchStepLabel, setBatchStepLabel] = useState<string>('');
  const [batchExtractedCount, setBatchExtractedCount] = useState<number>(0);
  const batchStopRequestedRef = useRef(false);

  // Autonomous Pilot State (Busca Autônoma Automática)
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(false);
  const [autoPilotCityIdx, setAutoPilotCityIdx] = useState<number>(0);
  const [autoPilotIntervalSec, setAutoPilotIntervalSec] = useState<number>(6);
  const [autoPilotAutoSave, setAutoPilotAutoSave] = useState<boolean>(true);
  const [autoPilotTotalMined, setAutoPilotTotalMined] = useState<number>(0);
  const [autoPilotCountdown, setAutoPilotCountdown] = useState<number>(0);

  // Category Separation Tab State (Separar Leads por Categoria)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  // Refs for timer closures in background loops
  const isAutoPilotRef = useRef(isAutoPilot);
  const autoPilotCityIdxRef = useRef(autoPilotCityIdx);
  const autoPilotAutoSaveRef = useRef(autoPilotAutoSave);
  const autoPilotIntervalSecRef = useRef(autoPilotIntervalSec);
  const autoPilotTimerRef = useRef<any>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => { isAutoPilotRef.current = isAutoPilot; }, [isAutoPilot]);
  useEffect(() => { autoPilotCityIdxRef.current = autoPilotCityIdx; }, [autoPilotCityIdx]);
  useEffect(() => { autoPilotAutoSaveRef.current = autoPilotAutoSave; }, [autoPilotAutoSave]);
  useEffect(() => { autoPilotIntervalSecRef.current = autoPilotIntervalSec; }, [autoPilotIntervalSec]);

  const existingPhoneSet = new Set(existingLeads.map(l => l.rawPhone.replace(/\D/g, '')));

  const mapRealContactToBusiness = (
    contact: any,
    index: number,
    targetCity: string,
    targetCategory: string,
    latitude: number,
    longitude: number,
  ): ScannedBusiness => {
    const rawPhone = (contact.rawPhone || contact.formattedPhone || '').replace(/\D/g, '');
    const [city = targetCity, stateUf = 'SP'] = targetCity.split(',').map((part: string) => part.trim());

    return {
      id: `real_prox_${Date.now()}_${index}`,
      name: contact.companyName || contact.sellerFullName || contact.name || 'Empresa não identificada',
      category: CATEGORIES.find(category => category.id === targetCategory)?.label || targetCategory,
      categoryType: (targetCategory === 'all' ? 'outro' : targetCategory) as any,
      address: contact.location || 'Localização não informada',
      city,
      stateUf,
      phone: contact.formattedPhone || contact.rawPhone || 'N/A',
      rawPhone,
      phoneType: contact.phoneType === 'Fixo' ? 'Fixo' : 'Celular',
      email: contact.email || undefined,
      website: contact.webPageUrl || undefined,
      rating: 0,
      userRatingsTotal: 0,
      openNow: false,
      lat: latitude,
      lng: longitude,
      niche: contact.item || undefined,
      distributor: undefined,
      saved: false,
    };
  };

  // Busca por proximidade com limites e backoff seguro, sem rotação de IP.
  const handleStartScan = async (
    targetCity = selectedCity.name,
    targetCategory = selectedCategory,
    targetRadius = radiusKm,
    overrideCenter?: { lat: number; lng: number }
  ) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(true);
    setScanProgress(10);
    setScannedBusinesses([]);
    setScanFeedback(null);
    setActiveBusiness(null);

    let currentLat = overrideCenter ? overrideCenter.lat : selectedCity.lat;
    let currentLng = overrideCenter ? overrideCenter.lng : selectedCity.lng;

    if (overrideCenter) {
      setCustomMapCenter(overrideCenter);
    } else {
      const foundPreset = PRESET_CITIES.find(c => c.name.toLowerCase() === targetCity.toLowerCase());
      if (foundPreset) {
        currentLat = foundPreset.lat;
        currentLng = foundPreset.lng;
      }
      setCustomMapCenter({ lat: currentLat, lng: currentLng });
    }

    onAddLog({
      id: `log_map_scan_start_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `🗺️ Busca por proximidade em "${targetCity}" (raio: ${targetRadius} km, categoria: ${targetCategory}) iniciada com limites seguros.`
    });

    setScanProgress(25);

    try {
      // Executa busca real de contatos por proximidade utilizando os motores disponíveis.
      const categoryObj = CATEGORIES.find(c => c.id === targetCategory);
      const catKeyword = categoryObj?.label || targetCategory;

      const proximityRes = await executeProximityContactSearch(
        targetCity,
        currentLat,
        currentLng,
        targetRadius,
        catKeyword
      );

      setScanProgress(75);

      const realContacts = proximityRes.contacts || [];
      const realBusinesses: ScannedBusiness[] = realContacts.map((c, idx) => {
        const rawP = (c.rawPhone || c.formattedPhone || '').replace(/\D/g, '');
        return {
          id: `real_prox_${Date.now()}_${idx}`,
          name: c.companyName || c.sellerFullName || c.name || 'Empresa não identificada',
          category: catKeyword,
          categoryType: (targetCategory === 'all' ? 'outro' : targetCategory) as any,
          address: c.location || 'Localização não informada',
          city: targetCity.split(',')[0].trim(),
          stateUf: targetCity.includes(',') ? targetCity.split(',')[1].trim() : 'SP',
          phone: c.formattedPhone || c.rawPhone || 'N/A',
          rawPhone: rawP,
          phoneType: c.phoneType === 'Fixo' ? 'Fixo' : 'Celular',
          email: c.email || undefined,
          website: c.webPageUrl || undefined,
          rating: 0,
          userRatingsTotal: 0,
          openNow: false,
          lat: currentLat,
          lng: currentLng,
          niche: c.item || undefined,
          distributor: undefined,
          saved: false
        };
      });

      const merged: ScannedBusiness[] = realBusinesses;

      setScannedBusinesses(merged);
      if (merged.length > 0) {
        setActiveBusiness(merged[0]);
      } else {
        setScanFeedback({
          kind: 'empty',
          message: 'Nenhum contato real foi encontrado com estes critérios. Ajuste a cidade, categoria ou raio e tente novamente.'
        });
      }

      setScanProgress(100);
      setIsScanning(false);

      // Auto Save leads se Piloto Automático ativado
      if (autoPilotAutoSaveRef.current && isAutoPilotRef.current) {
        const unsaved = merged.filter(b => !existingPhoneSet.has(b.rawPhone.replace(/\D/g, '')));
        if (unsaved.length > 0) {
          const leadsToAdd: Partial<Lead>[] = unsaved.map(biz => ({
            phone: biz.phone,
            rawPhone: biz.rawPhone,
            ddd: biz.phone.slice(1, 3) || '11',
            phoneType: biz.phoneType,
            email: biz.email,
            name: biz.name,
            companyName: biz.name,
            sellerFullName: biz.name,
            intent: 'Venda',
            item: `${biz.category} (${biz.distributor || 'Google Maps'})`,
            location: biz.address,
            city: biz.city,
            stateUf: biz.stateUf,
            query: `Radar Proximidade Google Maps: ${biz.city}`,
            source: 'Automático',
            sellerType: 'Lojista / Concessionária',
            webPageUrl: biz.website,
            isBusinessDirectory: true,
            snippetContext: `Empresa mapeada no Google Maps em ${biz.address}. Contato: ${biz.phone}. Avaliação: ${biz.rating}⭐.`,
            createdAt: new Date().toISOString()
          }));

          onSaveMultipleLeads(leadsToAdd);
          setScannedBusinesses(prev => prev.map(b => ({ ...b, saved: true })));
          setAutoPilotTotalMined(prev => prev + leadsToAdd.length);
        }
      }

      onAddLog({
        id: `log_map_scan_done_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `🎯 Busca por proximidade concluída: ${merged.length} contatos reais encontrados em "${targetCity}" (${targetRadius} km).`
      });

      // Se Piloto Automático estiver ATIVO, agende próxima cidade
      if (isAutoPilotRef.current) {
        const nextIdx = (autoPilotCityIdxRef.current + 1) % PRESET_CITIES.length;
        setAutoPilotCityIdx(nextIdx);
        const nextCity = PRESET_CITIES[nextIdx];
        setSelectedCity(nextCity);

        onAddLog({
          id: `log_auto_pilot_next_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'info',
          message: `🤖 [Piloto Automático] Cidade "${nextCity.name}" agendada em ${autoPilotIntervalSecRef.current}s...`
        });

        let countdown = autoPilotIntervalSecRef.current;
        setAutoPilotCountdown(countdown);

        if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);

        autoPilotTimerRef.current = setInterval(() => {
          countdown -= 1;
          setAutoPilotCountdown(countdown);
          if (countdown <= 0) {
            if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
            if (isAutoPilotRef.current) {
              handleStartScan(nextCity.name, selectedCategory, targetRadius);
            }
          }
        }, 1000);
      }

    } catch (err) {
      console.warn('Falha na busca por proximidade:', err);
      setScannedBusinesses([]);
      setScanFeedback({
        kind: 'error',
        message: 'Não foi possível consultar fontes externas agora. Aguarde alguns instantes antes de tentar novamente.'
      });
      setActiveBusiness(null);
      onAddLog({
        id: `log_map_scan_error_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'warning',
        message: 'Não foi possível concluir a busca por proximidade. Nenhum resultado foi adicionado à base.'
      });
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  const toggleAutoPilot = () => {
    if (isAutoPilot) {
      setIsAutoPilot(false);
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setIsScanning(false);
      setAutoPilotCountdown(0);
      onAddLog({
        id: `log_auto_pilot_pause_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'info',
        message: '🤖 [Piloto Automático] Busca Autônoma Pausada pelo usuário.'
      });
    } else {
      setIsAutoPilot(true);
      onAddLog({
        id: `log_auto_pilot_start_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `🤖 [Piloto Automático] INICIANDO MINERAÇÃO AUTÔNOMA AUTOMÁTICA! Varrendo as ${PRESET_CITIES.length} principais capitais do Brasil sem parar...`
      });
      const startCity = PRESET_CITIES[autoPilotCityIdx];
      setSelectedCity(startCity);
      handleStartScan(startCity.name, selectedCategory, radiusKm);
    }
  };

  const handleStopScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (autoPilotTimerRef.current) {
      clearInterval(autoPilotTimerRef.current);
      autoPilotTimerRef.current = null;
    }
    batchStopRequestedRef.current = true;
    setIsScanning(false);
    setIsAutoPilot(false);
    setIsBatchScanning(false);
    onAddLog({
      id: `log_map_scan_stop_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: '🛑 Varredura do Google Maps interrompida pelo usuário.'
    });
  };

  const handleStartBatchScan = async () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    batchStopRequestedRef.current = false;
    setIsBatchScanning(true);
    setIsScanning(true);
    setScanProgress(0);
    setScanFeedback(null);
    setScannedBusinesses([]);
    setActiveBusiness(null);

    const cityToUse = customCityInput.trim() || selectedCity.name;
    let baseLat = customMapCenter ? customMapCenter.lat : selectedCity.lat;
    let baseLng = customMapCenter ? customMapCenter.lng : selectedCity.lng;

    const foundPreset = PRESET_CITIES.find(city => city.name.toLowerCase() === cityToUse.toLowerCase());
    if (foundPreset) {
      baseLat = foundPreset.lat;
      baseLng = foundPreset.lng;
    }

    const kmPerDegree = 111;
    const radiusOffsetLat = (batchRadiusKm / kmPerDegree) * 0.45;
    const radiusOffsetLng = (batchRadiusKm / (kmPerDegree * Math.cos((baseLat * Math.PI) / 180))) * 0.45;
    const gridPoints: { name: string; lat: number; lng: number }[] = [
      { name: 'Centro Metropolitano & Entorno', lat: baseLat, lng: baseLng },
      { name: 'Setor Norte (Eixo Rodoviário N)', lat: baseLat + radiusOffsetLat, lng: baseLng },
      { name: 'Setor Sul (Anel Viário S)', lat: baseLat - radiusOffsetLat, lng: baseLng },
      { name: 'Setor Leste (Distrito Industrial E)', lat: baseLat, lng: baseLng + radiusOffsetLng },
      { name: 'Setor Oeste (Polo Logístico W)', lat: baseLat, lng: baseLng - radiusOffsetLng },
    ];

    if (batchPointsDensity >= 9) {
      gridPoints.push(
        { name: 'Quadrante Nordeste (NE)', lat: baseLat + radiusOffsetLat * 0.7, lng: baseLng + radiusOffsetLng * 0.7 },
        { name: 'Quadrante Sudeste (SE)', lat: baseLat - radiusOffsetLat * 0.7, lng: baseLng + radiusOffsetLng * 0.7 },
        { name: 'Quadrante Noroeste (NW)', lat: baseLat + radiusOffsetLat * 0.7, lng: baseLng - radiusOffsetLng * 0.7 },
        { name: 'Quadrante Sudoeste (SW)', lat: baseLat - radiusOffsetLat * 0.7, lng: baseLng - radiusOffsetLng * 0.7 },
      );
    }

    if (batchPointsDensity >= 16) {
      gridPoints.push(
        { name: 'Perímetro NNE (Rodovia Interstadual)', lat: baseLat + radiusOffsetLat * 1.2, lng: baseLng + radiusOffsetLng * 0.5 },
        { name: 'Perímetro ENE (Zona Conurbada E)', lat: baseLat + radiusOffsetLat * 0.5, lng: baseLng + radiusOffsetLng * 1.2 },
        { name: 'Perímetro ESE (Anel Metropolitano)', lat: baseLat - radiusOffsetLat * 0.5, lng: baseLng + radiusOffsetLng * 1.2 },
        { name: 'Perímetro SSE (Periferia Sul)', lat: baseLat - radiusOffsetLat * 1.2, lng: baseLng + radiusOffsetLng * 0.5 },
        { name: 'Perímetro SSW (Distrito Sul-Oeste)', lat: baseLat - radiusOffsetLat * 1.2, lng: baseLng - radiusOffsetLng * 0.5 },
        { name: 'Perímetro WSW (Eixo Logístico W)', lat: baseLat - radiusOffsetLat * 0.5, lng: baseLng - radiusOffsetLng * 1.2 },
        { name: 'Perímetro WNW (Polo Industrial NW)', lat: baseLat + radiusOffsetLat * 0.5, lng: baseLng - radiusOffsetLng * 1.2 },
      );
    }

    setBatchTotalSteps(gridPoints.length);
    setBatchCurrentStep(0);
    setBatchExtractedCount(0);
    onAddLog({
      id: `log_batch_scan_start_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `⚡ EXTRAÇÃO EM LOTE INICIADA: ${gridPoints.length} pontos em sequência controlada em "${cityToUse}" (Raio: ${batchRadiusKm}km, Categoria: ${selectedCategory})`,
    });

    let accumulatedResults: ScannedBusiness[] = [];
    const seenPhones = new Set<string>();
    let hadExternalFailure = false;

    for (let stepIndex = 0; stepIndex < gridPoints.length; stepIndex += 1) {
      if (batchStopRequestedRef.current) break;

      const point = gridPoints[stepIndex];
      setBatchCurrentStep(stepIndex + 1);
      setBatchStepLabel(point.name);
      setScanProgress(Math.round(((stepIndex + 1) / gridPoints.length) * 100));

      try {
        const category = CATEGORIES.find(item => item.id === selectedCategory);
        const response = await executeProximityContactSearch(
          cityToUse,
          point.lat,
          point.lng,
          batchRadiusKm,
          category?.label || selectedCategory,
        );

        (response.contacts || [])
          .map((contact, index) => mapRealContactToBusiness(contact, index, cityToUse, selectedCategory, point.lat, point.lng))
          .forEach(business => {
            const phone = business.rawPhone.replace(/\D/g, '');
            if (phone && !seenPhones.has(phone)) {
              seenPhones.add(phone);
              accumulatedResults.push(business);
            }
          });

        if (!batchStopRequestedRef.current) {
          setScannedBusinesses([...accumulatedResults]);
          setBatchExtractedCount(accumulatedResults.length);
          if (accumulatedResults.length > 0) {
            setActiveBusiness(current => current || accumulatedResults[0]);
          }
        }
      } catch (error) {
        hadExternalFailure = true;
        console.warn('Falha na consulta do ponto de lote:', error);
      }

      if (stepIndex < gridPoints.length - 1 && !batchStopRequestedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    const wasStopped = batchStopRequestedRef.current;
    setIsBatchScanning(false);
    setIsScanning(false);
    setScanProgress(100);

    if (!wasStopped && accumulatedResults.length === 0) {
      setScanFeedback({
        kind: hadExternalFailure ? 'error' : 'empty',
        message: hadExternalFailure
          ? 'Não foi possível consultar fontes externas em nenhum ponto do lote. Aguarde alguns instantes antes de tentar novamente.'
          : 'Nenhum contato real foi encontrado nos pontos consultados. Ajuste a cidade, categoria ou raio e tente novamente.',
      });
    }

    onAddLog({
      id: `log_batch_scan_done_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: wasStopped ? 'info' : 'success',
      message: wasStopped
        ? '🛑 Extração em lote interrompida pelo usuário.'
        : `✅ Extração em lote concluída: ${accumulatedResults.length} contatos reais e únicos em ${gridPoints.length} pontos de interesse.`,
    });
  };

  const handleStopBatchScan = () => {
    batchStopRequestedRef.current = true;
    setIsBatchScanning(false);
    setIsScanning(false);
  };

  useEffect(() => {
    // O Radar inicia vazio: os resultados são adicionados exclusivamente após busca real.
    setScannedBusinesses([]);
    setActiveBusiness(null);

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    };
  }, []);

  // Category counts breakdown
  const categoryCounts = {
    all: scannedBusinesses.length,
    posto: scannedBusinesses.filter(b => b.categoryType === 'posto').length,
    transportadora: scannedBusinesses.filter(b => b.categoryType === 'transportadora').length,
    pecas: scannedBusinesses.filter(b => b.categoryType === 'pecas').length,
    concessionaria: scannedBusinesses.filter(b => b.categoryType === 'concessionaria').length,
    industria: scannedBusinesses.filter(b => b.categoryType === 'industria').length,
  };

  const filteredBusinesses = scannedBusinesses.filter(b => {
    // Category tab filter (Separar Leads por Categoria)
    if (activeCategoryTab !== 'all' && b.categoryType !== activeCategoryTab) {
      return false;
    }

    // Contact filter check
    if (contactFilter === 'whatsapp' && b.phoneType !== 'Celular') return false;
    if (contactFilter === 'email' && !b.email) return false;
    if (contactFilter === 'website' && !b.website) return false;

    // Distributor filter check
    if (distributorFilter !== 'all') {
      if (!b.distributor || !b.distributor.toLowerCase().includes(distributorFilter.toLowerCase())) return false;
    }

    // Text search
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.address.toLowerCase().includes(q) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.distributor && b.distributor.toLowerCase().includes(q)) ||
      (b.niche && b.niche.toLowerCase().includes(q))
    );
  });

  const handleSaveSingleLead = (biz: ScannedBusiness) => {
    const leadData: Partial<Lead> = {
      phone: biz.phone,
      rawPhone: biz.rawPhone,
      ddd: biz.phone.slice(1, 3) || '11',
      phoneType: biz.phoneType,
      email: biz.email,
      name: biz.name,
      companyName: biz.name,
      sellerFullName: biz.name,
      intent: 'Venda',
      item: `${biz.category} (${biz.distributor || 'Google Maps'})`,
      location: biz.address,
      city: biz.city,
      stateUf: biz.stateUf,
      query: `Radar Google Maps: ${biz.city}`,
      source: 'Automático',
      sellerType: 'Lojista / Concessionária',
      webPageUrl: biz.website,
      isBusinessDirectory: true,
      snippetContext: `Empresa mapeada no Google Maps em ${biz.address}. Contato: ${biz.phone} / Email: ${biz.email || 'N/A'}. Distribuidor: ${biz.distributor || 'Direto'}. Nicho: ${biz.niche || 'Geral'}. Avaliação: ${biz.rating}⭐ (${biz.userRatingsTotal} avaliações).`,
      createdAt: new Date().toISOString()
    };

    onSaveLead(leadData);
    setScannedBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, saved: true } : b));
  };

  const handleSaveAllScannedLeads = () => {
    const unsaved = scannedBusinesses.filter(b => !b.saved && !existingPhoneSet.has(b.rawPhone.replace(/\D/g, '')));
    if (unsaved.length === 0) {
      alert('Todas as empresas deste resultado já foram salvas na base de leads!');
      return;
    }

    const leadsToAdd: Partial<Lead>[] = unsaved.map(biz => ({
      phone: biz.phone,
      rawPhone: biz.rawPhone,
      ddd: biz.phone.slice(1, 3) || '11',
      phoneType: biz.phoneType,
      email: biz.email,
      name: biz.name,
      companyName: biz.name,
      sellerFullName: biz.name,
      intent: 'Venda',
      item: `${biz.category} (${biz.distributor || 'Google Maps'})`,
      location: biz.address,
      city: biz.city,
      stateUf: biz.stateUf,
      query: `Radar Google Maps: ${biz.city}`,
      source: 'Automático',
      sellerType: 'Lojista / Concessionária',
      webPageUrl: biz.website,
      isBusinessDirectory: true,
      snippetContext: `Empresa mapeada no Google Maps em ${biz.address}. Contato: ${biz.phone} / Email: ${biz.email || 'N/A'}. Distribuidor: ${biz.distributor || 'Direto'}. Nicho: ${biz.niche || 'Geral'}. Avaliação: ${biz.rating}⭐ (${biz.userRatingsTotal} avaliações).`,
      createdAt: new Date().toISOString()
    }));

    onSaveMultipleLeads(leadsToAdd);
    setScannedBusinesses(prev => prev.map(b => ({ ...b, saved: true })));

    onAddLog({
      id: `log_map_save_all_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'success',
      message: `📥 ${leadsToAdd.length} empresas mineradas via Google Maps importadas em lote para a base de leads!`
    });
  };

  const handleExportScannedCsv = () => {
    if (scannedBusinesses.length === 0) return;

    let csv = 'Nome Empresa,Categoria,Telefone,Tipo Telefone,Email,Website,Endereco,Cidade,UF,Avaliacao,Latitude,Longitude\n';
    for (const b of scannedBusinesses) {
      csv += `"${b.name.replace(/"/g, '""')}","${b.category}","${b.phone}","${b.phoneType}","${b.email || ''}","${b.website || ''}","${b.address.replace(/"/g, '""')}","${b.city}","${b.stateUf}","${b.rating}","${b.lat}","${b.lng}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `google_maps_leads_${selectedCity.name.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="google-maps-scanner-component">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs   flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-blue-400 animate-spin-slow" />
                RADAR GOOGLE MAPS PRO
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs ">
                Geolocalização Ativa
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight flex items-center gap-2">
              Varredura de Empresas Locais e Comércio por Cidade
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Abra qualquer cidade do Brasil e o Radar do Google Maps extrai empresas locais, postos de combustível, transportadoras, oficinas e concessionárias com telefone WhatsApp, e-mail, site e endereço completo para sua base de leads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Batch Extract Button in Header */}
            {isBatchScanning ? (
              <button
                onClick={handleStopBatchScan}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-rose-400 animate-pulse"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Interromper Lote</span>
              </button>
            ) : (
              <button
                onClick={handleStartBatchScan}
                disabled={isScanning}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-amber-300 disabled:opacity-50"
                title="Iniciar extração em lote de múltiplos pontos de interesse simultâneos na área selecionada"
              >
                <Zap className="w-4 h-4 fill-current text-slate-950" />
                <span>Extração em Lote ({batchRadiusKm}km)</span>
              </button>
            )}

            <button
              onClick={handleSaveAllScannedLeads}
              disabled={scannedBusinesses.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Salvar Todos na Base ({scannedBusinesses.length})</span>
            </button>

            <button
              onClick={handleExportScannedCsv}
              disabled={scannedBusinesses.length === 0}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2"
              title="Exportar planilha CSV de contatos do Google Maps"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* BATCH EXTRACTION CONTROL PANEL (EXTRAÇÃO EM LOTE MULTI-PONTOS) */}
      <details className="group rounded-2xl" open={isBatchScanning}>
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950 hover:bg-amber-100">
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 fill-current" /> Extração em lote e cobertura ampliada</span>
          <span className="text-amber-700 group-open:hidden">Configurar</span>
          <span className="text-amber-700 hidden group-open:inline">Recolher</span>
        </summary>
        <div className={`mt-3 p-4 rounded-2xl border transition-all ${
        isBatchScanning
          ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-amber-500 shadow-xl text-white'
          : 'bg-amber-50/80 border-amber-200/90 text-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left Info Header */}
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isBatchScanning ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-amber-100 text-amber-800'
            }`}>
              <Zap className="w-6 h-6 fill-current" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  isBatchScanning
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-amber-200/80 text-amber-900'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBatchScanning ? 'bg-amber-400 animate-ping' : 'bg-amber-600'}`} />
                  {isBatchScanning ? 'EXTRAÇÃO EM LOTE EM EXECUÇÃO' : 'EXTRAÇÃO EM LOTE SIMULTÂNEA'}
                </span>

                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isBatchScanning ? 'bg-white/10 text-amber-200 border-white/20' : 'bg-white text-slate-600 border-amber-200'
                }`}>
                  {batchPointsDensity} Pontos de Interesse
                </span>
              </div>

              <h3 className={`text-sm font-bold tracking-tight ${isBatchScanning ? 'text-white' : 'text-slate-900'}`}>
                Extração em Lote Multi-Pontos (Varredura Simultânea por Raio)
              </h3>

              <p className={`text-xs ${isBatchScanning ? 'text-amber-200' : 'text-slate-600'}`}>
                {isBatchScanning
                  ? `Varrendo Ponto ${batchCurrentStep}/${batchTotalSteps}: ${batchStepLabel} | Contatos Capturados: ${batchExtractedCount}`
                  : `Capture contatos de múltiplos pontos de interesse simultaneamente na região de "${customCityInput || selectedCity.name}" em um raio configurável.`}
              </p>

              {isBatchScanning && (
                <div className="w-full bg-black/40 rounded-full h-2 mt-2 overflow-hidden border border-amber-500/30">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${Math.round((batchCurrentStep / batchTotalSteps) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Radius Selector + Density Selector + Action Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            
            {/* Batch Radius Selector */}
            <div className={`p-2 rounded-xl border flex flex-col gap-1 ${
              isBatchScanning ? 'bg-white/10 border-white/20' : 'bg-white border-amber-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold gap-2">
                <span className={isBatchScanning ? 'text-amber-300' : 'text-slate-600'}>Raio de Lote:</span>
                <span className="text-amber-600 font-bold">{batchRadiusKm} km</span>
              </div>
              <div className="flex items-center gap-1">
                {[15, 30, 50, 100, 250, 500].map(r => (
                  <button
                    key={r}
                    type="button"
                    disabled={isBatchScanning}
                    onClick={() => setBatchRadiusKm(r)}
                    className={`px-2 py-1 rounded-lg text-xs  transition-all cursor-pointer ${
                      batchRadiusKm === r
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                        : isBatchScanning ? 'text-amber-200 opacity-50' : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Density Selector */}
            <div className={`p-2 rounded-xl border flex flex-col gap-1 ${
              isBatchScanning ? 'bg-white/10 border-white/20' : 'bg-white border-amber-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold gap-2">
                <span className={isBatchScanning ? 'text-amber-300' : 'text-slate-600'}>Densidade:</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { pts: 5, label: '5 Pontos' },
                  { pts: 9, label: '9 Pontos' },
                  { pts: 16, label: '16 Pontos' }
                ].map(d => (
                  <button
                    key={d.pts}
                    type="button"
                    disabled={isBatchScanning}
                    onClick={() => setBatchPointsDensity(d.pts)}
                    className={`px-2 py-1 rounded-lg text-xs  transition-all cursor-pointer ${
                      batchPointsDensity === d.pts
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                        : isBatchScanning ? 'text-amber-200 opacity-50' : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Button */}
            {isBatchScanning ? (
              <button
                type="button"
                onClick={handleStopBatchScan}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 animate-pulse"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Interromper Lote</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartBatchScan}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 border border-amber-300"
              >
                <Zap className="w-4 h-4 fill-current text-slate-950" />
                <span>Extração em Lote ({batchPointsDensity} Pontos)</span>
              </button>
            )}

          </div>
        </div>
        </div>
      </details>

      {/* AUTONOMOUS RADAR CONTROL PANEL (BUSCA AUTÔNOMA AUTOMÁTICA) */}
      <details className="group rounded-2xl" open={isAutoPilot}>
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-950 hover:bg-indigo-100">
          <span className="flex items-center gap-2"><Bot className="w-4 h-4" /> Modo autônomo e salvamento automático</span>
          <span className="text-indigo-700 group-open:hidden">Configurar</span>
          <span className="text-indigo-700 hidden group-open:inline">Recolher</span>
        </summary>
        <div className={`mt-3 p-4 rounded-2xl border transition-all ${
        isAutoPilot
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border-indigo-500 shadow-xl text-white'
          : 'bg-indigo-50/70 border-indigo-200 text-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isAutoPilot ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-100 text-indigo-700'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  isAutoPilot
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAutoPilot ? 'bg-emerald-400 animate-ping' : 'bg-indigo-500'}`} />
                  {isAutoPilot ? 'PILOTO AUTOMÁTICO ATIVO' : 'MODO AUTÔNOMO DISPONÍVEL'}
                </span>

                {isAutoPilot && autoPilotCountdown > 0 && (
                  <span className="text-xs font-mono text-indigo-200 bg-white/10 px-2 py-0.5 rounded">
                    Próxima cidade em {autoPilotCountdown}s
                  </span>
                )}
              </div>
              
              <h3 className={`text-sm font-bold tracking-tight ${isAutoPilot ? 'text-white' : 'text-slate-900'}`}>
                Varredura Autônoma Automática (Piloto Automático de Leads)
              </h3>
              
              <p className={`text-xs ${isAutoPilot ? 'text-indigo-200' : 'text-slate-600'}`}>
                {isAutoPilot
                  ? `Varrendo sem parar: Cidade ${autoPilotCityIdx + 1}/${PRESET_CITIES.length} (${PRESET_CITIES[autoPilotCityIdx].name}). Total minerado: ${autoPilotTotalMined} leads`
                  : 'Ative para varrer automaticamente todas as 18 principais cidades do Brasil e salvar leads na base sem clicar.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Cycle Speed Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              isAutoPilot ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
            }`}>
              <span className={`text-xs font-bold px-1.5 ${isAutoPilot ? 'text-indigo-300' : 'text-slate-500'}`}>
                Velocidade:
              </span>
              {[
                { sec: 4, label: 'Turbo (4s)' },
                { sec: 8, label: 'Médio (8s)' },
                { sec: 15, label: 'Completo (15s)' },
              ].map(opt => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setAutoPilotIntervalSec(opt.sec)}
                  className={`px-2 py-0.5 rounded-lg text-xs  transition-all cursor-pointer ${
                    autoPilotIntervalSec === opt.sec
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : isAutoPilot ? 'text-indigo-200 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Auto Save Toggle */}
            <button
              type="button"
              onClick={() => setAutoPilotAutoSave(!autoPilotAutoSave)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                autoPilotAutoSave
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                  : isAutoPilot ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-600 border-slate-200'
              }`}
              title="Salvar automaticamente todas as empresas mineradas durante a varredura autônoma"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Auto-Salvar: {autoPilotAutoSave ? 'ATIVADO' : 'DESATIVADO'}</span>
            </button>

            {/* Toggle Auto Pilot Button */}
            <button
              type="button"
              onClick={toggleAutoPilot}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isAutoPilot
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isAutoPilot ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar Autônomo</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Busca Autônoma</span>
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </details>

      {/* SEARCH SAFEGUARDS STATUS BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 px-4 shadow-sm text-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">Busca com limites seguros</span>
              <span className="px-2 py-0.5 rounded-full text-xs  bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Proteção ativa
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              O Radar aplica pausas e reduz a cadência diante de falhas, sem rotação de IP ou técnicas de evasão.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-right shrink-0 self-start md:self-auto">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Operação</div>
          <div className="text-xs font-bold text-indigo-300">Cadência controlada</div>
        </div>
      </div>

      {/* Control Panel: City, State & Category Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          
          {/* City & State Selector Block */}
          <div className="flex-1 space-y-4">
            
            {/* Header & State Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Selecione a Cidade / Região para Varredura:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700  normal-case">
                  {selectedStateUf === 'ALL' ? 'Brasil Integral (27 Estados)' : `Estado: ${selectedStateUf}`}
                </span>
              </label>

              {/* State Dropdown Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Filtrar por Estado (UF):</span>
                <select
                  value={selectedStateUf}
                  onChange={(e) => {
                    const newUf = e.target.value;
                    setSelectedStateUf(newUf);
                    setCustomCityInput('');
                    const newCityList = newUf === 'ALL' ? ALL_BRAZIL_CITIES : (BRAZIL_STATES_AND_CITIES[newUf]?.cities || ALL_BRAZIL_CITIES);
                    if (newCityList.length > 0) {
                      const firstCity = newCityList[0];
                      setSelectedCity(firstCity);
                      setCustomMapCenter({ lat: firstCity.lat, lng: firstCity.lng });
                      setScannedBusinesses([]);
                      setActiveBusiness(null);
                      setScanFeedback(null);
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="ALL">🇧🇷 Todos os Estados / Brasil Integral (Todas as Cidades)</option>
                  {Object.entries(BRAZIL_STATES_AND_CITIES).map(([uf, data]) => (
                    <option key={uf} value={uf}>
                      📍 {data.stateName} ({data.cities.length} Cidades)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* State Quick Tabs (UF Badges) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs  text-slate-400 shrink-0 mr-1">UF:</span>
              {['ALL', 'SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'BA', 'PE', 'CE', 'GO', 'DF', 'MT', 'MS', 'PA', 'ES', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'AM', 'RO', 'AC', 'RR', 'AP', 'TO'].map((uf) => (
                <button
                  key={uf}
                  type="button"
                  onClick={() => {
                    setSelectedStateUf(uf);
                    setCustomCityInput('');
                    const newCityList = uf === 'ALL' ? ALL_BRAZIL_CITIES : (BRAZIL_STATES_AND_CITIES[uf]?.cities || ALL_BRAZIL_CITIES);
                    if (newCityList.length > 0) {
                      const firstCity = newCityList[0];
                      setSelectedCity(firstCity);
                      setCustomMapCenter({ lat: firstCity.lat, lng: firstCity.lng });
                      setScannedBusinesses([]);
                      setActiveBusiness(null);
                      setScanFeedback(null);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-sm  shrink-0 transition-all cursor-pointer ${
                    selectedStateUf === uf
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {uf === 'ALL' ? '🇧🇷 TODOS' : uf}
                </button>
              ))}
            </div>

            {/* City Selection Controls: City Dropdown + Search Input + Scan Button */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              
              {/* City Dropdown Selection */}
              <div className="lg:col-span-5">
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  Cidades do Estado ({selectedStateUf === 'ALL' ? 'Brasil' : selectedStateUf}):
                </label>
                <select
                  value={customCityInput ? 'CUSTOM' : selectedCity.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') return;
                    setCustomCityInput('');
                    
                    if (val.startsWith('Todas as Cidades')) {
                      const cityName = val;
                      const defaultCity = currentCityList[0] || ALL_BRAZIL_CITIES[0];
                      setSelectedCity({ name: cityName, lat: defaultCity.lat, lng: defaultCity.lng });
                      handleStartScan(cityName, selectedCategory);
                      return;
                    }

                    const found = currentCityList.find(c => c.name === val) || ALL_BRAZIL_CITIES.find(c => c.name === val);
                    if (found) {
                      setSelectedCity(found);
                      setCustomMapCenter({ lat: found.lat, lng: found.lng });
                      setScannedBusinesses([]);
                      setActiveBusiness(null);
                      setScanFeedback(null);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {selectedStateUf !== 'ALL' && (
                    <option value={`Todas as Cidades de ${selectedStateUf}`}>
                      🏆 TODAS AS CIDADES DE {selectedStateUf} (Varredura Estadual Completa)
                    </option>
                  )}
                  {selectedStateUf === 'ALL' && (
                    <option value="Todas as Cidades do Brasil">
                      🏆 TODAS AS CIDADES DO BRASIL (Varredura Nacional Completa)
                    </option>
                  )}
                  {currentCityList.map((c, idx) => (
                    <option key={idx} value={c.name}>
                      📍 {c.name}
                    </option>
                  ))}
                  {customCityInput && <option value="CUSTOM">🔍 Busca Personalizada: "{customCityInput}"</option>}
                </select>
              </div>

              {/* Manual Input Search */}
              <div className="lg:col-span-5">
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  Ou Digite Qualquer Cidade / Bairro do Brasil:
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customCityInput}
                    onChange={(e) => setCustomCityInput(e.target.value)}
                    placeholder="Ex: Campinas, SP ou Várzea Grande, MT..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Scan Button */}
              <div className="lg:col-span-2">
                {isScanning ? (
                  <button
                    type="button"
                    onClick={handleStopScan}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Parar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const cityToUse = customCityInput.trim() || selectedCity.name;
                      handleStartScan(cityToUse, selectedCategory);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Scanear</span>
                  </button>
                )}
              </div>

            </div>

            {/* Quick City Chips for the selected State */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-500 font-bold mr-1">
                Cidades em Destaque ({selectedStateUf}):
              </span>
              {selectedStateUf !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    const cityName = `Todas as Cidades de ${selectedStateUf}`;
                    setSelectedCity({ name: cityName, lat: currentCityList[0]?.lat || -23.55, lng: currentCityList[0]?.lng || -46.63 });
                    setCustomCityInput('');
                    handleStartScan(cityName, selectedCategory);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-sm  transition-all cursor-pointer border ${
                    selectedCity.name.includes('Todas as Cidades')
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs font-bold'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  ⚡ TODAS AS CIDADES DE {selectedStateUf}
                </button>
              )}
              {currentCityList.slice(0, 16).map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedCity(c);
                    setCustomCityInput('');
                    setCustomMapCenter({ lat: c.lat, lng: c.lng });
                    setScannedBusinesses([]);
                    setActiveBusiness(null);
                    setScanFeedback(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    selectedCity.name === c.name && !customCityInput
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

          </div>

          {/* Radius Selector */}
          <div className="w-full lg:w-80 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <label htmlFor="radiusKmInput" className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Raio de Busca (km):</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="radiusKmInput"
                  type="number"
                  min={1}
                  max={600}
                  value={radiusKm}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(600, Number(e.target.value) || 1));
                    setRadiusKm(val);
                  }}
                  onBlur={() => {
                    handleStartScan(customCityInput || selectedCity.name, selectedCategory, radiusKm);
                  }}
                  className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded text-right  text-xs text-blue-700 focus:outline-none focus:border-blue-600"
                />
                <span className="text-xs text-slate-500 font-bold">km</span>
              </div>
            </div>
            
            <input
              type="range"
              min={5}
              max={600}
              step={5}
              value={radiusKm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRadiusKm(val);
              }}
              onMouseUp={() => {
                handleStartScan(customCityInput || selectedCity.name, selectedCategory, radiusKm);
              }}
              onTouchEnd={() => {
                handleStartScan(customCityInput || selectedCity.name, selectedCategory, radiusKm);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-slate-400 font-semibold px-0.5">
              <span>5 km</span>
              <span>300 km</span>
              <span>600 km</span>
            </div>
            
            {/* Quick Radius Buttons */}
            <div className="grid grid-cols-5 gap-1">
              {[15, 50, 100, 300, 600].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRadiusKm(r);
                    handleStartScan(customCityInput || selectedCity.name, selectedCategory, r);
                  }}
                  className={`py-1 rounded text-xs  transition-all cursor-pointer ${
                    radiusKm === r
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={r === 600 ? 'Varredura Macro-Regional Máxima de até 600 km' : `Raio de ${r} km`}
                >
                  {r === 600 ? '600km 🚀' : `${r}km`}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Category & Contact & Distributor Filters */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          
          {/* Top Row: Category Selector Chips */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <label htmlFor="categorySelect" className="text-sm font-bold text-slate-600 block flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Seletor de Categoria de Negócio:</span>
              </label>
              <select
                id="categorySelect"
                value={selectedCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setSelectedCategory(cat);
                  handleStartScan(customCityInput || selectedCity.name, cat, radiusKm);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map(cat => {
                const IconComp = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      handleStartScan(customCityInput || selectedCity.name, cat.id, radiusKm);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Contact Type & Distributor B2B Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            {/* Filter by Contact Method */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-sm font-bold text-slate-600 shrink-0 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Tipo de Contato:</span>
              </span>
              <div className="flex items-center gap-1 flex-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'email', label: 'Com E-mail' },
                  { id: 'website', label: 'Com Site' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContactFilter(item.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-xs  transition-all cursor-pointer whitespace-nowrap ${
                      contactFilter === item.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Distributor / Marcas B2B */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-sm font-bold text-slate-600 shrink-0 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Distribuidor / Marca B2B:</span>
              </span>
              <select
                value={distributorFilter}
                onChange={(e) => setDistributorFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 flex-1 cursor-pointer"
              >
                <option value="all">Todas as Marcas & Distribuidores</option>
                <option value="petrobras">Petrobras BR / Vibra</option>
                <option value="shell">Shell / Select</option>
                <option value="ipiranga">Ipiranga / Rodoestrada</option>
                <option value="scania">Scania Brasil</option>
                <option value="volvo">Volvo Caminhões</option>
                <option value="mercedes">Mercedes-Benz</option>
                <option value="bosch">Bosch Service</option>
                <option value="ambev">Ambev / Atacado</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Progress Bar during Scanning */}
      {isScanning && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
              Scaneando estabelecimentos e contatos telefônicos em {customCityInput || selectedCity.name}...
            </span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Interactive Grid Layout: Visual Map + Retractable Side Contacts Panel */}
      <div className="relative flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Interactive Leaflet Map Container (Always Visible) */}
        <div className={`transition-all duration-300 bg-slate-900 text-white border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col min-h-[580px] relative overflow-hidden ${
          isSidePanelOpen ? 'w-full lg:w-7/12 shrink-0' : 'w-full flex-1'
        }`}>
          
          {/* Map Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 z-10 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapIcon className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-bold text-white tracking-wide truncate">
                Mapa Interativo Real (Leaflet OpenStreetMap) - {customCityInput || selectedCity.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMapViewStyle(mapViewStyle === 'roadmap' ? 'satellite' : 'roadmap')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {mapViewStyle === 'roadmap' ? '🛰️ Visão Satélite' : '🗺️ Visão Mapa'}
              </button>

              {!isSidePanelOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidePanelOpen(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                  title="Expandir Lista Retráctil de Contatos"
                >
                  <PanelRightOpen className="w-4 h-4" />
                  <span>Ver Lista ({filteredBusinesses.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Leaflet Interactive Map Container */}
          <div className="flex-1 mt-3 flex flex-col min-h-[480px]">
            <LeafletScannerMap
              center={customMapCenter || { lat: selectedCity.lat, lng: selectedCity.lng }}
              cityName={customCityInput || selectedCity.name}
              radiusKm={radiusKm}
              businesses={filteredBusinesses}
              activeBusiness={activeBusiness}
              onSelectBusiness={setActiveBusiness}
              onManualPointScan={(lat, lng, label) => {
                setCustomCityInput(label);
                handleStartScan(label, selectedCategory, radiusKm, { lat, lng });
              }}
              mapViewStyle={mapViewStyle}
              isScanning={isScanning}
            />
          </div>

          {/* Map Footer Information */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 text-sm text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Empresas Mapeadas ({scannedBusinesses.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Salvos na Base ({scannedBusinesses.filter(b => b.saved).length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isSidePanelOpen && (
                <span className="text-blue-400  text-xs bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  Painel Retraído (Clique em "Ver Lista" acima)
                </span>
              )}
              <span className="text-xs text-slate-500 font-mono">Raio Geográfico Interativo até {radiusKm}km</span>
            </div>
          </div>
        </div>

        {/* Retractable Side Contacts Drawer / Panel */}
        {isSidePanelOpen && (
          <div className="w-full lg:w-5/12 transition-all duration-300 space-y-4 shrink-0">
            
            {/* Panel Header with Retract Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4 shadow-sm text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold tracking-wide">
                  Contatos & Leads Encontrados ({filteredBusinesses.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSidePanelOpen(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs  transition-all cursor-pointer flex items-center gap-1.5"
                title="Retrair Painel Lateral para expandir o Mapa"
              >
                <span>Retrair Painel</span>
                <PanelRightClose className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {/* Active Business Selected Card */}
            {activeBusiness ? (
              <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-md space-y-3 relative animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs ">
                      {activeBusiness.category}
                    </span>
                    <h3 className="text-base  text-slate-900 mt-1 leading-tight">
                      {activeBusiness.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{activeBusiness.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span>{activeBusiness.rating}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5">({activeBusiness.userRatingsTotal} avaliações)</span>
                  </div>
                </div>

                {/* Detailed Contact Info */}
                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      Telefone Comercial:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{maskContact(activeBusiness.phone)}</span>
                      <span className={`px-1.5 py-0.2 rounded text-xs font-bold ${
                        activeBusiness.phoneType === 'Celular'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {activeBusiness.phoneType === 'Celular' ? 'WhatsApp' : 'Fixo'}
                      </span>
                    </div>
                  </div>

                  {activeBusiness.distributor && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                        Distribuidor / Vínculo:
                      </span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-sm">
                        {activeBusiness.distributor}
                      </span>
                    </div>
                  )}

                  {activeBusiness.niche && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Especialidade / Nicho:
                      </span>
                      <span className="font-semibold text-slate-700 text-sm">
                        {activeBusiness.niche}
                      </span>
                    </div>
                  )}

                  {activeBusiness.email && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        E-mail Comercial:
                      </span>
                      <a
                        href={`mailto:${activeBusiness.email}`}
                        className="font-bold text-indigo-600 hover:underline font-mono truncate max-w-[200px]"
                      >
                        {maskContact(activeBusiness.email)}
                      </a>
                    </div>
                  )}

                  {activeBusiness.website && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Website Oficial:
                      </span>
                      <a
                        href={activeBusiness.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <span>Abrir Site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons for Active Selected Business */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSaveSingleLead(activeBusiness)}
                    disabled={activeBusiness.saved}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeBusiness.saved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{activeBusiness.saved ? 'Lead Salvo na Base' : 'Salvar em Meus Leads'}</span>
                  </button>

                  {activeBusiness.phoneType === 'Celular' && (
                    <a
                      href={`https://wa.me/${activeBusiness.rawPhone}?text=${encodeURIComponent(`Olá! Vi o cadastro da ${activeBusiness.name} no Google Maps em ${activeBusiness.city}. Gostaria de apresentar nossos serviços.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-1">
                <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Clique em qualquer marcador no mapa ou na lista para inspecionar a empresa</p>
              </div>
            )}

            {/* Scanned List Table Card with Optimized Scroll */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Empresas Encontradas ({filteredBusinesses.length})</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAllScannedLeads}
                    disabled={scannedBusinesses.length === 0}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                    title="Salvar todas as empresas encontradas diretamente na sua base de leads"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Salvar Todos ({scannedBusinesses.filter(b => !b.saved).length})</span>
                  </button>

                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filtrar por nome, tel, e-mail..."
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-blue-600 w-full sm:w-44"
                  />
                </div>
              </div>

              {/* Category Separation Tabs Bar (Separar Leads por Categoria) */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Separar Leads por Categoria:</span>
                  </span>
                  
                  {activeCategoryTab !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        const unsavedCategory = scannedBusinesses.filter(b => b.categoryType === activeCategoryTab && !b.saved && !existingPhoneSet.has(b.rawPhone.replace(/\D/g, '')));
                        if (unsavedCategory.length === 0) {
                          alert('Nenhum lead novo para salvar nesta categoria!');
                          return;
                        }
                        const leadsToAdd: Partial<Lead>[] = unsavedCategory.map(biz => ({
                          phone: biz.phone,
                          rawPhone: biz.rawPhone,
                          ddd: biz.phone.slice(1, 3) || '11',
                          phoneType: biz.phoneType,
                          email: biz.email,
                          name: biz.name,
                          companyName: biz.name,
                          sellerFullName: biz.name,
                          intent: 'Venda',
                          item: `${biz.category} (${biz.distributor || 'Google Maps'})`,
                          location: biz.address,
                          city: biz.city,
                          stateUf: biz.stateUf,
                          query: `Radar Categoria: ${biz.category}`,
                          source: 'Automático',
                          sellerType: 'Lojista / Concessionária',
                          webPageUrl: biz.website,
                          isBusinessDirectory: true,
                          snippetContext: `Empresa mapeada no Google Maps em ${biz.address}. Contato: ${biz.phone}. Avaliação: ${biz.rating}⭐.`,
                          createdAt: new Date().toISOString()
                        }));
                        onSaveMultipleLeads(leadsToAdd);
                        setScannedBusinesses(prev => prev.map(b => b.categoryType === activeCategoryTab ? { ...b, saved: true } : b));
                      }}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Salvar Desta Categoria ({scannedBusinesses.filter(b => b.categoryType === activeCategoryTab && !b.saved).length})</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Todas', icon: Building2, count: categoryCounts.all },
                    { id: 'posto', label: 'Postos', icon: Fuel, count: categoryCounts.posto },
                    { id: 'transportadora', label: 'Transportadoras', icon: Truck, count: categoryCounts.transportadora },
                    { id: 'pecas', label: 'Auto Peças', icon: Wrench, count: categoryCounts.pecas },
                    { id: 'concessionaria', label: 'Concessionárias', icon: Store, count: categoryCounts.concessionaria },
                    { id: 'industria', label: 'Indústrias', icon: Briefcase, count: categoryCounts.industria },
                  ].map((tab) => {
                    const IconC = tab.icon;
                    const isActive = activeCategoryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategoryTab(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs '
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <IconC className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-xs  ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scroll-Optimized Business List Container */}
              <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scroll-smooth">
                {filteredBusinesses.length === 0 ? (
                  <div className={`text-center py-8 px-5 text-xs font-medium rounded-xl border ${
                    scanFeedback?.kind === 'error'
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-slate-500 bg-slate-50 border-slate-200'
                  }`}>
                    {isScanning
                      ? 'Consultando fontes disponíveis...'
                      : scanFeedback?.message || 'Selecione uma cidade e inicie uma busca para listar empresas com contatos reais.'}
                  </div>
                ) : (
                  filteredBusinesses.map((b) => (
                    <ScannedBusinessCard
                      key={b.id}
                      b={b}
                      isActive={activeBusiness?.id === b.id}
                      onSelect={setActiveBusiness}
                      onSave={handleSaveSingleLead}
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
