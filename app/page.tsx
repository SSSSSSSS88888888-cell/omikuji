'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

type Phase = 'idle' | 'storm' | 'result';
type Fortune = { rank: string; action: string; note: string };

const fortunes: Fortune[] = [
  { rank: '大吉', action: '使い終わった電池を、今日ひとつ回収BOXへ。', note: '小さな一歩が、めぐる資源の流れをつくる。' },
  { rank: '吉', action: '家の引き出しをひとつだけ開けて、眠っている電池を探そう。', note: '「いつか」を「今日」に変えると運が動く。' },
  { rank: '中吉', action: '家族や友だちに、使っていない電池がないか聞いてみよう。', note: 'ひと声が、資源を次の役目へつなぐ。' },
  { rank: '小吉', action: '次に外出するとき、回収BOXの場所をひとつ覚えて帰ろう。', note: '迷わない準備が、続く習慣になる。' },
  { rank: '末吉', action: '電池を捨てずに、回収に出す場所を今日確認しよう。', note: '知ることも立派な一歩。次の行動につながる。' },
];

const assets = [
  '/assets/fujin-enter.svg', '/assets/fujin-charge.svg', '/assets/fujin-release.svg',
  '/assets/raijin-enter.svg', '/assets/raijin-charge.svg', '/assets/raijin-release.svg',
  '/assets/clouds.svg', '/assets/wind.svg', '/assets/impact.svg', '/assets/calligraphy.svg',
];

