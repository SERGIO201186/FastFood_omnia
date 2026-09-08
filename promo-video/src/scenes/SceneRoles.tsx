import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors } from "../colors";
import { fontFamily } from "../fonts";

const roles = [
  { icon: "🍽️", label: "Mesero", desc: "Mesas y comandas" },
  { icon: "👨‍🍳", label: "Cocina", desc: "Pedidos en vivo" },
  { icon: "💳", label: "Caja", desc: "Cobros al instante" },
  { icon: "📊", label: "Dueño", desc: "Control total" },
];

const Card: React.FC<{
  icon: string;
  label: string;
  desc: string;
  delay: number;
  frame: number;
}> = ({ icon, label, desc, delay, frame }) => {
  const opacity = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [delay, delay + 18], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 12, mass: 0.6 }),
    output: "perceptual-scale",
  });

  return (
    <Interactive.Div
      name={`Card-${label}`}
      style={{
        opacity,
        scale,
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: 28,
        padding: "36px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        width: 380,
      }}
    >
      <div style={{ fontSize: 64 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: colors.text }}>{label}</div>
      <div style={{ fontSize: 19, color: colors.text3 }}>{desc}</div>
    </Interactive.Div>
  );
};

export const SceneRoles: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      name="Roles"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          opacity: titleOpacity,
          position: "absolute",
          top: 190,
          fontSize: 58,
          fontWeight: 800,
          color: colors.text,
          textAlign: "center",
          padding: "0 90px",
          lineHeight: 1.2,
        }}
      >
        Todo tu restaurante,
        <br />
        <span style={{ color: colors.accent }}>una sola app</span>
      </Interactive.Div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginTop: 80,
        }}
      >
        {roles.map((r, i) => (
          <Card key={r.label} {...r} delay={26 + i * 10} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
