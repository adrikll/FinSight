import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = '/brazil-states.json';

export default function MapaBrasil({ mapaUf, metricaMapa, ufSelecionada, onSelecionarUf }) {
  const max = Math.max(...mapaUf.map(u => u[metricaMapa] || 0), 0.0001);

  const corPorUf = (sigla) => {
    if (sigla === ufSelecionada) {
      return '#38bdf8'; 
    }
    const dado = mapaUf.find(u => u.uf === sigla);
    if (!dado) return '#334155'; 
    const proporcao = (dado[metricaMapa] || 0) / max;
    const intensidade = 0.4 + proporcao * 0.6; 
    return `rgba(147, 51, 234, ${intensidade})`; 
  };

  return (
    <ComposableMap 
      projection="geoMercator" 
      projectionConfig={{ scale: 520, center: [-53, -15] }} /* Scale reduzido para afastar as pontas das bordas */
      width={460} 
      height={380}
      viewBox="0 0 460 380"
      style={{ width: '100%', height: '100%', maxHeight: '320px' }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const sigla = geo.id;
            const dado = mapaUf.find(u => u.uf === sigla);
            const valorFormatado = dado ? dado[metricaMapa] : 0;
            const isSelecionado = sigla === ufSelecionada;
            
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => onSelecionarUf(sigla)}
                style={{
                  default: { 
                    fill: corPorUf(sigla), 
                    stroke: isSelecionado ? '#ffffff' : '#64748b', 
                    strokeWidth: isSelecionado ? 1.2 : 0.6, 
                    outline: 'none' 
                  },
                  hover: { 
                    fill: isSelecionado ? '#0ea5e9' : '#c084fc', 
                    stroke: '#ffffff', 
                    strokeWidth: 1, 
                    outline: 'none', 
                    cursor: 'pointer' 
                  },
                  pressed: { 
                    fill: '#38bdf8', 
                    outline: 'none' 
                  },
                }}
              >
                <title>{`${sigla}: ${valorFormatado}`}</title>
              </Geography>
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}