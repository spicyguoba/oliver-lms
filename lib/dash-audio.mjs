// Original synthesized scores: no downloads, copyrighted tracks or audio services.
export function createDashAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  let context,
    master,
    timer,
    step = 0,
    next = 0,
    theme,
    music = true,
    sfx = true,
    playing = false;
  function prepare() {
    if (!Audio) return;
    try {
      context ||= new Audio();
      if (!master) {
        master = context.createGain();
        master.gain.value = 0.12;
        master.connect(context.destination);
      }
      context.resume().catch(() => {});
    } catch {}
  }
  function tone(note, time, length = 0.15, type = "triangle", volume = 0.35) {
    if (!context || !master) return;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(time);
    oscillator.stop(time + length + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  function schedule() {
    if (!context || !theme || !music) return;
    while (next < context.currentTime + 0.12) {
      const beat = 60 / theme.bpm / 2;
      tone(
        theme.root + 12 + theme.melody[step % theme.melody.length],
        next,
        beat * 0.8,
        theme.voice,
        0.24,
      );
      if (step % 4 === 0)
        tone(
          theme.root + (step % 16 < 8 ? 0 : 5),
          next,
          beat * 1.7,
          "sine",
          0.42,
        );
      if (step % 2 === 0)
        tone(35 + (step % 4 ? 7 : 0), next, 0.045, "triangle", 0.3);
      next += beat;
      step++;
    }
  }
  function pause() {
    playing = false;
    clearInterval(timer);
    timer = null;
    if (master && context)
      master.gain.setTargetAtTime(0, context.currentTime, 0.015);
  }
  function play(config) {
    prepare();
    if (!context) return;
    playing = true;
    theme = config;
    clearInterval(timer);
    timer = null;
    master.gain.setTargetAtTime(0.12, context.currentTime, 0.015);
    next = context.currentTime + 0.03;
    step = 0;
    if (music) {
      schedule();
      timer = setInterval(schedule, 40);
    }
  }
  function effect(kind) {
    if (!sfx) return;
    prepare();
    if (!context) return;
    master.gain.setTargetAtTime(0.12, context.currentTime, 0.01);
    const t = context.currentTime;
    const notes = {
      jump: [72, 79],
      yellow: [79, 86], pink: [84], blue: [79, 67], pad: [67, 79],
      gravity: [72, 60], dual: [60, 72, 79], mode: [67, 74], speed: [72, 84],
      crash: [40, 35],
      clear: [72, 76, 79, 84],
      correct: [76, 79, 84],
      wrong: [64, 60],
    }[kind] || [72];
    notes.forEach((n, i) =>
      tone(
        n,
        t + i * 0.07,
        kind === "crash" ? 0.16 : 0.1,
        kind === "crash" ? "sawtooth" : "sine",
        0.24,
      ),
    );
  }
  return {
    prepare,
    play,
    pause,
    effect,
    setMusic(value) {
      music = value;
      if (theme && playing) play(theme);
    },
    setSfx(value) {
      sfx = value;
    },
    close() {
      pause();
      context?.close().catch(() => {});
    },
  };
}
