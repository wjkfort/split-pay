import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatMoney, parsePercent, percentToLabel } from '../lib/money';
import { computeSplit, computeTransfers } from '../lib/split';
import { buildSummary, decodeState, nameFor } from '../lib/state';
import { copyText } from '../lib/clipboard';
import { ArrowRightIcon, CopyIcon, LinkIcon, LockIcon, PencilIcon, QrIcon, ShareIcon } from './Icons';
import { SiteHeader } from './SiteHeader';
import { CheckPaper } from './CheckPaper';
import { Toast } from './Toast';
import ShareDialog from './ShareDialog';

export function ResultPage({ payload, navigate }: { payload?: string; navigate: (path: string) => void }) {
  const state = useMemo(() => decodeState(payload), [payload]);
  const [toast, setToast] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const dismissToast = useCallback(() => setToast(null), []);

  const model = useMemo(() => (state ? computeSplit(state) : null), [state]);
  const transfers = useMemo(
    () => (state && model ? computeTransfers(state, model.shares) : []),
    [state, model],
  );

  const shareUrl = useMemo(
    () => (payload ? `${window.location.origin}/s/${payload}` : window.location.origin),
    [payload],
  );

  useEffect(() => {
    if (!state || !model) {
      document.title = 'DinnerSplit — Check not found';
      return;
    }
    document.title = `DinnerSplit — ${formatMoney(model.totals.total)} for ${state.people.length}`;
  }, [state, model]);

  if (!state || !model) {
    return <MissingCheck />;
  }

  const edit = () => navigate(`/?d=${encodeURIComponent(payload ?? '')}`);
  const summary = buildSummary(state, shareUrl);

  const showToast = (message: string) => setToast(message);

  const copySummary = async () => {
    const copied = await copyText(summary);
    showToast(copied ? 'Summary copied — paste it in the group chat.' : 'Couldn’t copy. Try selecting the check.');
  };

  const copyLink = async () => {
    const copied = await copyText(shareUrl);
    showToast(copied ? 'Link copied. Send it to the table.' : 'Couldn’t copy. Long-press the address bar.');
  };

  const share = async () => {
    const data = {
      title: 'DinnerSplit — shared check',
      text: `The check is ${formatMoney(model.totals.total)}. Here is every share.`,
      url: shareUrl,
    };
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    const copied = await copyText(shareUrl);
    showToast(copied ? 'Link copied. Send it to the table.' : 'Couldn’t copy. Long-press the address bar.');
  };

  const payerName = state.payer ? nameFor(state, state.payer) : null;
  const tipBps = parsePercent(state.tipPct);

  return (
    <div className="result-page">
      <div className="page-glow" aria-hidden="true" />
      <div className="shell">
        <SiteHeader
          right={
            <span className="privacy-pill">
              <LockIcon size={13} />
              Shared link
            </span>
          }
        />

        <main className="result-layout">
          <section className="result-intro" aria-labelledby="result-title">
            <h1 id="result-title">
              The table,
              <br />
              <em>squared.</em>
            </h1>
            <p className="result-lede">
              One check, {state.people.length} friends, every cent in its place. Nothing left to divide.
            </p>

            <div className="result-meta" aria-label="Check summary">
              <span className="result-meta-amount">{formatMoney(model.totals.total)}</span>
              <span>{payerName ? `Paid by ${payerName}` : 'Payer not set'}</span>
              <span>{tipBps > 0 ? `${percentToLabel(tipBps)}% tip` : 'No tip'}</span>
            </div>

            {model.issues.length > 0 ? (
              <p className="result-warning" role="alert">
                This link&rsquo;s numbers don&rsquo;t balance.{' '}
                <button type="button" className="text-button inline-text-button" onClick={edit}>
                  Open the split
                </button>
              </p>
            ) : null}

            <div className="result-actions">
              <button type="button" className="btn btn-primary share-main" onClick={share}>
                <ShareIcon size={18} />
                Share the check
              </button>
              <button type="button" className="btn btn-ghost" onClick={copySummary}>
                <CopyIcon size={17} />
                Copy summary
              </button>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setQrOpen(true)}
                aria-label="Show QR code"
                title="Show QR code"
              >
                <QrIcon size={19} />
              </button>
              <button
                type="button"
                className="btn btn-icon"
                onClick={copyLink}
                aria-label="Copy link"
                title="Copy link"
              >
                <LinkIcon size={19} />
              </button>
            </div>

            <button type="button" className="text-button result-edit" onClick={edit}>
              <PencilIcon size={15} />
              Edit this split
            </button>

            <p className="result-privacy">
              <LockIcon size={13} />
              The check lives in this link, not in an account or a database. Anyone who has it sees the same numbers.
            </p>
          </section>

          <div className="result-check">
            <CheckPaper state={state} model={model} transfers={transfers} host={window.location.host} />
            <p className="check-caption">Screenshot it, send the link, or show the QR.</p>
          </div>
        </main>

        <footer className="site-footer result-footer">
          <p>A one-night tool for the moment the bill lands.</p>
          <a href="/" className="text-button">
            Start a new split
            <ArrowRightIcon size={15} />
          </a>
        </footer>
      </div>

      <Toast message={toast} onDone={dismissToast} />
      {qrOpen ? (
        <ShareDialog
          open
          link={shareUrl}
          onClose={() => setQrOpen(false)}
          onCopy={async () => {
            await copyLink();
            setQrOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function MissingCheck() {
  return (
    <div className="missing-page">
      <div className="page-glow" aria-hidden="true" />
      <div className="shell">
        <SiteHeader />
        <main className="missing-main">
          <h1>
            This check isn&rsquo;t
            <br />
            <em>on the table.</em>
          </h1>
          <p>
            The link may be incomplete or too old. A fresh split takes about a minute — no account, no
            upload.
          </p>
          <a href="/" className="btn btn-primary missing-cta">
            Start a new split
            <ArrowRightIcon size={18} />
          </a>
        </main>
        <footer className="site-footer">
          <p>DinnerSplit — a one-night tool for splitting the check.</p>
        </footer>
      </div>
    </div>
  );
}
