'use client';

import { useMemo, useState } from 'react';

type Phase = 'idle' | 'storm' | 'result';

const fortunes = [
  { rank: '大吉', action: '使い終わった電池を、今日ひとつ回収BOXへ。', note: '小さな一歩が、めぐる資源の流れをつくる。' },
  { rank: '吉', action: '家の引き出しをひとつだけ開けて、眠っている電池を探そう。', note: '「いつか」を「今日」に変えると運が動く。' },
  { rank: '中吉', action: '家族や友だちに、使っていない電池がないか聞いてみよう。', note: 'ひと声が、資源を次の役目へつなぐ。' },
  { rank: '小吉', action: '次に外出するとき、回収BOXの場所をひとつ覚えて帰ろう。', note: '迷わない準備が、続く習慣になる。' },
  { rank: '末吉', action: '電池を捨てずに、回収に出す場所を今日確認しよう。', note: '知ることも立派な一歩。次の行動につながる。' },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);

  const fortune = useMemo(() => fortunes[index], [index]);

  const draw = () => {
    setIndex(Math.floor(Math.random() * fortunes.length));
    setPhase('storm');
    window.setTimeout(() => setPhase('result'), 3200);
  };

  const reset = () => setPhase('idle');

  return (
    <main className={`stage ${phase}`}>
      <div className="paper" />
      <div className="grain" />
      <header className="topbar">
        <span className="seal">でかぼ御籤</span>
        <span className="sound">音をオンにする</span>
      </header>

      {phase === 'idle' && (
        <section className="hero">
          <div className="sun" />
          <p className="eyebrow">新しい一年に、福を。</p>
          <h1>新しい一年に、<br />福を。</h1>
          <div className="omikuji-cylinder" aria-label="おみくじ筒">
            <div className="sticks">||||||||</div>
            <div className="cylinder-label">御籤</div>
          </div>
          <button className="draw-button" onClick={draw}>おみくじを引く</button>
          <p className="hint">一振りで、今日のデカボ行動が決まる。</p>
        </section>
      )}

      {phase === 'storm' && (
        <section className="storm-scene" aria-live="polite">
          <div className="screen-crack" />
          <div className="god god-left">
            <div className="halo wind">風</div>
            <strong>風神</strong>
          </div>
          <div className="god god-right">
            <div className="halo thunder">雷</div>
            <strong>雷神</strong>
          </div>
          <div className="vortex">
            <span className="bolt">⚡</span>
            <span className="orb" />
          </div>
          <div className="wind-lines" />
          <p className="storm-copy">風と雷が、運をひらく。</p>
        </section>
      )}

      {phase === 'result' && (
        <section className="result-scene">
          <div className="result-rays" />
          <article className="fortune-card">
            <div className="card-seal">でかぼ</div>
            <p className="card-kicker">本日の御籤</p>
            <h2>{fortune.rank}</h2>
            <div className="brush-divider">◆</div>
            <p className="action-label">今日のデカボ行動</p>
            <p className="action">{fortune.action}</p>
            <p className="note">{fortune.note}</p>
            <button className="again" onClick={reset}>もう一度引く</button>
          </article>
        </section>
      )}

      <footer>DEKABO × NEW YEAR</footer>
    </main>
  );
}
