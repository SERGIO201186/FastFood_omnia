import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { colors } from "./colors";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneChat } from "./scenes/SceneChat";
import { SceneRoles } from "./scenes/SceneRoles";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { SceneOutro } from "./scenes/SceneOutro";

export const INTRO_DURATION = 90;
export const CHAT_DURATION = 150;
export const ROLES_DURATION = 120;
export const DASHBOARD_DURATION = 90;
export const OUTRO_DURATION = 90;
export const TRANSITION_DURATION = 15;

export const PROMO_VIDEO_DURATION =
  INTRO_DURATION +
  CHAT_DURATION +
  ROLES_DURATION +
  DASHBOARD_DURATION +
  OUTRO_DURATION -
  TRANSITION_DURATION * 4;

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION} name="Intro">
          <SceneIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={CHAT_DURATION} name="Chat">
          <SceneChat />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ROLES_DURATION} name="Roles">
          <SceneRoles />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={DASHBOARD_DURATION} name="Dashboard">
          <SceneDashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION} name="Outro">
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
