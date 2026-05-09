import React from "react";
import { continueRender, delayRender } from "remotion";
import { AbsoluteFill, Audio, Composition, OffthreadVideo } from "remotion";
import { Lottie } from "@remotion/lottie";
import preloadLottieTemplateFontsInPage from "../font-preload-browser";

const DEFAULT_PROPS = {
  width: 1080,
  height: 1920,
  fps: 30,
  maxFrames: 300,
  animationData: { v: "5.7.0", fr: 30, ip: 0, op: 300, w: 1080, h: 1920, layers: [] },
  plateVideoUrl: "",
  audioUrl: "",
  previewFontUrls: [],
};

const collectTextFontUsage = (animationData) => {
  const out = [];
  if (!animationData || typeof animationData !== "object") return out;
  const compById = new Map();
  const assets = Array.isArray(animationData.assets) ? animationData.assets : [];
  for (const a of assets) {
    if (a && typeof a.id === "string" && Array.isArray(a.layers)) {
      compById.set(a.id, a.layers);
    }
  }

  const seenComp = new Set();
  const walkLayers = (layers, scope) => {
    if (!Array.isArray(layers)) return;
    for (const l of layers) {
      if (!l || typeof l !== "object") continue;
      if (l.ty === 5 && l.t && l.t.d && Array.isArray(l.t.d.k) && l.t.d.k.length) {
        const first = l.t.d.k[0]?.s || {};
        out.push({
          scope,
          layer: l.nm || "(unnamed-text-layer)",
          fontName: first.f || "",
          fontSize: first.s || "",
          text: typeof first.t === "string" ? first.t.slice(0, 140) : "",
        });
      }
      if (l.ty === 0 && typeof l.refId === "string" && !seenComp.has(l.refId)) {
        seenComp.add(l.refId);
        walkLayers(compById.get(l.refId), `${scope}/${l.refId}`);
      }
    }
  };

  walkLayers(Array.isArray(animationData.layers) ? animationData.layers : [], "root");
  return out;
};

const RenderLottieVideo = ({ animationData, plateVideoUrl, audioUrl, previewFontUrls }) => {
  const fontsHandle = React.useMemo(() => delayRender("Loading Lottie fonts"), []);

  React.useEffect(() => {
    let cancelled = false;
    const loadFonts = async () => {
      try {
        const assignments = await preloadLottieTemplateFontsInPage(
          animationData,
          Array.isArray(previewFontUrls) ? previewFontUrls : []
        );
        try {
          console.log("[font-debug] assignments", JSON.stringify(assignments || []));
          console.log("[font-debug] text-usage", JSON.stringify(collectTextFontUsage(animationData)));
        } catch {
          // ignore debug log serialization errors
        }
      } finally {
        if (!cancelled) continueRender(fontsHandle);
      }
    };
    loadFonts();
    return () => {
      cancelled = true;
    };
  }, [animationData, previewFontUrls, fontsHandle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {plateVideoUrl ? (
        <OffthreadVideo
          src={plateVideoUrl}
          muted
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
        />
      ) : null}
      <AbsoluteFill>
        <Lottie animationData={animationData} renderer="svg" loop={false} playbackRate={1} />
      </AbsoluteFill>
      {audioUrl ? <Audio src={audioUrl} /> : null}
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="PixviteLottieMp4"
      component={RenderLottieVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={({ props }) => {
        const width = Math.max(1, Number(props?.width) || 1080);
        const height = Math.max(1, Number(props?.height) || 1920);
        const fps = Math.max(1, Number(props?.fps) || 30);
        const durationInFrames = Math.max(1, Math.floor(Number(props?.maxFrames) || 300));
        return { width, height, fps, durationInFrames };
      }}
    />
  );
};
