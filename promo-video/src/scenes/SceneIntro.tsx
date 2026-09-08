import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../colors";
import { fontFamily } from "../fonts";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = interpolate(frame, [0, 0.9 * fps], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 11, mass: 0.6 }),
    output: "perceptual-scale",
  });
  const logoOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [0.7 * fps, 1.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const titleTranslate = interpolate(frame, [0.7 * fps, 1.3 * fps], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const taglineOpacity = interpolate(frame, [1.3 * fps, 1.9 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      name="Intro"
      style={{
        background: `radial-gradient(circle at 50% 38%, ${colors.panel} 0%, ${colors.bg} 62%)`,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Audio src={staticFile("audio/scene-intro-es.mp3")} />
      <Interactive.Div
        name="Logo"
        style={{
          scale: logoScale,
          opacity: logoOpacity,
          width: 220,
          height: 220,
          borderRadius: 48,
          overflow: "hidden",
          marginBottom: 40,
          boxShadow: `0 24px 60px rgba(0,0,0,0.5)`,
        }}
      >
        <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%" }} />
      </Interactive.Div>
      <Interactive.Div
        name="Title"
        style={{
          opacity: titleOpacity,
          translate: `0 ${titleTranslate}px`,
          fontSize: 92,
          fontWeight: 800,
          color: colors.text,
          letterSpacing: "-0.01em",
        }}
      >
        FastFood Omnia
      </Interactive.Div>
      <Interactive.Div
        name="Tagline"
        style={{
          opacity: taglineOpacity,
          marginTop: 20,
          fontSize: 40,
          fontWeight: 600,
          color: colors.accent,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        Tu restaurante, más inteligente
      </Interactive.Div>
    </AbsoluteFill>
  );
};
