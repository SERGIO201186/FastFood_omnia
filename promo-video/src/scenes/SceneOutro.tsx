import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors } from "../colors";
import { fontFamily } from "../fonts";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 16], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 12, mass: 0.6 }),
    output: "perceptual-scale",
  });

  const titleOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [28, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [46, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaPulse = 1 + Math.sin(Math.max(0, frame - 62) / 8) * 0.03;

  return (
    <AbsoluteFill
      name="Outro"
      style={{
        background: `radial-gradient(circle at 50% 42%, ${colors.panel} 0%, ${colors.bg} 62%)`,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Interactive.Div
        name="Logo"
        style={{
          opacity: logoOpacity,
          scale: logoScale,
          width: 160,
          height: 160,
          borderRadius: 36,
          overflow: "hidden",
          marginBottom: 30,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%" }} />
      </Interactive.Div>
      <Interactive.Div
        name="Title"
        style={{
          opacity: titleOpacity,
          fontSize: 60,
          fontWeight: 800,
          color: colors.text,
        }}
      >
        FastFood Omnia
      </Interactive.Div>
      <Interactive.Div
        name="Tagline"
        style={{
          opacity: taglineOpacity,
          marginTop: 18,
          fontSize: 36,
          fontWeight: 600,
          color: colors.text2,
          textAlign: "center",
          padding: "0 100px",
        }}
      >
        Pide. Sirve. Cobra. Todo en una sola app.
      </Interactive.Div>
      <Interactive.Div
        name="CTA"
        style={{
          opacity: ctaOpacity,
          scale: ctaPulse,
          marginTop: 46,
          background: colors.accent,
          color: colors.accentInk,
          borderRadius: 99,
          padding: "22px 48px",
          fontSize: 34,
          fontWeight: 800,
        }}
      >
        Descúbrelo hoy →
      </Interactive.Div>
    </AbsoluteFill>
  );
};
