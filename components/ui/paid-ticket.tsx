'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';

export interface PaidTicketInfo {
  name: string;
  amountPaise: number;
  note?: string;
}

const CSS = `
.pk-scrim{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:rgba(8,8,7,.72);backdrop-filter:blur(6px);animation:pk-fade .25s ease both}
@keyframes pk-fade{from{opacity:0}}
.pk-wrap{position:relative;width:min(360px,100%);display:flex;flex-direction:column;align-items:center;gap:22px}
.pk-ticket{position:relative;width:100%;height:150px;animation:pk-drop .5s cubic-bezier(.2,.8,.2,1) both,pk-center 1s .55s cubic-bezier(.2,.8,.2,1) both}
@keyframes pk-drop{from{opacity:0;transform:translateY(24px) scale(.94)}}
@keyframes pk-center{to{transform:translateX(-14%)}}
.pk-main{position:absolute;inset:0 26% 0 0;background:#1d1c1a;border:1px solid #34332f;border-right:0;border-radius:18px 0 0 18px;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;animation:pk-tug .35s .55s ease both}
@keyframes pk-tug{40%{transform:translateX(-5px) rotate(-.6deg)}}
.pk-top{display:flex;justify-content:space-between;font-size:12px;color:#97948b}
.pk-name{font-size:17px;font-weight:500;color:#f4f2ec;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-amt{font-family:var(--font-display);font-size:42px;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.pk-stub{position:absolute;top:0;bottom:0;right:0;width:26%;background:#262522;border:1px solid #34332f;border-left:0;border-radius:0 18px 18px 0;display:grid;place-items:center;transform-origin:0 100%;animation:pk-rip 1s .6s cubic-bezier(.5,0,.8,.4) both}
.pk-stub::before{content:'';position:absolute;left:-1px;top:10px;bottom:10px;width:2px;background:radial-gradient(circle,#0c0c0b 0 1px,transparent 1.4px) 0 0/2px 7px repeat-y}
.pk-stub span{width:34px;height:34px;border-radius:50%;border:1.5px dashed #5b5953;display:grid;place-items:center;color:#97948b}
@keyframes pk-rip{
  0%{transform:none;opacity:1}
  22%{transform:rotate(7deg) translateX(3px)}
  100%{transform:translate(120px,260px) rotate(58deg);opacity:0}
}
.pk-bit{position:absolute;right:26%;width:4px;height:3px;border-radius:1px;background:#d9d7d0;opacity:0;animation:pk-bit .8s .7s ease-out both}
@keyframes pk-bit{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(200deg)}}
.pk-badge{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 18px 0 12px;border-radius:999px;background:#bfe83a;color:#1a2305;font-weight:600;font-size:15px;animation:pk-pop .5s 1.25s cubic-bezier(.2,.9,.25,1.25) both}
.pk-badge i{width:22px;height:22px;border-radius:50%;background:#1a2305;color:#bfe83a;display:grid;place-items:center}
@keyframes pk-pop{from{opacity:0;transform:scale(.5);filter:blur(4px)}}
.pk-hint{font-size:12px;color:#97948b;opacity:0;animation:pk-fade .4s 1.8s ease both}
@media (prefers-reduced-motion:reduce){.pk-stub{animation-duration:.01ms!important}.pk-ticket{animation:none!important}}
`;

const bits = [
  ['30px', '70px'], ['56px', '40px'], ['18px', '110px'], ['70px', '90px'], ['40px', '130px'], ['8px', '60px'],
];

function PaidTicket({ info, onDone }: { info: PaidTicketInfo; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pk-scrim" role="status" aria-live="polite" onClick={onDone}>
      <style>{CSS}</style>
      <div className="pk-wrap">
        <div className="pk-ticket">
          <div className="pk-main">
            <div className="pk-top">
              <span>Bill</span>
              <span>{info.note ?? 'Paid in full'}</span>
            </div>
            <div>
              <div className="pk-name">{info.name}</div>
              <div className="pk-amt">{formatRupees(info.amountPaise)}</div>
            </div>
          </div>
          <div className="pk-stub" aria-hidden="true">
            <span><Check className="w-4 h-4" /></span>
          </div>
          {bits.map(([dx, dy], i) => (
            <i
              key={i}
              className="pk-bit"
              style={{ top: `${20 + i * 20}px`, ['--dx' as string]: dx, ['--dy' as string]: dy }}
            />
          ))}
        </div>
        <div className="pk-badge">
          <i><Check className="w-3.5 h-3.5" strokeWidth={3} /></i>
          Paid
        </div>
        <div className="pk-hint">Tap anywhere to close</div>
      </div>
    </div>
  );
}

/** Returns `celebrate(info)` to call when a bill is paid, and a node to render once in the view. */
export function usePaidTicket() {
  const [info, setInfo] = useState<PaidTicketInfo | null>(null);
  const close = useCallback(() => setInfo(null), []);
  const node = info ? <PaidTicket key={`${info.name}-${info.amountPaise}`} info={info} onDone={close} /> : null;
  return { celebrate: setInfo, node };
}
