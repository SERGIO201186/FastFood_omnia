import {
  AbsoluteFill,
  Audio,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors } from "../colors";
import { fontFamily } from "../fonts";
import { PhoneFrame } from "./PhoneFrame";

const fadeUp = (frame: number, start: number, dur = 16, distance = 18) => {
  const opacity = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(frame, [start, start + dur], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return { opacity, translate: `0 ${translateY}px` };
};

export const SceneChat: React.FC = () => {
  const frame = useCurrentFrame();

  const phoneOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneY = interpolate(frame, [0, 18], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const typingOpacity = interpolate(frame, [78, 88, 96, 104], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      name="Chat"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Audio src={staticFile("audio/scene-chat-es.mp3")} />
      <Interactive.Div
        name="PhoneWrap"
        style={{ opacity: phoneOpacity, translate: `0 ${phoneY}px` }}
      >
        <PhoneFrame>
          <div
            style={{
              background: colors.panel,
              borderBottom: `1px solid ${colors.border}`,
              padding: "56px 26px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 99,
                background: colors.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              🍔
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>
                FastFood Omnia
              </div>
              <div style={{ fontSize: 16, color: colors.text3 }}>Asistente virtual</div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background: colors.panel2,
            }}
          >
            <Interactive.Div
              name="Greeting"
              style={{
                ...fadeUp(frame, 26),
                alignSelf: "flex-start",
                maxWidth: "82%",
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                borderRadius: "22px 22px 22px 6px",
                padding: "16px 18px",
                fontSize: 21,
                color: colors.text,
                lineHeight: 1.4,
              }}
            >
              ¡Hola! 👋 Bienvenido a FastFood Omnia.
              <br />
              ¿En qué te ayudamos hoy?
            </Interactive.Div>

            <Interactive.Div
              name="OptionButton"
              style={{
                ...fadeUp(frame, 44),
                alignSelf: "flex-start",
                background: colors.accent,
                color: colors.accentInk,
                borderRadius: 99,
                padding: "14px 24px",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              Hacer un pedido
            </Interactive.Div>

            <Interactive.Div
              name="UserMessage"
              style={{
                ...fadeUp(frame, 62),
                alignSelf: "flex-end",
                maxWidth: "82%",
                background: colors.accent,
                color: colors.accentInk,
                borderRadius: "22px 22px 6px 22px",
                padding: "16px 18px",
                fontSize: 21,
                lineHeight: 1.4,
                fontWeight: 600,
              }}
            >
              2 hamburguesas y una malteada, para llevar
            </Interactive.Div>

            <div
              style={{
                opacity: typingOpacity,
                alignSelf: "flex-start",
                display: "flex",
                gap: 6,
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                borderRadius: "22px 22px 22px 6px",
                padding: "16px 20px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: colors.text3,
                  }}
                />
              ))}
            </div>

            <Interactive.Div
              name="ConfirmChip"
              style={{
                ...fadeUp(frame, 100),
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: colors.successBg,
                border: `1px solid ${colors.successBorder}`,
                color: colors.success,
                borderRadius: 16,
                padding: "14px 18px",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              <span>✅ Pedido agregado</span>
              <span style={{ marginLeft: "auto" }}>$18.50</span>
            </Interactive.Div>
          </div>
        </PhoneFrame>
      </Interactive.Div>

      <Interactive.Div
        name="Caption"
        style={{
          ...fadeUp(frame, 116, 20, 14),
          position: "absolute",
          bottom: 110,
          fontSize: 44,
          fontWeight: 700,
          color: colors.text,
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        Pide como si hablaras con un mesero
      </Interactive.Div>
    </AbsoluteFill>
  );
};
