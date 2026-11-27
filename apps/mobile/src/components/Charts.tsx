import React, { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { colors, font } from "@/lib/theme";
import { formatZMW } from "@/lib/format";

function useWidth(initial = 320) {
  const [w, setW] = useState(initial);
  return { w, onLayout: (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width)) };
}

/** Smooth area chart (monotone-ish Catmull-Rom) — styled after the reference analytics screen. */
export function AreaChart({
  data,
  labels,
  height = 180,
  selected,
  onSelect,
}: {
  data: number[];
  labels: string[];
  height?: number;
  selected?: number;
  onSelect?: (i: number) => void;
}) {
  const { w, onLayout } = useWidth();
  const padX = 12;
  const padTop = 28;
  const padBottom = 24;
  const max = Math.max(1, ...data);
  const n = data.length;
  const x = (i: number) => padX + (n <= 1 ? (w - padX * 2) / 2 : (i * (w - padX * 2)) / (n - 1));
  const y = (v: number) => padTop + (1 - v / max) * (height - padTop - padBottom);
  const pts = data.map((v, i) => [x(i), y(v)] as const);

  let d = "";
  pts.forEach(([px, py], i) => {
    if (i === 0) d += `M${px},${py}`;
    else {
      const [x0, y0] = pts[Math.max(0, i - 2)];
      const [x1, y1] = pts[i - 1];
      const [x3, y3] = pts[Math.min(n - 1, i + 1)];
      const c1x = x1 + (px - x0) / 6;
      const c1y = Math.max(padTop, Math.min(height - padBottom, y1 + (py - y0) / 6));
      const c2x = px - (x3 - x1) / 6;
      const c2y = Math.max(padTop, Math.min(height - padBottom, py - (y3 - y1) / 6));
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${px},${py}`;
    }
  });
  const area = n ? `${d} L${x(n - 1)},${height - padBottom} L${x(0)},${height - padBottom} Z` : "";
  const sel = selected ?? n - 1;

  return (
    <View onLayout={onLayout} accessibilityLabel={`Chart of ${n} months`}>
      <Svg width={w} height={height}>
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.turquoise} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.mint} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <Line key={t} x1={padX} x2={w - padX} y1={padTop + t * (height - padTop - padBottom)} y2={padTop + t * (height - padTop - padBottom)} stroke={colors.border} strokeDasharray="4 6" />
        ))}
        {n > 0 && <Path d={area} fill="url(#area)" />}
        {n > 0 && <Path d={d} stroke={colors.navy} strokeWidth={2.5} fill="none" />}
        {n > 0 && pts[sel] && (
          <>
            <Line x1={pts[sel][0]} x2={pts[sel][0]} y1={pts[sel][1]} y2={height - padBottom} stroke={colors.turquoise} strokeDasharray="3 4" />
            <Circle cx={pts[sel][0]} cy={pts[sel][1]} r={6} fill={colors.white} stroke={colors.turquoise} strokeWidth={3} />
            <Rect x={Math.min(w - 92, Math.max(0, pts[sel][0] - 46))} y={Math.max(0, pts[sel][1] - 30)} width={92} height={22} rx={8} fill={colors.navy} />
            <SvgText x={Math.min(w - 46, Math.max(46, pts[sel][0]))} y={Math.max(15, pts[sel][1] - 15)} fill={colors.white} fontSize={11} fontFamily={font.semibold} textAnchor="middle">
              {formatZMW(data[sel], { decimals: 0 })}
            </SvgText>
          </>
        )}
        {labels.map((l, i) => (
          <SvgText key={i} x={x(i)} y={height - 6} fill={i === sel ? colors.navy : colors.textFaint} fontSize={10} fontFamily={font.medium} textAnchor="middle" onPress={() => onSelect?.(i)}>
            {l}
          </SvgText>
        ))}
        {/* invisible hit areas for selecting a month */}
        {onSelect &&
          pts.map(([px], i) => (
            <Rect key={`hit${i}`} x={px - (w / Math.max(n, 1)) / 2} y={0} width={w / Math.max(n, 1)} height={height} fill="transparent" onPress={() => onSelect(i)} />
          ))}
      </Svg>
    </View>
  );
}

/** Grouped bars: two series per month. */
export function GroupedBarChart({
  series,
  labels,
  colorsBySeries = [colors.turquoise, colors.navy],
  height = 160,
}: {
  series: [number[], number[]];
  labels: string[];
  colorsBySeries?: [string, string];
  height?: number;
}) {
  const { w, onLayout } = useWidth();
  const n = labels.length;
  const padBottom = 20;
  const max = Math.max(1, ...series[0], ...series[1]);
  const slot = w / Math.max(n, 1);
  const bw = Math.min(14, slot / 3.2);
  const h = (v: number) => (v / max) * (height - padBottom - 8);
  return (
    <View onLayout={onLayout}>
      <Svg width={w} height={height}>
        {labels.map((l, i) => {
          const cx = slot * i + slot / 2;
          return (
            <React.Fragment key={i}>
              {[0, 1].map((s) => {
                const v = series[s][i];
                const bh = Math.max(v > 0 ? 3 : 0, h(v));
                return <Rect key={s} x={cx - bw - 2 + s * (bw + 4)} y={height - padBottom - bh} width={bw} height={bh} rx={4} fill={colorsBySeries[s]} />;
              })}
              <SvgText x={cx} y={height - 4} fill={colors.textFaint} fontSize={10} fontFamily={font.medium} textAnchor="middle">
                {l}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Line x1={0} x2={w} y1={height - padBottom} y2={height - padBottom} stroke={colors.border} />
      </Svg>
    </View>
  );
}

/** Ring showing repayment progress. */
export function ProgressRing({ value, size = 92, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.mint}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c * v} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <SvgText x={size / 2} y={size / 2 + 6} textAnchor="middle" fontSize={18} fontFamily={font.bold} fill={colors.navy}>
        {`${Math.round(v * 100)}%`}
      </SvgText>
    </Svg>
  );
}
