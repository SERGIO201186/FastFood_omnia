import { Composition, Folder } from "remotion";
import {
  PromoVideo,
  PROMO_VIDEO_DURATION,
  INTRO_DURATION,
  CHAT_DURATION,
  ROLES_DURATION,
  DASHBOARD_DURATION,
  OUTRO_DURATION,
} from "./PromoVideo";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneChat } from "./scenes/SceneChat";
import { SceneRoles } from "./scenes/SceneRoles";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { SceneOutro } from "./scenes/SceneOutro";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

export const MyComposition = () => {
  return (
    <>
      <Folder name="PromoVideo-Scenes">
        <Composition
          id="Scene-Intro"
          component={SceneIntro}
          durationInFrames={INTRO_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene-Chat"
          component={SceneChat}
          durationInFrames={CHAT_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene-Roles"
          component={SceneRoles}
          durationInFrames={ROLES_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene-Dashboard"
          component={SceneDashboard}
          durationInFrames={DASHBOARD_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene-Outro"
          component={SceneOutro}
          durationInFrames={OUTRO_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={PROMO_VIDEO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
