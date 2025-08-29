import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

export default function RadialTextChart({
  data = [
    { character: "THESEUS.", line: "Now, fair Hippolyta, our nuptial hour" },
    { character: "PUCK.", line: "Lord, what fools these mortals be!" },
  ],
  width = 720,
  height = 720,

  // layout
  centerPadding = 300,
  barThickness = 6,

  // text styles (used for BOTH measuring and rendering)
  fontFamily = "Inter, system-ui, sans-serif",
  fontSize = 6,
  fontWeight = 400,
  letterSpacing = 0, // px

  // label padding
  labelPadLeft = 4,
  labelPadRight = 8,

  // polar
  angleOffset = -90,
  keepTextUpright = false,
  sort = null,
  centerText = null,

  // legend
  showLegend = true,
  legendX = 12,
  legendY = 12,
  legendItemHeight = 18,
  legendSwatchSize = 12,
  legendGap = 8,
}) {
  const svgRef = useRef(null);
  const chartRef = useRef(null);
  const zoomInitedRef = useRef(false);
  const measureLayerRef = useRef(null);
  const [lengths, setLengths] = useState([]);

  // 14-color categorical palette (character → color)
  const COLORS = useMemo(
    () => [
      "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
      "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
      "#bcbd22", "#17becf", "#393b79", "#637939",
      "#8c6d31", "#843c39"
    ],
    []
  );

  // Normalize input to {id, label(line), meta.character}
  const prepared = useMemo(() => {
    const normalized = (data || []).map((d, i) => {
      if (typeof d === "string") return { id: i, label: d, meta: { character: "Unknown" } };
      if (d && typeof d === "object" && "character" in d && "line" in d) {
        return { id: d.id ?? i, label: d.line, meta: { character: d.character } };
      }
      if (d && typeof d === "object" && "label" in d) {
        return { id: d.id ?? i, label: d.label, meta: { character: "Unknown" } };
      }
      return { id: i, label: String(d), meta: { character: "Unknown" } };
    });
    return typeof sort === "function" ? [...normalized].sort(sort) : normalized;
  }, [data, sort]);

  // Unique characters for legend
  const characters = useMemo(
    () => Array.from(new Set(prepared.map(d => d.meta?.character ?? "Unknown"))),
    [prepared]
  );

  // Ordinal color scale
  const colorScale = useMemo(() => d3.scaleOrdinal(COLORS), [COLORS]);

  const N = prepared.length;
  const angles = useMemo(() => {
    const start = (angleOffset * Math.PI) / 180;
    const step = (2 * Math.PI) / Math.max(1, N);
    return d3.range(N).map((i) => start + i * step);
  }, [N, angleOffset]);

  // Measure text lengths offscreen (match render styles)
  useLayoutEffect(() => {
    if (!measureLayerRef.current) return;
    const g = d3.select(measureLayerRef.current);
    g.selectAll("text").remove();

    const texts = g
      .selectAll("text")
      .data(prepared, (d) => d.id)
      .join("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-family", fontFamily)
      .style("font-size", `${fontSize}px`)
      .style("font-weight", fontWeight)
      .style("letter-spacing", `${letterSpacing}px`)
      .text((d) => d.label);

    const measured = [];
    texts.each(function () {
      measured.push(this.getComputedTextLength());
    });
    setLengths(measured);
  }, [prepared, fontFamily, fontSize, fontWeight, letterSpacing]);

  // Ensure a persistent chart group
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    let chart = svg.select("g.chart");
    if (chart.empty()) chart = svg.append("g").attr("class", "chart");
    chartRef.current = chart.node();
  }, []);

  // Draw/update contents
  useEffect(() => {
    if (!svgRef.current || !chartRef.current || lengths.length !== prepared.length) return;
    const chart = d3.select(chartRef.current);

    chart.selectAll("g.item").remove();

    const groups = chart
      .selectAll("g.item")
      .data(
        prepared.map((d, i) => ({ ...d, angle: angles[i], len: lengths[i] })),
        (d) => d.id
      )
      .join((enter) => enter.append("g").attr("class", "item"));

    groups.attr("transform", (d) => `rotate(${(d.angle * 180) / Math.PI})`);

    // Bars — width accounts for left/right padding
    groups
      .append("rect")
      .attr("x", centerPadding)
      .attr("y", -barThickness / 2)
      .attr("width", (d) => Math.ceil(d.len) + labelPadLeft + labelPadRight)
      .attr("height", barThickness)
      .attr("rx", barThickness / 2)
      .attr("fill", (d) => colorScale(d.meta?.character ?? "Unknown"));

    // Line text
    const text = groups
      .append("text")
      .attr("x", centerPadding + labelPadLeft)
      .attr("y", 0)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "start")
      .style("font-family", fontFamily)
      .style("font-size", `${fontSize}px`)
      .style("font-weight", fontWeight)
      .style("letter-spacing", `${letterSpacing}px`)
      .style("fill", "#0f172a")
      .text((d) => d.label);

    // Hover tooltip shows character
    groups.append("title").text((d) => d.meta?.character ?? "");

    if (keepTextUpright) {
      text.attr("transform", (d) => `rotate(${(-d.angle * 180) / Math.PI})`);
    }

    // Center title (moves/scales with chart)
    chart
      .selectAll("text.center-label")
      .data(centerText ? [centerText] : [])
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "center-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-weight", "bold")
            .style("pointer-events", "none"),
        (update) => update,
        (exit) => exit.remove()
      )
      .text((d) => d)
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", "140px");
  }, [
    angles,
    barThickness,
    centerPadding,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    labelPadLeft,
    labelPadRight,
    keepTextUpright,
    lengths,
    prepared,
    colorScale,
    centerText,
  ]);

  // Zoom + pan
  useEffect(() => {
    if (!svgRef.current || !chartRef.current) return;

    const svg = d3.select(svgRef.current);
    const chart = d3.select(chartRef.current);

    svg.style("touch-action", "none");

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        chart.attr("transform", event.transform);
      });

    svg.call(zoom);

    if (!zoomInitedRef.current) {
      const t0 = d3.zoomIdentity.translate(width / 2, height / 2);
      svg.call(zoom.transform, t0);
      zoomInitedRef.current = true;
    }

    return () => svg.on(".zoom", null);
  }, [width, height]);

  // --- Legend (fixed; does not zoom) ---
  const renderLegend = () => {
    if (!showLegend) return null;
    return (
      <g className="legend" transform={`translate(${legendX}, ${legendY})`}>
        {characters.map((name, i) => {
          const y = i * legendItemHeight;
          return (
            <g key={name ?? i} transform={`translate(0, ${y})`}>
              <rect
                x={0}
                y={-legendSwatchSize + legendItemHeight / 2}
                width={legendSwatchSize}
                height={legendSwatchSize}
                rx={2}
                fill={colorScale(name ?? "Unknown")}
                stroke="#000"
                opacity={0.9}
              />
              <text
                x={legendSwatchSize + legendGap}
                y={0}
                dominantBaseline="middle"
                style={{ fontFamily, fontSize: 12, fill: "#0f172a" }}
              >
                {name}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg ref={svgRef} width={width} height={height}>
      {/* Offscreen measurement layer */}
      <g
        ref={measureLayerRef}
        transform="translate(-1000,-1000)"
        style={{ visibility: "hidden", position: "absolute" }}
      />
      {renderLegend()}
    </svg>
  );
}
