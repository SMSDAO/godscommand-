import React, { useState } from 'react';
import { TrendingUp, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { Estimate, Invoice, Job, MaintenanceContract, Metrics } from '../types';

interface FinancialChartsProps {
  metrics: Metrics;
  jobs: Job[];
  invoices: Invoice[];
  estimates: Estimate[];
  maintenanceContracts: MaintenanceContract[];
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  metrics,
  jobs,
  invoices,
  estimates,
  maintenanceContracts,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const paidInvoicesTotal = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const unpaidInvoicesTotal = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const pipelineForecastTotal = estimates
    .filter((e) => e.status !== 'ACCEPTED')
    .reduce((sum, e) => sum + e.total, 0);

  const jobContractTotal = jobs.reduce((sum, j) => sum + j.contractAmount, 0);
  const jobCostTotal = jobs.reduce((sum, j) => sum + j.actualLaborCost + j.actualMaterialCost, 0);
  const jobProfitTotal = jobs.reduce((sum, j) => sum + j.grossProfit, 0);
  const maintenanceMonthly = maintenanceContracts.reduce(
    (sum, m) => sum + (m.billingInterval === 'Quarterly' ? m.price / 3 : m.price),
    0
  );

  // Derived breakdown segments from actual persisted totals
  const segments = [
    {
      label: 'Verified Collected',
      amount: paidInvoicesTotal,
      color: '#00F5A0',
    },
    {
      label: 'Outstanding AR',
      amount: unpaidInvoicesTotal,
      color: '#168BFF',
    },
    {
      label: 'Pipeline Forecast',
      amount: pipelineForecastTotal,
      color: '#8B5CFF',
    },
    {
      label: 'Recurring Club (Monthly)',
      amount: Math.round(maintenanceMonthly),
      color: '#FFC857',
    },
  ];

  const maxBarValue = Math.max(
    1,
    metrics.totalRevenue,
    metrics.grossProfit,
    metrics.netProfit,
    metrics.unpaidInvoicesAmount,
    pipelineForecastTotal
  );

  const ledgerPoints = [
    { label: 'Total Rev', value: metrics.totalRevenue, color: '#168BFF', tag: 'Verified Ledger' },
    { label: 'Gross Profit', value: metrics.grossProfit, color: '#00F5A0', tag: 'Earned Margin' },
    { label: 'Net Profit', value: metrics.netProfit, color: '#00E5FF', tag: 'Net Realized' },
    { label: 'Receivables', value: metrics.unpaidInvoicesAmount, color: '#FFC857', tag: 'Unpaid AR' },
    { label: 'Pipeline', value: pipelineForecastTotal, color: '#8B5CFF', tag: 'AI Forecast' },
  ];

  // Build SVG polyline path for luminous curve
  const width = 480;
  const height = 160;
  const padX = 36;
  const padY = 24;
  const coords = ledgerPoints.map((pt, idx) => {
    const x = padX + (idx * (width - padX * 2)) / (ledgerPoints.length - 1);
    const y = height - padY - ((pt.value / maxBarValue) * (height - padY * 2));
    return { ...pt, x, y };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Luminous Revenue & Forecast Trajectory */}
      <div className="lg:col-span-7 glass-level-2 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00E5FF] uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Financial Trajectory &amp; Forecast</span>
            </div>
            <p className="text-[11px] text-[#A7B3CC] mt-0.5">
              Verified ledger balances vs. open proposal pipeline (forecast labeled distinctly)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#168BFF]/15 border border-[#168BFF]/30 text-[10px] font-bold text-[#00E5FF]">
            Server-Calculated
          </span>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl bg-[#050711]/70 border border-[#168BFF]/15 p-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 sm:h-48 overflow-visible"
            role="img"
            aria-label="Financial ledger and forecast chart"
          >
            <defs>
              <linearGradient id="godsChartArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#168BFF" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#8B5CFF" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="godsChartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#168BFF" />
                <stop offset="50%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#8B5CFF" />
              </linearGradient>
            </defs>

            {/* Horizontal gridlines */}
            {[0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = height - padY - ratio * (height - padY * 2);
              return (
                <line
                  key={ratio}
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="rgba(167, 179, 204, 0.1)"
                  strokeDasharray="4 4"
                />
              );
            })}

            <path d={areaPath} fill="url(#godsChartArea)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#godsChartStroke)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {coords.map((pt, idx) => (
              <g
                key={pt.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => setHoveredPoint(hoveredPoint === idx ? null : idx)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint === idx ? 7 : 5}
                  fill="#050711"
                  stroke={pt.color}
                  strokeWidth="3"
                />
                <text
                  x={pt.x}
                  y={height - 4}
                  textAnchor="middle"
                  fill="#A7B3CC"
                  fontSize="10"
                  fontWeight="600"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip Strip */}
          <div className="mt-2 pt-2 border-t border-[#168BFF]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            {hoveredPoint !== null ? (
              <>
                <span className="text-[#A7B3CC]">
                  Selected: <strong className="text-[#F5F7FF]">{coords[hoveredPoint].label}</strong>{' '}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#8B5CFF]/20 text-[#B34DFF]">
                    {coords[hoveredPoint].tag}
                  </span>
                </span>
                <span className="font-mono font-bold text-[#00F5A0]">
                  ${coords[hoveredPoint].value.toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <span className="text-[#A7B3CC]">Tap or hover any node to inspect verified figures</span>
                <span className="font-mono font-bold text-[#00E5FF]">
                  Margin: {metrics.profitMargin}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Job Profitability & Revenue Breakdown */}
      <div className="lg:col-span-5 glass-level-2 rounded-3xl p-5 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFC857] uppercase tracking-wider">
              <PieChart className="w-4 h-4" />
              <span>Cash &amp; Job Cost Breakdown</span>
            </div>
            <p className="text-[11px] text-[#A7B3CC] mt-0.5">
              Actual job costs vs. gross profit &amp; invoice collection
            </p>
          </div>
          <BarChart3 className="w-4 h-4 text-[#8B5CFF]" />
        </div>

        <div className="space-y-3">
          {segments.map((seg) => {
            const pct = Math.min(100, Math.max(4, Math.round((seg.amount / Math.max(1, paidInvoicesTotal + unpaidInvoicesTotal + pipelineForecastTotal)) * 100)));
            return (
              <div key={seg.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A7B3CC] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.label}
                  </span>
                  <span className="font-mono font-bold text-[#F5F7FF]">
                    ${seg.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#050711] overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: seg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Job Cost vs Profit Summary */}
        <div className="p-3.5 rounded-2xl bg-[#050711]/75 border border-[#00F5A0]/20 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-[#A7B3CC]">Job Contracts</div>
            <div className="text-xs sm:text-sm font-bold text-[#F5F7FF] font-mono">
              ${jobContractTotal.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A7B3CC]">Direct Costs</div>
            <div className="text-xs sm:text-sm font-bold text-[#FF315B] font-mono">
              ${jobCostTotal.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A7B3CC]">Job Profit</div>
            <div className="text-xs sm:text-sm font-bold text-[#00F5A0] font-mono">
              ${jobProfitTotal.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
