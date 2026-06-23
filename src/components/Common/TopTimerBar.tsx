import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSessionStore } from "@/store/sessionStore";
import { useUIStore } from "@/store/uiStore";
import { iconTimerBlack, iconTimerRed, iconTimerWhite } from "@/assets";

import { usePhotoStore } from "@/store/photoStore";
import { useAuthStore } from "@/store/authStore";
import { getTemplates } from "@/services/templateService";

export function TopTimerBar() {
  const { backgroundVariant } = useUIStore();
  const { timerSeconds, timerRunning, currentHalaman, tickTimer, resetSession, goTo, stopTimer, setAutoSubmit } =
    useSessionStore();
  const { captures, template, setTemplate } = usePhotoStore();
  const { user } = useAuthStore();

  // Capture the initial duration when the timer starts so the progress bar
  // always uses the correct total, even as timerSeconds counts down.
  const totalSecRef = useRef(180);
  useEffect(() => {
    if (timerRunning && timerSeconds > totalSecRef.current) {
      totalSecRef.current = timerSeconds;
    }
  }, [timerRunning, timerSeconds]);
  const sessionDurationSec = totalSecRef.current;

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  // Auto-submit or reset session when timer hits 0
  useEffect(() => {
    const handleTimerExpired = async () => {
      stopTimer();

      if (currentHalaman === 13) {
        goTo(1);
        return;
      }

      // Condition 1: User has not taken any photos
      if (captures.length === 0) {
        goTo(3); // redirect to product page
        return;
      }

      // Condition 2 & 3: User has taken at least 1 photo
      setAutoSubmit(true);

      try {
        let currentTemplate = template;
        if (!currentTemplate && user) {
          const res = await getTemplates({
            tenantId: user.tenantId,
            keyword: "",
            page: 1,
            limit: 10,
          });
          if (res.result && res.result.templates && res.result.templates.length > 0) {
            const defaultTemplate = res.result.templates.find((t) => t.isDefault === true)
            if (defaultTemplate) {
              currentTemplate = defaultTemplate;
            } else {
              currentTemplate = res.result.templates[0];
            }
            setTemplate(currentTemplate);
          }
        }
        goTo(12); // Redirect to DragDropPage (page 12)
      } catch (error) {
        console.error("Failed to handle timer expiration:", error);
        goTo(12); // fallback
      }
    };

    if (timerRunning && timerSeconds === 0) {
      handleTimerExpired();
    }
  }, [timerSeconds, timerRunning, captures, template, user, goTo, stopTimer, setAutoSubmit, setTemplate]);

  const totalSec = sessionDurationSec;
  const progress = totalSec > 0 ? timerSeconds / totalSec : 0;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  return (
    <div
      className={`fixed ${backgroundVariant === "image-white" ? "top-8" : "top-16"} right-8 z-50 flex items-center gap-4 border-[3px] rounded-full px-7 py-3 ${progress * 100 <= 30 ? "border-[#BA371E]" : backgroundVariant === "image-white" ? "border-[#303030]" : "border-[#FCF8EF]"}`}
    >
      <img
        src={
          progress * 100 <= 30
            ? iconTimerRed
            : backgroundVariant === "image-white"
              ? iconTimerBlack
              : iconTimerWhite
        }
        alt="clock"
        className="w-8 h-8"
      />
      <span
        className={`font-gaming text-3xl tracking-widest ${progress * 100 <= 30 ? "text-[#BA371E]" : backgroundVariant === "image-white" ? "text-[#303030]" : "text-[#FCF8EF]"}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {minutes.toString().padStart(2, "0")} :{" "}
        {seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
