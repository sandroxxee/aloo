import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { MapPin, Globe, Award, BarChart3, Layers } from 'lucide-react';

interface BrazilStateGeoChartProps {
  leads: Lead[];
  onSelectStateFilter?: (uf: string) => void;
}

const DDD_TO_STATE: Record<string, { uf: string; name: string; region: string }> = {
  '11': { uf: 'SP', name: 'São Paulo (Capital/Grande SP)', region: 'Sudeste' },
  '12': { uf: 'SP', name: 'São Paulo (Vale do Paraíba)', region: 'Sudeste' },
  '13': { uf: 'SP', name: 'São Paulo (Baixada Santista)', region: 'Sudeste' },
  '14': { uf: 'SP', name: 'São Paulo (Bauru/Marília)', region: 'Sudeste' },
  '15': { uf: 'SP', name: 'São Paulo (Sorocaba)', region: 'Sudeste' },
  '16': { uf: 'SP', name: 'São Paulo (Ribeirão Preto)', region: 'Sudeste' },
  '17': { uf: 'SP', name: 'São Paulo (São José do Rio Preto)', region: 'Sudeste' },
  '18': { uf: 'SP', name: 'São Paulo (Presidente Prudente)', region: 'Sudeste' },
  '19': { uf: 'SP', name: 'São Paulo (Campinas/Piracicaba)', region: 'Sudeste' },

  '21': { uf: 'RJ', name: 'Rio de Janeiro (Capital)', region: 'Sudeste' },
  '22': { uf: 'RJ', name: 'Rio de Janeiro (Norte Fluminense)', region: 'Sudeste' },
  '24': { uf: 'RJ', name: 'Rio de Janeiro (Sul Fluminense)', region: 'Sudeste' },

  '31': { uf: 'MG', name: 'Minas Gerais (Belo Horizonte)', region: 'Sudeste' },
  '32': { uf: 'MG', name: 'Minas Gerais (Juiz de Fora)', region: 'Sudeste' },
  '33': { uf: 'MG', name: 'Minas Gerais (Governador Valadares)', region: 'Sudeste' },
  '34': { uf: 'MG', name: 'Minas Gerais (Uberlândia)', region: 'Sudeste' },
  '35': { uf: 'MG', name: 'Minas Gerais (Sul de Minas)', region: 'Sudeste' },
  '37': { uf: 'MG', name: 'Minas Gerais (Divinópolis)', region: 'Sudeste' },
  '38': { uf: 'MG', name: 'Minas Gerais (Montes Claros)', region: 'Sudeste' },

  '27': { uf: 'ES', name: 'Espírito Santo (Vitória)', region: 'Sudeste' },
  '28': { uf: 'ES', name: 'Espírito Santo (Cachoeiro)', region: 'Sudeste' },

  '41': { uf: 'PR', name: 'Paraná (Curitiba)', region: 'Sul' },
  '42': { uf: 'PR', name: 'Paraná (Ponta Grossa)', region: 'Sul' },
  '43': { uf: 'PR', name: 'Paraná (Londrina)', region: 'Sul' },
  '44': { uf: 'PR', name: 'Paraná (Maringá)', region: 'Sul' },
  '45': { uf: 'PR', name: 'Paraná (Cascavel/Foz)', region: 'Sul' },
  '46': { uf: 'PR', name: 'Paraná (Francisco Beltrão)', region: 'Sul' },

  '47': { uf: 'SC', name: 'Santa Catarina (Joinville/Blumenau)', region: 'Sul' },
  '48': { uf: 'SC', name: 'Santa Catarina (Florianópolis)', region: 'Sul' },
  '49': { uf: 'SC', name: 'Santa Catarina (Chapecó)', region: 'Sul' },

  '51': { uf: 'RS', name: 'Rio Grande do Sul (Porto Alegre)', region: 'Sul' },
  '53': { uf: 'RS', name: 'Rio Grande do Sul (Pelotas)', region: 'Sul' },
  '54': { uf: 'RS', name: 'Rio Grande do Sul (Caxias do Sul)', region: 'Sul' },
  '55': { uf: 'RS', name: 'Rio Grande do Sul (Santa Maria)', region: 'Sul' },

  '61': { uf: 'DF', name: 'Distrito Federal (Brasília)', region: 'Centro-Oeste' },
  '62': { uf: 'GO', name: 'Goiás (Goiânia)', region: 'Centro-Oeste' },
  '64': { uf: 'GO', name: 'Goiás (Rio Verde)', region: 'Centro-Oeste' },
  '65': { uf: 'MT', name: 'Mato Grosso (Cuiabá)', region: 'Centro-Oeste' },
  '66': { uf: 'MT', name: 'Mato Grosso (Rondonópolis/Sinop)', region: 'Centro-Oeste' },
  '67': { uf: 'MS', name: 'Mato Grosso do Sul (Campo Grande)', region: 'Centro-Oeste' },

  '71': { uf: 'BA', name: 'Bahia (Salvador)', region: 'Nordeste' },
  '73': { uf: 'BA', name: 'Bahia (Ilhéus/Itabuna)', region: 'Nordeste' },
  '74': { uf: 'BA', name: 'Bahia (Juazeiro)', region: 'Nordeste' },
  '75': { uf: 'BA', name: 'Bahia (Feira de Santana)', region: 'Nordeste' },
  '77': { uf: 'BA', name: 'Bahia (Vitória da Conquista)', region: 'Nordeste' },

  '81': { uf: 'PE', name: 'Pernambuco (Recife)', region: 'Nordeste' },
  '87': { uf: 'PE', name: 'Pernambuco (Caruaru/Petrolina)', region: 'Nordeste' },
  '85': { uf: 'CE', name: 'Ceará (Fortaleza)', region: 'Nordeste' },
  '88': { uf: 'CE', name: 'Ceará (Juazeiro do Norte)', region: 'Nordeste' },

  '91': { uf: 'PA', name: 'Pará (Belém)', region: 'Norte' },
  '92': { uf: 'AM', name: 'Amazonas (Manaus)', region: 'Norte' },
};

