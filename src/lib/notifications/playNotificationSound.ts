let audioElement: HTMLAudioElement | null = null;
let audioUnlocked = false;

export function unlockNotificationAudio(): void {
  audioUnlocked = true;
}

export function isNotificationAudioUnlocked(): boolean {
  return audioUnlocked;
}

export function playNotificationSound(): void {
  if (!audioUnlocked || typeof window === "undefined") return;

  try {
    if (!audioElement) {
      audioElement = new Audio("/audio/notification-pop.wav");
      audioElement.volume = 0.32;
    }

    audioElement.currentTime = 0;
    void audioElement.play().catch(() => {
      // Browser may block autoplay until user gesture — safe to ignore.
    });
  } catch {
    // Ignore playback errors.
  }
}
