import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors } from "../colors";
import { fontFamily } from "../fonts";

const stats = [
  { label: "Ventas hoy", target: 1240, prefix: "$", suffix: "" },
  { label: "Pedidos", target: 86, prefix: "", suffix: "" },
  { label: "Mesas activas", target: 12, prefix: "", suffix: "" },
];

const StatCard: React.FC<{
  label: string;
  target: number;
  prefix: string;
  suffix: string;
  delay: number;
  frame: number;
}> = ({ label, target, prefix, suffix, delay, frame }) => {
  const opacity = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const raw = interpolate(frame, [delay, delay + 40], [0, target], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = Math.round(raw).toLocaleString("es-MX");

  return (
    <Interactive.Div
      name={`Stat-${label}`}
      style={{
        opacity,
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: 24,
        padding: "26px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: 760,
      }}
    >
      <span style={{ fontSize: 28, color: colors.text2, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 44, color: colors.accent, fontWeight: 800 }}>
        {prefix}
        {value}
        {suffix}
      </span>
    </Interactive.Div>
  );
};

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      name="Dashboard"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
        gap: 50,
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          opacity: titleOpacity,
          fontSize: 54,
          fontWeight: 800,
          color: colors.text,
          textAlign: "center",
          padding: "0 100px",
          lineHeight: 1.25,
          marginBottom: 10,
        }}
      >
        Reportes y control
        <br />
        <span style={{ color: colors.accent }}>en tiempo real</span>
      </Interactive.Div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={22 + i * 10} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
