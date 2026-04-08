"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { URL } from "@/utils/constants";
import Header from "@/component/header";
import Loader from "@/ui/loader";
import Image from "next/image";
import ReactPlayer from "react-player";
import { Tab } from "@headlessui/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ClientOrderDetailPage({ params }) {
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [timerHistory, setTimerHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newKind, setNewKind] = useState("comment");
  const [sending, setSending] = useState(false);

  const refreshAll = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
    const [o, sh, th, msgs] = await Promise.allSettled([
      axios.get(`${URL}/orders/client/${id}`, { headers: authHeaders }),
      axios.get(`${URL}/orders/client/${id}/status-history`, { headers: authHeaders }),
      axios.get(`${URL}/orders/client/${id}/timer/history`, { headers: authHeaders }),
      axios.get(`${URL}/orders/client/${id}/messages`, { headers: authHeaders }),
    ]);

    if (o.status === "fulfilled" && o.value.data.code === 200) setOrder(o.value.data.data);
    if (sh.status === "fulfilled" && sh.value.data.code === 200) setStatusHistory(sh.value.data.data || []);
    if (th.status === "fulfilled" && th.value.data.code === 200) setTimerHistory(th.value.data.data || []);
    if (msgs.status === "fulfilled" && msgs.value.data.code === 200) setMessages(msgs.value.data.data || []);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    refreshAll()
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mediaTabs = useMemo(() => {
    if (!order) return [];
    return [
      { name: "Before", images: order.processImageUrls || [], videos: order.processVideoUrls || [] },
      { name: "In progress", images: order.resultImageUrls || [], videos: order.resultVideoUrls || [] },
      { name: "Result", images: order.tabImageUrls || [], videos: order.tabVideoUrls || [] },
    ];
  }, [order]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.post(`${URL}/orders/client/${id}/messages`, {
        kind: newKind,
        message: newMessage.trim(),
      }, { headers: authHeaders });
      if (res.data.code === 201) {
        setNewMessage("");
        await refreshAll();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <Loader loading={loading} />
          </div>
        ) : (
          <div className="w-full space-y-4 bg-white rounded shadow-md p-4">
            <div className="flex flex-col gap-2">
              <div className="text-black">
                <div className="text-sm text-gray-600">Order</div>
                <div className="font-mono">{order?.id}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-black">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-semibold">{order?.status}</div>
                </div>
                <div className="text-black">
                  <div className="text-sm text-gray-600">Yacht</div>
                  <div className="font-semibold">
                    {order?.offer?.yachtName || "—"}{" "}
                    {order?.offer?.yachtModel ? `(${order.offer.yachtModel})` : ""}
                  </div>
                </div>
                <div className="text-black">
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="font-semibold">
                    {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-black mb-2">Media</h2>
              <Tab.Group>
                <Tab.List className="flex space-x-2 border-b">
                  {mediaTabs.map((t) => (
                    <Tab
                      key={t.name}
                      className={({ selected }) =>
                        classNames(
                          "px-3 py-2 text-sm font-medium",
                          selected ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-700"
                        )
                      }
                    >
                      {t.name}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="mt-3">
                  {mediaTabs.map((t) => (
                    <Tab.Panel key={t.name}>
                      <div className="space-y-4">
                        {t.images.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {t.images.map((url, idx) => (
                              <div key={idx} className="relative">
                                <Image
                                  src={url}
                                  alt="Order image"
                                  width={800}
                                  height={600}
                                  className="w-full h-auto rounded shadow"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-600">No images.</div>
                        )}
                        {t.videos.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {t.videos.map((url, idx) => (
                              <div key={idx} className="rounded overflow-hidden shadow">
                                <ReactPlayer url={url} controls width="100%" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-black mb-2">Work progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <div className="text-sm font-medium text-black mb-2">Status history</div>
                  <div className="space-y-2">
                    {(statusHistory || []).map((h) => (
                      <div key={h.id} className="text-sm text-black flex justify-between gap-2">
                        <span className="font-mono">{h.newStatus}</span>
                        <span className="text-gray-600">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString() : ""}
                        </span>
                      </div>
                    ))}
                    {(!statusHistory || statusHistory.length === 0) && (
                      <div className="text-gray-600 text-sm">No history.</div>
                    )}
                  </div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-sm font-medium text-black mb-2">Timers</div>
                  <div className="space-y-2">
                    {(timerHistory || []).map((t) => (
                      <div key={t.id} className="text-sm text-black flex justify-between gap-2">
                        <span>{t.status}</span>
                        <span className="text-gray-600">
                          {t.startTime ? new Date(t.startTime).toLocaleString() : ""}
                        </span>
                      </div>
                    ))}
                    {(!timerHistory || timerHistory.length === 0) && (
                      <div className="text-gray-600 text-sm">No timers.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-black mb-2">Request additional work / comments</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  className="border rounded p-2 text-black"
                >
                  <option value="comment">Comment</option>
                  <option value="additional_work">Additional work</option>
                </select>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="border rounded p-2 text-black md:col-span-2"
                  placeholder="Write your request / comment..."
                />
              </div>
              <div className="mt-2">
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {(messages || []).map((m) => (
                  <div key={m.id} className="border rounded p-3">
                    <div className="text-xs text-gray-600 flex justify-between gap-2">
                      <span className="uppercase">{m.kind}</span>
                      <span>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</span>
                    </div>
                    <div className="text-black mt-1 whitespace-pre-wrap">{m.message}</div>
                  </div>
                ))}
                {(!messages || messages.length === 0) && (
                  <div className="text-gray-600 text-sm">No messages yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

