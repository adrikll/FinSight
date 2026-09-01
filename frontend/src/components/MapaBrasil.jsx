import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = '/brazil-states.json';

export default function MapaBrasil({ mapaUf, metricaMapa, ufSelecionada, onSelecionarUf }) {
  const max = Math.max(...mapaUf.map(u => u[metricaMapa] || 0), 0.0001);

  const corPorUf = (sigla) => {
    const dado = mapaUf.find(u => u.uf === sigla);
    if (!dado) return '#1e293b';
    const intensidade = 0.2 + ((dado[metricaMapa] || 0) / max) * 0.8;
    return `rgba(107, 33, 168, ${intensidade})`;
  };

  return (
    <ComposableMap 
      projection="geoMercator" 
      projectionConfig={{ scale: 480, center: [-53, -15] }} 
      width={460} 
      height={380}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const sigla = geo.id;
            const dado = mapaUf.find(u => u.uf === sigla);
            const valorFormatado = dado ? dado[metricaMapa] : 0;
            
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => onSelecionarUf(sigla)}
                style={{
                  default: { fill: corPorUf(sigla), stroke: '#0f172a', strokeWidth: 0.5, outline: 'none' },
                  hover: { fill: '#a855f7', stroke: '#fff', strokeWidth: 1, outline: 'none', cursor: 'pointer' },
                  pressed: { fill: '#7e22ce', outline: 'none' },
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