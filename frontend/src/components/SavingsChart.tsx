import type { MonthlyStats } from '@/pages/CreditsDashboard';
import React, { useState, useMemo } from 'react';

interface SavingsTimelineData {
  month: string;
  savings: number;
  cumulativeSavings: number;
}

interface CategorySavingsData {
  [key: string]: SavingsTimelineData[];
}

interface SavingsChartProps {
  rawData: MonthlyStats['average_monthly_expenses'];
  className?: string;
}

// Category colors - Updated with Banorte red as primary
const categoryColors: { [key: string]: string } = {
  Total: '#EB0029', // Banorte red for total
  Luz: '#FFB800',
  Agua: '#1E90FF',
  Gas: '#FF6B35',
  Transporte: '#9B59B6',
};

// Function to convert month string to Spanish 3-letter abbreviation
const getSpanishMonthAbbr = (monthString: string): string => {
  const monthMap: Record<string, string> = {
    '01': 'Ene',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Abr',
    '05': 'May',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Ago',
    '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dic',
  };

  // Extract month from YYYY-MM format
  const monthNumber = monthString.split('-')[1];
  return monthMap[monthNumber] || monthString;
};

// Function to convert raw API data to chart format
const convertRawDataToChartFormat = (
  rawData: MonthlyStats['average_monthly_expenses']
): { data: SavingsTimelineData[]; categoryData: CategorySavingsData } => {
  const categoryData: CategorySavingsData = {};
  const monthlyTotals: Record<string, number> = {};

  // Generate year-to-date months (January to current month)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 0-indexed, so add 1

  const yearToDateMonths: string[] = [];
  for (let month = 1; month <= currentMonth; month++) {
    const monthStr = month.toString().padStart(2, '0');
    yearToDateMonths.push(`${currentYear}-${monthStr}`);
  }

  // Initialize monthlyTotals with 0 for all year-to-date months
  yearToDateMonths.forEach((month) => {
    monthlyTotals[month] = 0;
  });

  // Only consider these categories
  const allowedCategories = ['Luz', 'Agua', 'Transporte', 'Gas'];

  // Initialize category data with 0 values for all months
  allowedCategories.forEach((category) => {
    categoryData[category] = yearToDateMonths.map((month) => ({
      month,
      savings: 0,
      cumulativeSavings: 0, // Keep for interface compatibility, but will just equal savings
    }));
  });

  // Filter raw data for only allowed categories
  const filteredData = Object.entries(rawData).filter(([category]) =>
    allowedCategories.includes(category)
  );

  // Process each category and update existing months
  filteredData.forEach(([categoryKey, categoryData_raw]) => {
    // Process each month's expense for this category
    categoryData_raw.monthly_expenses.forEach((expense) => {
      const month = expense.month;
      const amount = expense.amount;

      // Only process if month is in our year-to-date range
      if (yearToDateMonths.includes(month)) {
        // Find and update the existing entry
        const monthIndex = yearToDateMonths.indexOf(month);
        if (monthIndex !== -1) {
          categoryData[categoryKey][monthIndex].savings = amount;
          categoryData[categoryKey][monthIndex].cumulativeSavings = amount; // Same as savings, no cumulative
          monthlyTotals[month] += amount;
        }
      }
    });
  });

  // Create total data from monthly totals in chronological order
  const totalData: SavingsTimelineData[] = [];

  yearToDateMonths.forEach((month) => {
    const amount = monthlyTotals[month];
    totalData.push({
      month,
      savings: amount,
      cumulativeSavings: amount, // Same as savings, no cumulative
    });
  });

  return { data: totalData, categoryData };
};

