/**
 * Вкладка КОНТЕНТ — контент-завод рилсов (вертикаль 9:16).
 * Форма заказа: тачка → обвес из подходящих по fits (или «полный кит») →
 * сценарий (до/после, экшн с подвариантами, свой промпт) → музыка из радио →
 * текст поверх → CTA → длительность 15/30 с. Живой предпросмотр план-скелета
 * «ХУК → БИТЫ → CTA» собирается из выбора. «Заказать рилс» шлёт заявку
 * kind:'reel' в серверную очередь /api/queue (формат как у OnAirTab);
 * исполняет Claude в терминале: генерирует ролик, кладёт файл в
 * public/media/reels/ и прописывает в src/data/reels.ts — полка внизу.
 */

import { useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { SEED_CARS, SEED_PRODUCTS } from '../../data/seed';
import { allTracks } from '../../lib/radioTracks';
import { REELS } from '../../data/reels';
import '../../styles/contentadmin.css';

type SendState = 'sending' | 'ok' | 'err';
type Scenario = 'beforeafter' | 'action' | 'custom';
type Scene = 'nightrace' | 'drift' | 'chase';
type TextMode = 'slogans' | 'specs' | 'custom';
type Duration = 15 | 30;

const SCENES: Scene[] = ['nightrace', 'drift', 'chase'];
const DURATIONS: Duration[] = [15, 30];

export function ContentTab() {
  const { t, lt } = useI18n();

  const [carId, setCarId] = useState(SEED_CARS[0].id);
  const [productId, setProductId] = useState(''); // '' = полный кит (всё подходящее)
  const [scenario, setScenario] = useState<Scenario>('beforeafter');
  const [scene, setScene] = useState<Scene>('nightrace');
  const [customPrompt, setCustomPrompt] = useState('');
  const [music, setMusic] = useState('auto');
  const [textMode, setTextMode] = useState<TextMode>('slogans');
  const [customText, setCustomText] = useState('');
  // null = дефолт из i18n (живёт при переключении RU/EN, пока админ не тронул поле)
  const [ctaEdit, setCtaEdit] = useState<string | null>(null);
  const [duration, setDuration] = useState<Duration>(30);
  const [sent, setSent] = useState<SendState | null>(null);
  /** заявка, ожидающая подтверждения в модалке предпросмотра (null — модалка закрыта) */
  const [pending, setPending] = useState<{ ticket: Record<string, unknown>; pretty: string } | null>(null);
  /** всплывающий итог после «В очередь» / отмены */
  const [result, setResult] = useState<'ok' | 'err' | 'cancel' | null>(null);

  const tracks = useMemo(() => allTracks(), []);
  const car = SEED_CARS.find((c) => c.id === carId) ?? SEED_CARS[0];
  const fitting = useMemo(() => SEED_PRODUCTS.filter((p) => p.fits.includes(carId)), [carId]);
  const product = fitting.find((p) => p.id === productId);
  const cta = ctaEdit ?? t('content.cta.default');

  // смена тачки: если выбранный обвес на неё не встаёт — откат на «полный кит»
  const pickCar = (id: string) => {
    setCarId(id);
    setProductId((pid) =>
      pid && SEED_PRODUCTS.some((p) => p.id === pid && p.fits.includes(id)) ? pid : '',
    );
  };

  const carName = `${car.make} ${car.model}`;
  const kitName = product ? lt(product.name) : t('content.fullkit');
  const sceneName = t(`content.scene.${scene}`);
  const trackTitle =
    music === 'auto' ? t('content.music.auto') : tracks.find((x) => x.id === music)?.title ?? music;
  const overlayLabel =
    textMode === 'custom'
      ? customText.trim() || t('content.text.custom')
      : t(`content.text.${textMode}`);

  // план-скелет рилса: ХУК (кульминация 1-м кадром) → БИТЫ → CTA; живой предпросмотр
  const plan = useMemo(() => {
    const rows: { tag: string; text: string }[] = [];
    const hook =
      scenario === 'action'
        ? t('content.plan.hookAction', { car: carName, kit: kitName, scene: sceneName })
        : scenario === 'beforeafter'
          ? t('content.plan.hookBA', { car: carName, kit: kitName })
          : t('content.plan.hookCustom', { car: carName });
    rows.push({ tag: t('content.plan.hook'), text: hook });
    if (scenario === 'custom') {
      rows.push({
        tag: t('content.plan.beat', { n: 1 }),
        text: customPrompt.trim() || t('content.plan.customEmpty'),
      });
    } else {
      rows.push({ tag: t('content.plan.beat', { n: 1 }), text: t('content.plan.beatStock', { car: carName }) });
      rows.push({ tag: t('content.plan.beat', { n: 2 }), text: t('content.plan.beatGlitch', { kit: kitName }) });
      rows.push({
        tag: t('content.plan.beat', { n: 3 }),
        text:
          scenario === 'action'
            ? t('content.plan.beatAction', { scene: sceneName })
            : t('content.plan.beatReveal', { car: carName }),
      });
    }
    rows.push({ tag: 'CTA', text: t('content.plan.cta', { cta }) });
    return rows;
  }, [scenario, carName, kitName, sceneName, customPrompt, cta, t]);

  // шаг 1: собрать заявку и показать её в модалке предпросмотра — админ видит,
  // что именно уйдёт в очередь, ДО отправки
  const order = () => {
    const brief = {
      carId,
      productId: productId || 'full-kit',
      scenario,
      scene: scenario === 'action' ? scene : undefined,
      customPrompt: scenario === 'custom' ? customPrompt.trim() : undefined,
      music,
      textMode,
      text: textMode === 'custom' ? customText.trim() : undefined,
      cta,
      duration,
    };
    const ticket = {
      key: `reel:${carId}:${Date.now()}`,
      kind: 'reel',
      prompt: JSON.stringify(brief),
      width: 720,
      height: 1280,
      createdAt: Date.now(),
    };
    setPending({ ticket, pretty: JSON.stringify(brief, null, 2) });
  };

  // шаг 2: подтверждение из модалки — только теперь POST в очередь
  const confirmSend = () => {
    if (!pending) return;
    const body = JSON.stringify(pending.ticket);
    setPending(null);
    setSent('sending');
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
      .then((r) => {
        setSent(r.ok ? 'ok' : 'err');
        setResult(r.ok ? 'ok' : 'err');
      })
      .catch(() => {
        setSent('err');
        setResult('err');
      });
  };

  const cancelSend = () => {
    setPending(null);
    setResult('cancel');
  };

  return (
    <div className="adm-section">
      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape dark">{t('content.title')}</span>
          <span className="tech-label">{t('content.format')}</span>
        </div>
        <p className="adm-note">{t('content.note')}</p>

        <div className="cnt-grid">
          {/* ===== форма заказа ===== */}
          <div className="cnt-form">
            <div className="cnt-row">
              <span className="cnt-label">{t('content.car')}</span>
              <select className="field" value={carId} onChange={(e) => pickCar(e.target.value)} data-testid="cnt-car">
                {SEED_CARS.map((c) => (
                  <option key={c.id} value={c.id}>{c.make} {c.model}</option>
                ))}
              </select>
            </div>

            <div className="cnt-row">
              <span className="cnt-label">{t('content.product')}</span>
              <select className="field" value={productId} onChange={(e) => setProductId(e.target.value)} data-testid="cnt-product">
                <option value="">{t('content.product.full')}</option>
                {fitting.map((p) => (
                  <option key={p.id} value={p.id}>{lt(p.name)}</option>
                ))}
              </select>
            </div>

            <div className="cnt-row">
              <span className="cnt-label">{t('content.scenario')}</span>
              <select className="field" value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)} data-testid="cnt-scenario">
                <option value="beforeafter">{t('content.scenario.beforeafter')}</option>
                <option value="action">{t('content.scenario.action')}</option>
                <option value="custom">{t('content.scenario.custom')}</option>
              </select>
            </div>

            {scenario === 'action' && (
              <div className="cnt-row">
                <span className="cnt-label">{t('content.scene')}</span>
                <select className="field" value={scene} onChange={(e) => setScene(e.target.value as Scene)}>
                  {SCENES.map((s) => (
                    <option key={s} value={s}>{t(`content.scene.${s}`)}</option>
                  ))}
                </select>
              </div>
            )}

            {scenario === 'custom' && (
              <div className="cnt-row">
                <span className="cnt-label" />
                <textarea
                  className="field cnt-textarea"
                  rows={3}
                  value={customPrompt}
                  placeholder={t('content.customPrompt.ph')}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>
            )}

            <div className="cnt-row">
              <span className="cnt-label">{t('content.music')}</span>
              <select className="field" value={music} onChange={(e) => setMusic(e.target.value)}>
                <option value="auto">{t('content.music.auto')}</option>
                {tracks.map((tr) => (
                  <option key={tr.id} value={tr.id}>{tr.title}</option>
                ))}
              </select>
            </div>

            <div className="cnt-row">
              <span className="cnt-label">{t('content.text')}</span>
              <select className="field" value={textMode} onChange={(e) => setTextMode(e.target.value as TextMode)}>
                <option value="slogans">{t('content.text.slogans')}</option>
                <option value="specs">{t('content.text.specs')}</option>
                <option value="custom">{t('content.text.custom')}</option>
              </select>
            </div>

            {textMode === 'custom' && (
              <div className="cnt-row">
                <span className="cnt-label" />
                <textarea
                  className="field cnt-textarea"
                  rows={2}
                  value={customText}
                  placeholder={t('content.customText.ph')}
                  onChange={(e) => setCustomText(e.target.value)}
                />
              </div>
            )}

            <div className="cnt-row">
              <span className="cnt-label">{t('content.cta')}</span>
              <input
                className="field"
                type="text"
                value={cta}
                onChange={(e) => setCtaEdit(e.target.value)}
              />
            </div>

            <div className="cnt-row">
              <span className="cnt-label">{t('content.duration')}</span>
              <div className="cnt-durations">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={`adm-mini-btn${duration === d ? ' cnt-on' : ''}`}
                    onClick={() => setDuration(d)}
                  >
                    {t('content.duration.s', { n: d })}
                  </button>
                ))}
              </div>
            </div>

            <div className="cnt-actions">
              <button className="btn" onClick={order} disabled={sent === 'sending'} data-testid="cnt-order">
                {t('content.order')}
              </button>
              {sent && (
                <span className={`cnt-q-status${sent === 'err' ? ' err' : ''}`}>
                  {sent === 'sending' && t('content.q.sending')}
                  {sent === 'ok' && t('content.q.ok')}
                  {sent === 'err' && t('content.q.err')}
                </span>
              )}
            </div>
          </div>

          {/* ===== живой предпросмотр план-скелета ===== */}
          <div className="cnt-preview" data-testid="cnt-plan">
            <div className="cnt-preview-head">
              <span className="tape hazard">{t('content.plan.title')}</span>
            </div>
            <ol className="cnt-plan">
              {plan.map((row, i) => (
                <li key={i} className="cnt-plan-line">
                  <span className="cnt-plan-tag">{row.tag}</span>
                  <span className="cnt-plan-text">{row.text}</span>
                </li>
              ))}
            </ol>
            <p className="cnt-plan-meta mono">
              {t('content.plan.meta', { text: overlayLabel, music: trackTitle, dur: duration })}
            </p>
            <p className="cnt-plan-rule">{t('content.plan.rule')}</p>
          </div>
        </div>
      </div>

      {/* ===== полка готовых рилсов ===== */}
      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape dark">{t('content.shelf.title')}</span>
          <span className="tech-label">{t('content.shelf.stats', { n: REELS.length })}</span>
        </div>
        {REELS.length === 0 ? (
          <p className="cnt-empty">{t('content.shelf.empty')}</p>
        ) : (
          <div className="cnt-reels">
            {REELS.map((r) => (
              <div key={r.file} className="cnt-reel-card">
                <video src={r.file} controls playsInline preload="metadata" />
                <div className="cnt-reel-title">{lt(r.title)}</div>
                <div className="cnt-reel-row">
                  <span className="cnt-reel-date mono">{r.createdAt}</span>
                  <a className="adm-mini-btn" href={r.file} download>
                    {t('content.shelf.download')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== модалка предпросмотра заявки: видно, ЧТО уйдёт в очередь ===== */}
      {pending && (
        <div className="uf-auth-overlay" onClick={cancelSend}>
          <div className="panel rivets cnt-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="artedit-head" style={{ cursor: 'default' }}>
              <span className="tech-label">{t('content.confirm.title')}</span>
              <button className="artedit-x" onClick={cancelSend}>✕</button>
            </div>
            <p className="adm-note">{t('content.confirm.what')}</p>
            <ol className="cnt-plan">
              {plan.map((row, i) => (
                <li key={i} className="cnt-plan-line">
                  <span className="cnt-plan-tag">{row.tag}</span>
                  <span className="cnt-plan-text">{row.text}</span>
                </li>
              ))}
            </ol>
            <pre className="cnt-confirm-json mono" data-testid="cnt-confirm-json">{pending.pretty}</pre>
            <div className="cnt-confirm-actions">
              <button className="btn" onClick={confirmSend} data-testid="cnt-confirm-send">
                {t('content.confirm.send')}
              </button>
              <button className="btn ghost" onClick={cancelSend}>
                {t('content.confirm.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== всплывающий итог после отправки/отмены ===== */}
      {result && (
        <div className="uf-auth-overlay" onClick={() => setResult(null)}>
          <div className="panel rivets cnt-result" onClick={(e) => e.stopPropagation()}>
            <span className={`tape ${result === 'ok' ? 'dark' : 'hazard'}`}>
              {t(`content.result.${result}.title`)}
            </span>
            <p>{t(`content.result.${result}.text`)}</p>
            <button className="btn" onClick={() => setResult(null)} data-testid="cnt-result-close">
              {t('content.result.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
