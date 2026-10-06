"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyConsumptionPoint = {
  month: string;
  label: string;
  [productId: string]: string | number;
};

export type ConsumptionSeries = {
  id: string;
  name: string;
  unit: string;
};

const COLORS = ["#078ad6", "#26a77a", "#e0a13a", "#8067d8", "#dc7355"];
const PERIOD_OPTIONS = [3, 6, 12] as const;
const MAX_SELECTED_PRODUCTS = 5;

export default function ConsumptionChart({
  data,
  series,
}: {
  data: MonthlyConsumptionPoint[];
  series: ConsumptionSeries[];
}) {
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]>(12);
  const [selectedIds, setSelectedIds] = useState(() => series.slice(0, MAX_SELECTED_PRODUCTS).map((item) => item.id));
  const [productSearch, setProductSearch] = useState("");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const visibleSeries = useMemo(
    () => series.filter((item) => selectedIds.includes(item.id)),
    [selectedIds, series],
  );
  const visibleData = data.slice(-period);
  const matchingSeries = series.filter((item) =>
    item.name.toLocaleLowerCase("nl-NL").includes(productSearch.trim().toLocaleLowerCase("nl-NL")),
  );
  const selectionLabel = selectedIds.length === 0
    ? "Kies artikelen"
    : `${selectedIds.length} artikel${selectedIds.length === 1 ? "" : "en"} geselecteerd`;

  function toggleProduct(productId: string) {
    setSelectedIds((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId);
      if (current.length >= MAX_SELECTED_PRODUCTS) return current;
      return [...current, productId];
    });
  }

  if (series.length === 0) {
    return (
      <div className="trends-chart-empty">
        <strong>Nog geen verbruik om te tonen</strong>
        <span>De grafiek verschijnt zodra er afboekingen zijn geregistreerd.</span>
      </div>
    );
  }

  return (
    <div className="trends-chart-controls">
      <div className="trends-filter-bar" aria-label="Grafiekfilters">
        <div className="trends-filter-group">
          <span className="trends-filter-label" id="trends-period-label">Periode</span>
          <div className="trends-segmented-control" role="group" aria-labelledby="trends-period-label">
            {PERIOD_OPTIONS.map((months) => (
              <button
                aria-pressed={period === months}
                className={period === months ? "active" : ""}
                key={months}
                onClick={() => setPeriod(months)}
                type="button"
              >
                {months} maanden
              </button>
            ))}
          </div>
        </div>

        <div className="trends-filter-group">
          <span className="trends-filter-label">Artikelen</span>
          <details className="trends-product-filter">
            <summary aria-label={`Artikelkeuze: ${selectionLabel}`}>{selectionLabel}</summary>
            <div className="trends-product-popover">
              <div className="trends-product-popover-heading">
                <div>
                  <strong>Selecteer artikelen</strong>
                  <span>Kies maximaal {MAX_SELECTED_PRODUCTS} tegelijk.</span>
                </div>
                <button
                  className="trends-top-products-button"
                  onClick={() => setSelectedIds(series.slice(0, MAX_SELECTED_PRODUCTS).map((item) => item.id))}
                  type="button"
                >
                  Top 5
                </button>
              </div>
              <label className="trends-product-search">
                <span className="visually-hidden">Zoek een artikel</span>
                <input
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Zoek een artikel..."
                  type="search"
                  value={productSearch}
                />
              </label>
              <div className="trends-product-options">
                {matchingSeries.length > 0 ? matchingSeries.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <label className="trends-product-option" key={item.id}>
                      <input
                        checked={checked}
                        disabled={!checked && selectedIds.length >= MAX_SELECTED_PRODUCTS}
                        onChange={() => toggleProduct(item.id)}
                        type="checkbox"
                      />
                      <span>{item.name}</span>
                      <small>{item.unit}</small>
                    </label>
                  );
                }) : (
                  <p className="trends-product-no-results">Geen artikelen gevonden.</p>
                )}
              </div>
              <span className="trends-product-selection-count">
                {selectedIds.length} van {MAX_SELECTED_PRODUCTS} geselecteerd
              </span>
            </div>
          </details>
        </div>

        <div className="trends-filter-group">
          <span className="trends-filter-label" id="trends-chart-type-label">Grafiektype</span>
          <div className="trends-segmented-control" role="group" aria-labelledby="trends-chart-type-label">
            <button
              aria-pressed={chartType === "line"}
              className={chartType === "line" ? "active" : ""}
              onClick={() => setChartType("line")}
              type="button"
            >
              Lijn
            </button>
            <button
              aria-pressed={chartType === "bar"}
              className={chartType === "bar" ? "active" : ""}
              onClick={() => setChartType("bar")}
              type="button"
            >
              Staaf
            </button>
          </div>
        </div>
      </div>

      {visibleSeries.length === 0 ? (
        <div className="trends-chart-empty">
          <strong>Geen artikelen geselecteerd</strong>
          <span>Kies minimaal één artikel in het filter om het verbruik te bekijken.</span>
        </div>
      ) : (
        <div className="trends-chart" role="group" aria-label={`${chartType === "line" ? "Lijn" : "Staaf"}grafiek met verbruik van ${visibleSeries.length} artikelen over ${period} maanden`}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart accessibilityLayer data={visibleData} margin={{ top: 12, right: 18, left: 2, bottom: 4 }}>
                <CartesianGrid stroke="#e9eef3" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#78889b", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#dfe6ed" }} minTickGap={18} />
                <YAxis width={44} tick={{ fill: "#78889b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toLocaleString("nl-NL") : value,
                    name,
                  ]}
                  contentStyle={{ border: "1px solid #e5ebf1", borderRadius: 10, boxShadow: "0 8px 24px rgb(28 49 74 / 10%)", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12 }} />
                {visibleSeries.map((item, index) => (
                  <Line
                    key={item.id}
                    name={`${item.name} (${item.unit})`}
                    type="monotone"
                    dataKey={item.id}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, fill: "#fff" }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart accessibilityLayer data={visibleData} margin={{ top: 12, right: 18, left: 2, bottom: 4 }}>
                <CartesianGrid stroke="#e9eef3" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#78889b", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#dfe6ed" }} minTickGap={18} />
                <YAxis width={44} tick={{ fill: "#78889b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toLocaleString("nl-NL") : value,
                    name,
                  ]}
                  contentStyle={{ border: "1px solid #e5ebf1", borderRadius: 10, boxShadow: "0 8px 24px rgb(28 49 74 / 10%)", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12 }} />
                {visibleSeries.map((item, index) => (
                  <Bar
                    key={item.id}
                    name={`${item.name} (${item.unit})`}
                    dataKey={item.id}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
