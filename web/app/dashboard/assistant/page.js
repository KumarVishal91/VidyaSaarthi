'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../../components/Providers';
import { api } from '../../../lib/api';

const CHIPS = {
  en: ['Explain fractions', 'Quiz me on fractions', 'How can I help my child read at home?'],
  hi: ['भिन्न समझाइए', 'भिन्न पर मुझसे प्रश्न पूछिए', 'घर पर बच्चे को पढ़ने में कैसे मदद करूँ?'],
};
const HELLO = {
  en: 'Namaste! I am Saarthi. Ask me about a lesson, homework or reading.',
  hi: 'नमस्ते! मैं सारथी हूँ। पाठ, होमवर्क या पढ़ाई के बारे में पूछिए।',
};

export default function Assistant() {
  const { user } = useSession();
  const [lang, setLang] = useState('en');
  const [log, setLog] = useState([{ from: 'ai', text: HELLO.en }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [log]);
  if (!user) return null;

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    setText('');
    setBusy(true);
    setLog((l) => [...l, { from: 'me', text: q }]);
    try {
      const { reply } = await api('/assistant', { method: 'POST', body: { message: q, language: lang } });
      setLog((l) => [...l, { from: 'ai', text: reply }]);
    } catch (e) {
      setLog((l) => [...l, { from: 'ai', text: e.message }]);
    } finally {
      setBusy(false);
    }
  }

  function changeLanguage(next) {
    setLang(next);
    setLog((l) => [...l, { from: 'ai', text: HELLO[next] }]);
  }

  return (
    <section className="card">
      <div className="row">
        <div>
          <h2>Saarthi</h2>
          <p className="small muted">A study helper that answers in the language you pick.</p>
        </div>
        <div className="seg" role="group" aria-label="Assistant language">
          <button aria-pressed={lang === 'en'} onClick={() => changeLanguage('en')}>English</button>
          <button aria-pressed={lang === 'hi'} onClick={() => changeLanguage('hi')}>हिन्दी</button>
        </div>
      </div>
      <div className="thread" style={{ marginTop: 12 }} aria-live="polite">
        {log.map((m, i) => <div key={i} className={`bub${m.from === 'me' ? ' me' : ''}`}>{m.text}</div>)}
        {busy && <div className="bub">…</div>}
        <div ref={bottom} />
      </div>
      <div className="chips" style={{ marginTop: 12 }}>
        {CHIPS[lang].map((c) => <button key={c} className="chip" onClick={() => ask(c)}>{c}</button>)}
      </div>
      <form className="compose" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <div>
          <label className="sr" htmlFor="q">Your question</label>
          <input id="q" value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === 'hi' ? 'अपना प्रश्न लिखिए' : 'Type your question'} autoComplete="off" />
        </div>
        <button className="btn primary" disabled={busy}>Send</button>
      </form>
    </section>
  );
}
