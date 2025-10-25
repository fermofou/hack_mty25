import React, { useState } from 'react';

interface SavingsChartProps {
  data: Array<{
    month: string;
    savings: number;
    cumulativeSavings: number;
  }>;
  categoryData?: {
    [key: string]: Array<{
      month: string;
      savings: number;
      cumulativeSavings: number;
    }>;
  };
  className?: string;
}

export const SavingsChart: React.FC<SavingsChartProps> = ({
  data,
  categoryData,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Total');

  const categories = categoryData
    ? ['Total', ...Object.keys(categoryData)]
    : ['Total'];
  const currentData =
    selectedCategory === 'Total'
      ? data
      : categoryData?.[selectedCategory] || data;

  // Fixed dimensions that work well in the container
  const width = 500;
  const height = 260;
  const padding = 55; // Increased from 45 to give more space for labels
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Calculate scales
  const maxSavings = Math.max(...currentData.map((d) => d.cumulativeSavings));
  const xStep = chartWidth / (currentData.length - 1);

  // Generate points for the line
  const points = currentData.map((item, index) => {
    const x = padding + index * xStep;
    const y =
      padding +
      chartHeight -
      (item.cumulativeSavings / maxSavings) * chartHeight;
    return { x, y, ...item };
  });

  // Create path string for the line
  const pathString = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  // Generate grid lines
  const gridLines = [];
  const numGridLines = 4;
  for (let i = 0; i <= numGridLines; i++) {
    const y = padding + (chartHeight / numGridLines) * i;
    const value = maxSavings - (maxSavings / numGridLines) * i;
    gridLines.push({ y, value });
  }

  // Category colors - Updated with Banorte red as primary
  const categoryColors: { [key: string]: string } = {
    Total: '#EB0029', // Banorte red for total
    Electricidad: '#FFB800',
    Agua: '#1E90FF',
    Gas: '#FF6B35',
    Transporte: '#9B59B6',
  };

  const currentColor = categoryColors[selectedCategory] || '#EB0029';

  return (
    <div className={`w-full ${className}`}>
      {/* Chart Container with proper sizing */}
      <div className='w-full px-2'>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className='w-full h-auto'
          style={{ maxWidth: '100%' }}
          preserveAspectRatio='xMidYMid meet'
        >
          {/* Grid lines */}
          {gridLines.map((line, index) => (
            <g key={index}>
              <line
                x1={padding}
                y1={line.y}
                x2={width - padding}
                y2={line.y}
                stroke='#e5e7eb'
                strokeWidth='1'
                opacity='0.5'
              />
              <text
                x={padding - 15}
                y={line.y + 4}
                textAnchor='end'
                className='fill-gray-500 text-xs'
              >
                ${Math.round(line.value).toLocaleString('es-MX')}
              </text>
            </g>
          ))}

          {/* Area under the curve */}
          <defs>
            <linearGradient
              id={`areaGradient-${selectedCategory}`}
              x1='0%'
              y1='0%'
              x2='0%'
              y2='100%'
            >
              <stop offset='0%' stopColor={currentColor} stopOpacity='0.3' />
              <stop offset='100%' stopColor={currentColor} stopOpacity='0.05' />
            </linearGradient>
          </defs>

          <path
            d={`${pathString} L ${width - padding} ${
              padding + chartHeight
            } L ${padding} ${padding + chartHeight} Z`}
            fill={`url(#areaGradient-${selectedCategory})`}
            className='transition-all duration-500'
          />

          {/* Main line */}
          <path
            d={pathString}
            fill='none'
            stroke={currentColor}
            strokeWidth='3'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='transition-all duration-500'
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r='4'
                fill={currentColor}
                stroke='white'
                strokeWidth='2'
                className='hover:r-6 transition-all duration-200 cursor-pointer'
              />
              {/* Tooltip on hover */}
              <g className='opacity-0 hover:opacity-100 transition-opacity duration-200'>
                <rect
                  x={point.x - 40}
                  y={point.y - 35}
                  width='80'
                  height='25'
                  fill='rgba(0,0,0,0.8)'
                  rx='4'
                />
                <text
                  x={point.x}
                  y={point.y - 18}
                  textAnchor='middle'
                  className='fill-white text-xs font-medium'
                >
                  ${point.cumulativeSavings.toLocaleString('es-MX')}
                </text>
              </g>
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={height - padding + 20}
              textAnchor='middle'
              className='fill-gray-600 text-xs'
            >
              {point.month.split(' ')[0]}
            </text>
          ))}

          {/* Chart title */}
          <text
            x={width / 2}
            y={25}
            textAnchor='middle'
            className='fill-gray-800 text-base font-semibold transition-all duration-500'
          >
            Ahorros Acumulados{' '}
            {selectedCategory !== 'Total' && <>- {selectedCategory}</>}
          </text>
        </svg>
      </div>

      {/* Category Toggle - Moved to bottom */}
      {categoryData && (
        <div className='mt-4 flex flex-wrap gap-2 justify-center'>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor:
                  selectedCategory === category
                    ? categoryColors[category]
                    : undefined,
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