export const BrazilStateGeoChart: React.FC<BrazilStateGeoChartProps> = ({ leads, onSelectStateFilter }) => {
  const [viewMode, setViewMode] = useState<'chart' | 'grid'>('chart');

  // Aggregate leads by State (UF)
  const stateCounts: Record<string, { uf: string; count: number; region: string; ddds: Set<string> }> = {};

  leads.forEach(lead => {
    let uf = 'SP'; // default fallback
    let region = 'Sudeste';
    
    // Check location string e.g. "Curitiba - PR"
    if (lead.location) {
      const match = lead.location.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i);
      if (match) {
        uf = match[1].toUpperCase();
      }
    } else if (lead.ddd && DDD_TO_STATE[lead.ddd]) {
      uf = DDD_TO_STATE[lead.ddd].uf;
      region = DDD_TO_STATE[lead.ddd].region;
    }

    if (!stateCounts[uf]) {
      stateCounts[uf] = { uf, count: 0, region, ddds: new Set() };
    }
    stateCounts[uf].count += 1;
    if (lead.ddd) stateCounts[uf].ddds.add(lead.ddd);
  });

  const chartData = Object.values(stateCounts)
    .sort((a, b) => b.count - a.count)
    .map(item => ({
      uf: item.uf,
      count: item.count,
      ddds: Array.from(item.ddds).join(', '),
      region: item.region,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl text-white space-y-1 text-xs">
          <div className="font-bold text-blue-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Estado: {data.uf} ({data.region})</span>
          </div>
          <div className="text-sm  font-mono">
            {data.count} leads capturados
          </div>
          <div className="text-sm text-slate-400">
            DDDs detectados: <span className="font-mono text-white">{data.ddds || 'N/A'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Densidade Geográfica de Leads (Por Estado / UF & DDD)</h3>
            <p className="text-sm text-slate-500">Distribuição de frotistas e caminhões minerados no mapa do Brasil</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'chart' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráfico de Barras</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mapa Regional</span>
            </button>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
          Nenhum lead com dados geográficos (DDD/Estado) encontrado ainda. Inicie uma varredura para preencher o mapa.
        </div>
      ) : viewMode === 'chart' ? (
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 pt-6 h-72">
          <div className="text-sm font-bold text-slate-500 mb-2 tracking-wide">Ranking de Estados por Volume de Leads Minerados</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="uf" stroke="#64748b" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#2563eb" 
                radius={[6, 6, 0, 0]}
                onClick={(data: any) => onSelectStateFilter && data?.uf && onSelectStateFilter(data.uf)}
                cursor="pointer"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : index === 1 ? '#0284c7' : '#0d9488'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chartData.map((item) => (
            <div 
              key={item.uf}
              onClick={() => onSelectStateFilter && onSelectStateFilter(item.uf)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl p-4 space-y-2.5 transition-all cursor-pointer group shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600  flex items-center justify-center font-mono text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {item.uf}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Região {item.region}</div>
                    <div className="text-xs text-slate-500">DDDs: {item.ddds || 'N/A'}</div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {item.count} leads
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(10, (item.count / (chartData[0]?.count || 1)) * 100))}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
