"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { URL } from "@/utils/constants";
import Header from "@/component/header";
import Loader from "@/ui/loader";
import Link from "next/link";

export default function ClientOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    axios
      .get(`${URL}/orders/client`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        if (!mounted) return;
        if (res.data.code === 200) {
          setOrders(res.data.data || []);
        } else {
          setOrders([]);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => orders || [], [orders]);

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
            <h1 className="text-xl font-semibold text-black">My orders</h1>
            {rows.length === 0 ? (
              <div className="text-gray-700">No orders yet.</div>
            ) : (
              <div className="space-y-3">
                {rows.map((o) => (
                  <Link
                    key={o.id}
                    href={`/client/orders/${o.id}`}
                    className="block border rounded p-3 hover:bg-gray-50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-black">
                        <div className="text-sm text-gray-600">Order</div>
                        <div className="font-mono">{o.id}</div>
                      </div>
                      <div className="text-black">
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="font-semibold">{o.status}</div>
                      </div>
                      <div className="text-black">
                        <div className="text-sm text-gray-600">Yacht</div>
                        <div className="font-semibold">
                          {o.offer?.yachtName || "—"} {o.offer?.yachtModel ? `(${o.offer.yachtModel})` : ""}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

