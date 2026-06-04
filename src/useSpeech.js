import { useEffect, useRef, useState, useCallback } from "react";

export function useSpeech() {
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef(null);

  const speak = (text) => {
    if (isMuted) return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.25;
    utterance.pitch = 5;
    utterance.volume = 1;

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const stop = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
    }
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    return () => {
      const synth = window.speechSynthesis;
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    isMuted,
    toggleMute,
  };
}
