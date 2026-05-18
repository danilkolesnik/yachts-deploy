'use client';

import React, { use, useEffect, useState } from 'react';
import axios from 'axios';
import { URL } from '@/utils/constants';
import Loader from '@/ui/loader';

const formatDt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const formatMsHms = (ms) => {
  if (ms == null || Number.isNaN(Number(ms))) return '—';
  const totalS = Math.floor(Number(ms) / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const timerActionLabel = (action) => {
  const map = {
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    adjusted: 'Duration adjusted',
    cleared: 'Timers cleared',
    'items.updated': 'Items updated',
  };
  return map[action] || action || '—';
};

export default function OrderReportPage({ params }) {
  const { id } = use(params);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    axios
      .get(`${URL}/orders/${id}/report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        if (res.data?.code === 200) {
          setReport(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load report');
        }
      })
      .catch((e) => {
        setError(e.response?.data?.message || e.message || 'Failed to load report');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen p-8 bg-white text-black">
        <p className="text-red-600">{error || 'Report not available'}</p>
      </div>
    );
  }

  const { order, createdByUser, timeline, statusHistory, assignmentHistory, timerSessions, timerEvents } =
    report;

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div className="flex justify-between items-start gap-4 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-4 py-2 border border-gray-300 rounded text-sm"
          >
            Close
          </button>
        </div>

        <header className="border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">Work order report</h1>
          <p className="text-sm text-gray-600 mt-1 font-mono">ID: {order?.id}</p>
          <p className="text-sm text-gray-600">Generated: {formatDt(report.generatedAt)}</p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-3">General</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-gray-600 w-40">Customer</td>
                <td className="py-2">{order?.offer?.customerFullName || '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-gray-600">Yacht</td>
                <td className="py-2">{order?.offer?.yachtName || '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-gray-600">Status</td>
                <td className="py-2">{order?.status || '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-gray-600">Created</td>
                <td className="py-2">{formatDt(order?.createdAt)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-gray-600">Created by</td>
                <td className="py-2">{createdByUser?.fullName || order?.createdBy || '—'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Full timeline</h2>
          {(timeline || []).length === 0 ? (
            <p className="text-sm text-gray-600">No events recorded.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {(timeline || []).map((row, idx) => (
                <li key={idx} className="border-l-2 border-gray-300 pl-4">
                  <div className="text-xs text-gray-500">{formatDt(row.at)}</div>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-gray-700">{row.detail}</div>
                  {row.actor && <div className="text-xs text-gray-500 mt-0.5">By: {row.actor}</div>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Status history</h2>
          <ul className="text-sm space-y-2">
            {(statusHistory || []).map((s) => (
              <li key={s.id} className="border rounded p-2">
                {formatDt(s.changedAt)} — {s.oldStatus || '—'} → {s.newStatus}
                {(s.changedByUser?.fullName || s.changedBy) && (
                  <span className="text-gray-500"> · {s.changedByUser?.fullName || s.changedBy}</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Works & materials corrections</h2>
          <ul className="text-sm space-y-2">
            {(timerEvents || [])
              .filter((e) => e.action === 'items.updated')
              .map((ev) => {
                const m = ev.meta || {};
                return (
                  <li key={ev.id} className="border rounded p-2">
                    <div>{formatDt(ev.changedAt)}</div>
                    <div className="text-gray-700">
                      Services: {m.servicesCountBefore ?? '—'} → {m.servicesCountAfter ?? '—'} · Parts:{' '}
                      {m.partsCountBefore ?? '—'} → {m.partsCountAfter ?? '—'}
                    </div>
                    {Array.isArray(m.servicesSummaryAfter) && m.servicesSummaryAfter.length > 0 && (
                      <div className="text-xs mt-1">Services: {m.servicesSummaryAfter.join(', ')}</div>
                    )}
                    {(ev.changedByUser?.fullName || ev.changedBy) && (
                      <div className="text-xs text-gray-500 mt-1">
                        Changed by: {ev.changedByUser?.fullName || ev.changedBy}
                      </div>
                    )}
                  </li>
                );
              })}
            {(timerEvents || []).filter((e) => e.action === 'items.updated').length === 0 && (
              <li className="text-gray-600">No corrections recorded.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Worker assignments</h2>
          <ul className="text-sm space-y-2">
            {(assignmentHistory || []).map((a) => (
              <li key={a.id} className="border rounded p-2">
                <div>{formatDt(a.changedAt)}</div>
                <div>
                  [{(a.oldWorkers || []).map((w) => w?.fullName).filter(Boolean).join(', ') || '—'}] → [
                  {(a.newWorkers || []).map((w) => w?.fullName).filter(Boolean).join(', ') || '—'}]
                </div>
                {a.changeReason && (
                  <div className="mt-1 text-gray-700">
                    <strong>Replacement reason:</strong> {a.changeReason}
                  </div>
                )}
                {(a.changedByUser?.fullName || a.changedBy) && (
                  <div className="text-xs text-gray-500 mt-1">
                    By: {a.changedByUser?.fullName || a.changedBy}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Timer sessions (archived)</h2>
          <ul className="text-sm space-y-2">
            {(timerSessions || []).map((t) => (
              <li key={t.id} className="border rounded p-2">
                <div className="font-medium">{t.status}</div>
                <div className="text-gray-600">
                  Line:{' '}
                  {t.serviceLineIndex == null ? '—' : `#${Number(t.serviceLineIndex) + 1}`} · Worker:{' '}
                  {t.worker?.fullName || t.userId || '—'} · Duration: {formatMsHms(t.totalDuration)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDt(t.startTime)}
                  {t.endTime ? ` — ${formatDt(t.endTime)}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Timer event log</h2>
          <ul className="text-sm space-y-2">
            {(timerEvents || [])
              .filter((e) => e.action !== 'items.updated')
              .map((ev) => {
                const m = ev.meta || {};
                return (
                  <li key={ev.id} className="border rounded p-2">
                    <div className="font-medium">
                      {timerActionLabel(ev.action)} · {formatDt(ev.changedAt)}
                    </div>
                    <div className="text-gray-600">
                      {ev.changedByUser?.fullName || ev.changedBy || '—'}
                      {m.serviceLineIndex != null ? ` · line #${Number(m.serviceLineIndex) + 1}` : ''}
                    </div>
                    {m.segmentWorkedMs != null && (
                      <div>Segment: {formatMsHms(m.segmentWorkedMs)}</div>
                    )}
                    {m.pauseBreakMs != null && <div>Break: {formatMsHms(m.pauseBreakMs)}</div>}
                    {m.activeWorkTotalMs != null && (
                      <div>Active total: {formatMsHms(m.activeWorkTotalMs)}</div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      </div>
    </div>
  );
}
