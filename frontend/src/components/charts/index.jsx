import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown
} from "lucide-react";

/**
 * LineChart Component
 * Displays trend data over time
 */
export const LineChart = ({ data, height = 200, color = "#8b5cf6" }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">{t("noDataAvailable")}</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <line x1="0" y1="20" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="0.2" />
        <line x1="0" y1="40" x2="100" y2="40" stroke="#e5e7eb" strokeWidth="0.2" />
        <line x1="0" y1="60" x2="100" y2="60" stroke="#e5e7eb" strokeWidth="0.2" />
        <line x1="0" y1="80" x2="100" y2="80" stroke="#e5e7eb" strokeWidth="0.2" />
        <polygon points={`0,100 ${points} 100,100`} fill={color} opacity="0.1" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.value - minValue) / range) * 80 - 10;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
        })}
      </svg>
    </div>
  );
};

/**
 * DonutChart Component
 * Displays percentage breakdown
 */
export const DonutChart = ({ data, size = 200 }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">{t("noDataAvailable")}</div>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  let cumulativePercent = 0;

  const slices = data.map((d, i) => {
    const percent = (d.value / total) * 100;
    const startAngle = (cumulativePercent / 100) * 360;
    const endAngle = ((cumulativePercent + percent) / 100) * 360;
    cumulativePercent += percent;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const largeArc = percent > 50 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    return { path: `M50 50 L${x1} ${y1} A40 40 0 ${largeArc} 1 ${x2} ${y2} Z`, color: colors[i % colors.length], percent: percent.toFixed(1), ...d };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="#f3f4f6" />
          {slices.map((slice, i) => <path key={i} d={slice.path} fill={slice.color} opacity="0.9" />)}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
      </div>
      <div className="space-y-2">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: slice.color }} />
            <span className="text-sm">{slice.label}: <span className="font-semibold">{slice.percent}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * BarChart Component
 * Displays categorical data comparison
 */
export const BarChart = ({ data, height = 300 }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) return <div className="text-center text-muted-foreground py-8">{t("noDataAvailable")}</div>;

  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-around h-full gap-2 px-4 pb-8">
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-gray-700">{item.value}</div>
              <div className="w-full rounded-t transition-all duration-300 hover:opacity-80" style={{ height: `${barHeight}%`, backgroundColor: colors[i % colors.length], minHeight: 4 }} />
              <div className="text-xs text-gray-600 text-center max-w-full truncate">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * MetricCard Component
 * Shows a single metric with icon and trend
 */
export const MetricCard = ({ title, value, change, icon: Icon, color = "blue", prefix = "", suffix = "" }) => {
  const { t } = useTranslation();
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600"
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{prefix}{value}{suffix}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
              <span className={`text-sm font-medium ${isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground"}`}>
                {isPositive && "+"}{change}%
              </span>
              <span className="text-sm text-muted-foreground">{t("vsLastPeriod")}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
