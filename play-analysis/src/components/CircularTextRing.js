import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * RadialTextChart
 *
 * Bars + text radiating from the center. Each bar starts at the center and
 * has a length equal to its label's rendered text length. The text sits flush
 * to the center along the bar.
 *
 * Props
 * - data: Array<string> | Array<{ id?: string|number, label: string }>
 * - width, height: svg size
 * - centerPadding: pixels from exact center to start of bar/text (default 8)
 * - barThickness: height of each bar (default 14)
 * - fontFamily, fontSize: label styling used for measuring + rendering
 * - angleOffset: rotate the whole chart (in degrees)
 * - keepTextUpright: if true, text is counter-rotated to stay upright
 * - sort: optional sort comparator on data before layout
 */
export default function RadialTextChart({
  data = [
    { label: "Through the forest have I gone" },
    { label: "But Athenian found I none" },
    { label: "On whose eyes I might approve" },
    { label: "This flower's force in stirring love" },
    { label: "Night and silence! who is here?" },
    { label: "Weeds of Athens he doth wear" },
  ],
  width = 720,
  height = 720,
  centerPadding = 300,
  barThickness = 6,
  fontFamily = "Inter, system-ui, sans-serif",
  fontSize = 6,
  angleOffset = -90, // start at top
  keepTextUpright = false,
  sort = null,
  centerText = "null",
}) {
  const svgRef = useRef(null);
  const measureLayerRef = useRef(null);
  const [lengths, setLengths] = useState([]);

  const prepared = useMemo(() => {
    const normalized = (data || []).map((d, i) =>
      typeof d === "string" ? { id: i, label: d } : { id: d.id ?? i, label: d.label }
    );
    if (typeof sort === "function") {
      return [...normalized].sort(sort);
    }
    return normalized;
  }, [data, sort]);

  const N = prepared.length;
  const angles = useMemo(() => {
    const start = (angleOffset * Math.PI) / 180;
    const step = (2 * Math.PI) / (N || 1);
    return d3.range(N).map((i) => start + i * step);
  }, [N, angleOffset]);

  // Measure text lengths using an offscreen <g>
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
      .text((d) => d.label);

    const measured = [];
    texts.each(function () {
      // getComputedTextLength is supported on SVGTextElement
      const len = this.getComputedTextLength();
      measured.push(len);
    });

    setLengths(measured);
  }, [prepared, fontFamily, fontSize]);

  // Render chart
  useEffect(() => {
    if (!svgRef.current || lengths.length !== prepared.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("g.chart").remove();

    const cx = width / 2;
    const cy = height / 2;

    const chart = svg.append("g").attr("class", "chart").attr("transform", `translate(${cx},${cy})`);

    const groups = chart
      .selectAll("g.item")
      .data(prepared.map((d, i) => ({ ...d, angle: angles[i], len: lengths[i] })), (d) => d.id)
      .join((enter) => enter.append("g").attr("class", "item"));

    // rotate each group so +x points along its spoke
    groups.attr("transform", (d) => `rotate(${(d.angle * 180) / Math.PI})`);

    // Bars (rects) — start at centerPadding, extend width = text length
    groups
      .append("rect")
      .attr("x", centerPadding)
      .attr("y", -barThickness / 2)
      .attr("width", (d) => d.len)
      .attr("height", barThickness)
      .attr("rx", barThickness / 2)
      .attr("fill", (d, i) => d3.interpolateTurbo(i / Math.max(1, N - 1))); // quick distinct palette

    // Text — sits right next to the center, aligned along the bar
    const text = groups
      .append("text")
      .attr("x", centerPadding + 2)
      .attr("y", 0)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "start")
      .style("font-family", fontFamily)
      .style("font-size", `${fontSize}px`)
      .style("fill", "#0f172a")
      .text((d) => d.label);

    if (keepTextUpright) {
      // Counter-rotate each text to remain upright
      text.attr("transform", (d) => `rotate(${(-d.angle * 180) / Math.PI})`);
    }
  }, [angles, barThickness, centerPadding, fontFamily, fontSize, height, keepTextUpright, lengths, prepared, width]);

  return (
    <svg ref={svgRef} width={width} height={height}>
      {/* offscreen measurement layer */}
      <g
        ref={measureLayerRef}
        transform={`translate(-1000,-1000)`}
        style={{ visibility: "hidden", position: "absolute" }}
      />
      {centerText && (
    <text
      x={width / 2}
      y={height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: "140px", fontWeight: "bold" }}
    >
      {centerText}
    </text>
  )}
    </svg>
  );
}

// Example usage:
// <RadialTextChart
//   data={["Helena", "Hermia", "Lysander", "Demetrius", "Puck", "Oberon", "Titania"]}
//   width={640}
//   height={640}
//   centerPadding={10}
//   barThickness={16}
//   fontSize={14}
//   keepTextUpright={false}
// />