export const SavingsChart: React.FC<SavingsChartProps> = ({
  rawData,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Total');

  // Convert raw data to chart format
  const { data, categoryData } = useMemo(() => {
    console.log('Raw data received:', rawData);
    const result = convertRawDataToChartFormat(rawData);
    console.log('Converted data:', result);
    return result;
  }, [rawData]);

  const categories = categoryData
    ? ['Total', ...Object.keys(categoryData)]
    : ['Total'];
  const currentData =
    selectedCategory === 'Total'
      ? data
      : categoryData?.[selectedCategory] || data;

  // Show loading/empty state if no data
  if (!currentData || currentData.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className='w-full px-4 py-8 text-center'>
          <p className='text-gray-500'>No hay datos disponibles para mostrar</p>
        </div>
      </div>
    );
  }

  // Handle single data point case
  if (currentData.length === 1) {
    const singlePoint = currentData[0];
    return (
      <div className={`w-full ${className}`}>
        <div className='w-full px-4 py-8 text-center'>
          <h3 className='text-lg font-semibold text-gray-800 mb-4'>
            Gastos mensuales{' '}
            {selectedCategory !== 'Total' && <>- {selectedCategory}</>}
          </h3>
          <div className='bg-gray-50 rounded-lg p-6 border border-gray-200 inline-block'>
            <div className='text-3xl font-bold text-[#EB0029] mb-2'>
              ${singlePoint.savings.toLocaleString('es-MX')}
            </div>
            <div className='text-sm text-gray-600'>
              {getSpanishMonthAbbr(singlePoint.month)}
            </div>
            <div className='text-xs text-gray-500 mt-2'>
              Solo un punto de datos disponible
            </div>
          </div>
          {/* Category Toggle for single point */}
          {categoryData && Object.keys(categoryData).length > 0 && (
            <div className='mt-6 flex flex-wrap gap-2 justify-center'>
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
      </div>
    );
  }

  // Fixed dimensions that work well in the container
  const width = 500;
  const height = 260;
  const paddingTop = 50;
  const paddingLeft = 70; // Higher left padding for y-axis labels
  const paddingRight = 30;
  const paddingBottom = 30;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate scales
  const maxSavings = Math.max(...currentData.map((d) => d.savings));
  const effectiveMaxSavings = maxSavings > 0 ? maxSavings : 1; // Prevent division by zero
  const xStep =
    currentData.length > 1 ? chartWidth / (currentData.length - 1) : 0;

  // Generate points for the line
  const points = currentData.map((item, index) => {
    const x = paddingLeft + index * xStep;
    const y =
      paddingTop +
      chartHeight -
      (item.savings / effectiveMaxSavings) * chartHeight;
    return { x, y: isNaN(y) ? paddingTop + chartHeight : y, ...item };
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
    const y = paddingTop + (chartHeight / numGridLines) * i;
    const value =
      effectiveMaxSavings - (effectiveMaxSavings / numGridLines) * i;
    gridLines.push({ y, value: isNaN(value) ? 0 : value });
  }

  const currentColor = categoryColors[selectedCategory] || '#EB0029';

  return (
    <div className={`w-full ${className}`}>
      {/* Chart Container with proper sizing */}
      <div className='w-full px-4'>
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
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke='#e5e7eb'
                strokeWidth='1'
                opacity='0.5'
              />
              <text
                x={paddingLeft - 20}
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
            d={`${pathString} L ${width - paddingRight} ${
              paddingTop + chartHeight
            } L ${paddingLeft} ${paddingTop + chartHeight} Z`}
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
          {points.map((point, index) => {
            // Smart tooltip positioning to stay within bounds
            const tooltipWidth = 80;
            const tooltipHeight = 25;
            const padding = 5;

            // Calculate tooltip position with bounds checking
            let tooltipX = point.x - tooltipWidth / 2;
            let tooltipY = point.y - 35;

            // Keep tooltip within horizontal bounds
            if (tooltipX < padding) {
              tooltipX = padding;
            } else if (tooltipX + tooltipWidth > width - padding) {
              tooltipX = width - tooltipWidth - padding;
            }

            // Keep tooltip within vertical bounds
            if (tooltipY < padding) {
              tooltipY = point.y + 15; // Show below the point if near top
            }

            // Text position (center of tooltip)
            const textX = tooltipX + tooltipWidth / 2;
            const textY = tooltipY + tooltipHeight / 2 + 4; // Vertically centered

            return (
              <g key={index} className='group'>
                {/* Larger invisible hover area */}
                <circle
                  cx={isNaN(point.x) ? 0 : point.x}
                  cy={isNaN(point.y) ? 0 : point.y}
                  r='15'
                  fill='transparent'
                  className='cursor-pointer'
                />
                {/* Visible data point */}
                <circle
                  cx={isNaN(point.x) ? 0 : point.x}
                  cy={isNaN(point.y) ? 0 : point.y}
                  r='4'
                  fill={currentColor}
                  stroke='white'
                  strokeWidth='2'
                  className='pointer-events-none transition-all duration-200 group-hover:r-6'
                />
                {/* Tooltip - triggered by hover on the group */}
                <g className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                  <rect
                    x={isNaN(point.x) ? 0 : tooltipX}
                    y={isNaN(point.y) ? 0 : tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill='rgba(0,0,0,0.8)'
                    rx='4'
                  />
                  <text
                    x={isNaN(point.x) ? 0 : textX}
                    y={isNaN(point.y) ? 20 : textY}
                    textAnchor='middle'
                    className='fill-white text-xs font-medium'
                  >
                    ${point.savings.toLocaleString('es-MX')}
                  </text>
                </g>
              </g>
            );
          })}

          {/* X-axis labels */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={height - paddingBottom + 20}
              textAnchor='middle'
              className='fill-gray-600 text-xs'
            >
              {getSpanishMonthAbbr(point.month)}
            </text>
          ))}

          {/* Chart title */}
          <text
            x={width / 2}
            y={25}
            textAnchor='middle'
            className='fill-gray-800 text-base font-semibold transition-all duration-500'
          >
            Gastos mensuales{' '}
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
