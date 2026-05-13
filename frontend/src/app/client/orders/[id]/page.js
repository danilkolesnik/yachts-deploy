"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { URL } from "@/utils/constants";
import Header from "@/component/header";
import Loader from "@/ui/loader";
import ReactPlayer from "react-player";
import { Tab } from "@headlessui/react";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { PermissionsList } from "@/constants/permissions";
import { can } from "@/utils/canPermission";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { XMarkIcon } from "@heroicons/react/24/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ClientOrderDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const session = useAppSelector((s) => s.userData?.session ?? null);
  const permissions = useAppSelector((s) => s.userData?.permissions || []);
  const canViewOrder = can(permissions, PermissionsList.SELF_ORDERS_READ);
  const canPostMessages = can(permissions, PermissionsList.SELF_ORDERS_MESSAGES_WRITE);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [timerHistory, setTimerHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newKind, setNewKind] = useState("comment");
  const [sending, setSending] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const normalizeArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  const getOfferServices = () => {
    const services = normalizeArray(order?.offer?.services);
    return services
      .map((s) => ({
        name: s?.label ?? s?.serviceName ?? s?.name ?? "",
        qty: s?.quantity ?? s?.qty ?? "",
        unit: s?.value?.unitsOfMeasurement ?? s?.unitsOfMeasurement ?? s?.unit ?? "",
      }))
      .filter((x) => x.name);
  };

  const getOfferParts = () => {
    const parts = normalizeArray(order?.offer?.parts);
    return parts
      .map((p) => ({
        name: p?.label ?? p?.name ?? "",
        qty: p?.quantity ?? p?.qty ?? "",
        unit: p?.unitsOfMeasurement ?? p?.unit ?? "",
        articleNumber: p?.articleNumber ?? "",
        warehouse: p?.warehouse ?? "",
      }))
      .filter((x) => x.name);
  };

  const getOrderServices = () => {
    const services = normalizeArray(order?.services?.length ? order?.services : order?.offer?.services);
    return services
      .map((s) => ({
        serviceName: s?.serviceName ?? s?.label ?? s?.name ?? "",
        unitsOfMeasurement: s?.unitsOfMeasurement ?? s?.value?.unitsOfMeasurement ?? s?.unit ?? "",
        quantity: s?.quantity ?? s?.qty ?? 1,
      }))
      .filter((x) => x.serviceName);
  };

  const getOrderParts = () => {
    const parts = normalizeArray(order?.parts?.length ? order?.parts : order?.offer?.parts);
    return parts
      .map((p) => ({
        partName: p?.partName ?? p?.label ?? p?.name ?? "",
        quantity: p?.quantity ?? p?.qty ?? 1,
        articleNumber: p?.articleNumber ?? "",
        warehouse: p?.warehouse ?? "",
      }))
      .filter((x) => x.partName);
  };

  const refreshAll = async () => {
    if (!canViewOrder) return;
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
    if (session !== true) {
      if (session === false) setLoading(false);
      else setLoading(true);
      return () => {
        mounted = false;
      };
    }
    if (!id) {
      setOrder(null);
      setStatusHistory([]);
      setTimerHistory([]);
      setMessages([]);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    if (!canViewOrder) {
      setOrder(null);
      setStatusHistory([]);
      setTimerHistory([]);
      setMessages([]);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    setLoading(true);
    refreshAll()
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canViewOrder, session]);

  const mediaTabs = useMemo(() => {
    if (!order) return [];
    return [
      { name: "Before", images: order.processImageUrls || [], videos: order.processVideoUrls || [] },
      { name: "In progress", images: order.resultImageUrls || [], videos: order.resultVideoUrls || [] },
      { name: "Result", images: order.tabImageUrls || [], videos: order.tabVideoUrls || [] },
    ];
  }, [order]);

  const openGallery = (images, startIndex) => {
    const items = (Array.isArray(images) ? images : [])
      .filter(Boolean)
      .map((url) => ({
        original: url,
        thumbnail: url,
        originalAlt: "Order image",
        thumbnailAlt: "Order image thumbnail",
      }));
    setGalleryItems(items);
    setSelectedImageIndex(Math.max(0, Math.min(startIndex ?? 0, Math.max(0, items.length - 1))));
    setShowGallery(true);
  };

  const sendMessage = async () => {
    if (!canPostMessages || !newMessage.trim()) return;
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
        {session === null || loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <Loader loading={session === null || loading} />
          </div>
        ) : !id ? (
          <div className="w-full space-y-4 bg-white rounded shadow-md p-4">
            <p className="text-gray-700 text-sm">Order not found.</p>
          </div>
        ) : !canViewOrder ? (
          <div className="w-full space-y-4 bg-white rounded shadow-md p-4">
            <p className="text-gray-700 text-sm">
              You do not have permission to view this order in the client portal. Contact the office if you need access.
            </p>
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
              <h2 className="text-lg font-semibold text-black mb-2">Order works & materials</h2>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="font-semibold text-black mb-2">Works / services</div>
                    {getOrderServices().length === 0 ? (
                      <div className="text-sm text-gray-600">No services in order</div>
                    ) : (
                      <div className="space-y-2 text-sm text-black">
                        {getOrderServices().map((s, idx) => (
                          <div key={`${s.serviceName}-${idx}`} className="flex items-start justify-between gap-3">
                            <div className="font-medium">{s.serviceName}</div>
                            <div className="text-right text-gray-700 whitespace-nowrap">
                              <span>
                                {String(s.quantity || 1)} {s.unitsOfMeasurement || ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="font-semibold text-black mb-2">Parts / materials</div>
                    {getOrderParts().length === 0 ? (
                      <div className="text-sm text-gray-600">No parts in order</div>
                    ) : (
                      <div className="space-y-2 text-sm text-black">
                        {getOrderParts().map((p, idx) => (
                          <div key={`${p.partName}-${idx}`} className="flex items-start justify-between gap-3">
                            <div className="font-medium">{p.partName}</div>
                            <div className="text-right text-gray-700 whitespace-nowrap">
                              <span>{String(p.quantity || 1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  Offer snapshot (read-only): {getOfferServices().length} services, {getOfferParts().length} parts.
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
                              <div
                                key={idx}
                                className="relative cursor-pointer group"
                                onClick={() => openGallery(t.images, idx)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") openGallery(t.images, idx);
                                }}
                              >
                                <img
                                  src={url}
                                  alt="Order image"
                                  loading="lazy"
                                  className="w-full h-auto rounded shadow transition-transform group-hover:scale-[1.01]"
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
                        <span>
                          {t.status}
                          {t.serviceLineIndex != null && (
                            <span className="text-gray-500"> · line #{Number(t.serviceLineIndex) + 1}</span>
                          )}
                        </span>
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
              {canPostMessages ? (
                <>
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
                </>
              ) : (
                <p className="text-sm text-gray-600 mb-3">Sending messages is disabled for your account. You can still read the thread below.</p>
              )}

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

      {showGallery && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="w-full h-full p-4">
            <div className="relative w-full h-full">
              <ImageGallery
                items={galleryItems}
                startIndex={selectedImageIndex}
                showFullscreenButton={true}
                showPlayButton={false}
                showThumbnails={true}
                showNav={true}
                showBullets={true}
                infinite={true}
                thumbnailPosition="bottom"
                onClick={() => setShowGallery(false)}
              />
              <button
                onClick={() => setShowGallery(false)}
                className="absolute top-4 right-4 text-white z-50 bg-black/50 rounded-full p-2 hover:bg-black/70"
                aria-label="Close gallery"
                type="button"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