const RESULT_AT = 6200;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const char of [...text]) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shareState, setShareState] = useState('');

  const resultTimer = useRef<number | null>(null);
  const soundTimers = useRef<number[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const activeNodes = useRef<AudioScheduledSourceNode[]>([]);
  const running = useRef(false);

  const fortune = useMemo(() => fortunes[index], [index]);
  const flakes = useMemo(() => Array.from({ length: isMobile ? 14 : 28 }, (_, i) => i), [isMobile]);

  const stopSound = () => {
    soundTimers.current.forEach((timer) => window.clearTimeout(timer));
    soundTimers.current = [];
    activeNodes.current.forEach((node) => { try { node.stop(); } catch {} });
    activeNodes.current = [];
    if (audioContext.current) {
      void audioContext.current.close();
      audioContext.current = null;
    }
  };

  const stopTimeline = () => {
    if (resultTimer.current !== null) window.clearTimeout(resultTimer.current);
    resultTimer.current = null;
    stopSound();
  };

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 700px)');
    const sync = () => { setReducedMotion(motion.matches); setIsMobile(mobile.matches); };
    sync();
    motion.addEventListener('change', sync);
    mobile.addEventListener('change', sync);

    Promise.allSettled(assets.map((src) => new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    }))).then(() => setReady(true));

    return () => {
      motion.removeEventListener('change', sync);
      mobile.removeEventListener('change', sync);
      if (resultTimer.current !== null) window.clearTimeout(resultTimer.current);
      soundTimers.current.forEach((timer) => window.clearTimeout(timer));
      activeNodes.current.forEach((node) => { try { node.stop(); } catch {} });
      if (audioContext.current) void audioContext.current.close();
    };
  }, []);

  const playWhoosh = (ctx: AudioContext, delay: number, duration = 0.45) => {
    const timer = window.setTimeout(() => {
      if (ctx.state === 'suspended') void ctx.resume();
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        const envelope = Math.sin((Math.PI * i) / data.length);
        data[i] = (Math.random() * 2 - 1) * envelope * 0.32;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass'; filter.frequency.value = 550; filter.Q.value = 0.7;
      gain.gain.value = 0.36;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      activeNodes.current.push(source);
    }, delay);
    soundTimers.current.push(timer);
  };

  const playThunder = (ctx: AudioContext, delay: number) => {
    const timer = window.setTimeout(() => {
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(105, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.55);
      filter.type = 'lowpass'; filter.frequency.value = 700;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.62, ctx.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.72);
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.75);
      activeNodes.current.push(osc);
    }, delay);
    soundTimers.current.push(timer);
  };

  const startSound = () => {
    if (!soundEnabled) return;
    stopSound();
    const AudioCtor = window.AudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    audioContext.current = ctx;
    playWhoosh(ctx, 520, 0.62);
    playWhoosh(ctx, 820, 0.52);
    playThunder(ctx, 2250);
    playWhoosh(ctx, 2850, 0.45);
    playThunder(ctx, 4120);
  };

  const showResult = () => {
    stopSound();
    setPhase('result');
    running.current = false;
  };

  const draw = () => {
    if (!ready || running.current) return;
    running.current = true;
    setShareState('');
    setIndex(Math.floor(Math.random() * fortunes.length));
    setPhase('storm');
    if (reducedMotion) {
      resultTimer.current = window.setTimeout(showResult, 360);
      return;
    }
    startSound();
    resultTimer.current = window.setTimeout(showResult, RESULT_AT);
  };

  const skip = () => {
    if (phase !== 'storm') return;
    stopTimeline();
    setPhase('result');
    running.current = false;
  };

  const reset = () => {
    stopTimeline();
    running.current = false;
    setShareState('');
    setPhase('idle');
  };

  const saveResult = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#eadab7'; ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#b3281f'; ctx.fillRect(48, 48, 984, 1254);
    ctx.fillStyle = '#f8efd7'; ctx.fillRect(78, 78, 924, 1194);
    ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 5; ctx.strokeRect(102, 102, 876, 1146);
    ctx.textAlign = 'center'; ctx.fillStyle = '#2b2118'; ctx.font = '32px serif';
    ctx.fillText('でかぼ御籤', 540, 180);
    ctx.fillStyle = '#a62018'; ctx.font = 'bold 190px serif'; ctx.fillText(fortune.rank, 540, 425);
    ctx.fillStyle = '#b28735'; ctx.fillRect(270, 475, 540, 5);
    ctx.fillStyle = '#2b2118'; ctx.font = 'bold 30px serif'; ctx.fillText('今日のデカボ行動', 540, 550);
    ctx.font = 'bold 48px serif';
    wrapText(ctx, fortune.action, 760).forEach((line, i) => ctx.fillText(line, 540, 650 + i * 72));
    ctx.fillStyle = '#5f554b'; ctx.font = '30px serif';
    wrapText(ctx, fortune.note, 720).forEach((line, i) => ctx.fillText(line, 540, 940 + i * 50));
    ctx.fillStyle = '#9c281f'; ctx.font = 'bold 28px serif'; ctx.fillText('使い終わったら、次の役目へ。', 540, 1170);
    ctx.fillStyle = '#665b4f'; ctx.font = '22px sans-serif'; ctx.fillText('DEKABO × NEW YEAR', 540, 1220);
    const link = document.createElement('a');
    link.download = `dekabo-omikuji-${fortune.rank}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const shareResult = async () => {
    const text = `【でかぼ御籤：${fortune.rank}】\n今日のデカボ行動：${fortune.action}\n${fortune.note}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'でかぼ御籤', text }); setShareState('共有しました'); }
      else { await navigator.clipboard.writeText(text); setShareState('結果をコピーしました'); }
    } catch { setShareState('共有をキャンセルしました'); }
  };

  return (
    <main className={`stage ${phase}`}>
      <div className="paper" /><div className="grain" />
      <header className="topbar">
        <span className="seal">でかぼ御籤</span>
        <button className="sound-toggle" type="button" onClick={() => setSoundEnabled((v) => !v)} aria-pressed={soundEnabled}>音 {soundEnabled ? 'ON' : 'OFF'}</button>
      </header>

      {phase === 'idle' && (
        <section className="hero">
          <div className="sun" />
          <img className="idle-god idle-fujin" src="/assets/fujin-charge.svg" alt="" aria-hidden="true" />
          <img className="idle-god idle-raijin" src="/assets/raijin-charge.svg" alt="" aria-hidden="true" />
          <img className="idle-clouds" src="/assets/clouds.svg" alt="" aria-hidden="true" />
          <p className="eyebrow">風神雷神、運をひらく。</p>
          <h1>でかぼ<br />御籤</h1>
          <div className="omikuji-cylinder" aria-label="中央に置かれたおみくじ筒"><div className="sticks">||||||||</div><div className="cylinder-label">御籤</div></div>
          <button className="draw-button" onClick={draw} disabled={!ready}>{ready ? 'おみくじを引く' : '演出を準備中…'}</button>
          <p className="hint">一振りで、今日のデカボ行動が決まる。</p>
        </section>
      )}

      {phase === 'storm' && (
        <section className={`storm-scene ${reducedMotion ? 'reduced' : ''}`} aria-live="polite">
          <div className="storm-backdrop" />
          <img className="cloud-layer cloud-back" src="/assets/clouds.svg" alt="" aria-hidden="true" />
          <img className="wind-sheet wind-back" src="/assets/wind.svg" alt="" aria-hidden="true" />
          <div className="tap-ink" /><div className="storm-cylinder" aria-hidden="true"><span>御籤</span></div>
          <div className="deity-wrap deity-left" aria-hidden="true">
            <img className="deity-pose pose-enter" src="/assets/fujin-enter.svg" alt="" /><img className="deity-pose pose-charge" src="/assets/fujin-charge.svg" alt="" /><img className="deity-pose pose-release" src="/assets/fujin-release.svg" alt="" />
          </div>
          <div className="deity-wrap deity-right" aria-hidden="true">
            <img className="deity-pose pose-enter" src="/assets/raijin-enter.svg" alt="" /><img className="deity-pose pose-charge" src="/assets/raijin-charge.svg" alt="" /><img className="deity-pose pose-release" src="/assets/raijin-release.svg" alt="" />
          </div>
          <div className="brush-word brush-fujin" aria-hidden="true" /><div className="brush-word brush-raijin" aria-hidden="true" />
          <div className="center-vortex" aria-hidden="true"><span className="gold-core" /><span className="vortex-ring ring-one" /><span className="vortex-ring ring-two" /></div>
          <img className="wind-sheet wind-front" src="/assets/wind.svg" alt="" aria-hidden="true" />
          <div className="lightning" aria-hidden="true"><span className="bolt-main" /><span className="bolt-branch branch-one" /><span className="bolt-branch branch-two" /></div>
          <img className="impact-sheet" src="/assets/impact.svg" alt="" aria-hidden="true" /><span className="ink-shockwave" aria-hidden="true" />
          <div className="gold-flakes" aria-hidden="true">
            {flakes.map((flake) => <i key={flake} style={{ '--i': flake, '--x': `${(flake * 37) % 97}%` } as CSSProperties} />)}
          </div>
          <div className="opening-scroll" aria-hidden="true"><span /></div><div className="brush-word brush-kaiun" aria-hidden="true" />
          <p className="sr-only">風神と雷神が現れ、中央のおみくじに風と雷を集めています。</p>
          <button className="skip-button" onClick={skip}>スキップ</button>
        </section>
      )}

      {phase === 'result' && (
        <section className="result-scene" aria-live="polite">
          <img className="result-clouds" src="/assets/clouds.svg" alt="" aria-hidden="true" /><div className="result-rays" />
          <img className="result-god result-fujin" src="/assets/fujin-charge.svg" alt="風袋を持ち、御籤を見守る風神" />
          <img className="result-god result-raijin" src="/assets/raijin-charge.svg" alt="太鼓を構え、御籤を見守る雷神" />
          <article className="fortune-card">
            <div className="card-seal">でかぼ</div><p className="card-kicker">本日の御籤</p><h2>{fortune.rank}</h2><div className="brush-divider">◆</div>
            <p className="action-label">今日のデカボ行動</p><p className="action">{fortune.action}</p><p className="note">{fortune.note}</p>
            <div className="result-actions"><button onClick={saveResult}>画像保存</button><button onClick={shareResult}>共有</button><button onClick={reset}>戻る</button></div>
            {shareState && <p className="share-state" role="status">{shareState}</p>}
          </article>
        </section>
      )}
      <footer>DEKABO × NEW YEAR</footer>
    </main>
  );
}
