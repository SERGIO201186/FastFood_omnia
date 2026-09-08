import React from "react";
import { colors } from "../colors";

export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  return (
    <div
      style={{
        width: 620,
        height: 1220,
        borderRadius: 56,
        border: `10px solid ${colors.panel2}`,
        backgroundColor: colors.bg,
        boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          translate: "-50% 0",
          width: 140,
          height: 24,
          borderRadius: 20,
          backgroundColor: colors.panel2,
          zIndex: 5,
        }}
      />
      {children}
    </div>
  );
};
