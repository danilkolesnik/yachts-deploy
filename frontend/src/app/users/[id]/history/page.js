"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Header from "@/component/header";
import Loader from "@/ui/loader";
import { URL } from "@/utils/constants";
import { Button } from "@material-tailwind/react";
import Input from "@/ui/Input";
import { ClipLoader } from "react-spinners";
import { renderUserHistoryPayload } from "@/utils/userHistoryRender";
import { toast } from "react-toastify";

const UserHistoryPage = ({ params }) => {
  const router = useRouter();
  const userId = params?.id;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    type: "",
  });

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    if (filters.type) qs.set("type", filters.type);
    return qs.toString();
  }, [filters.from, filters.to, filters.type]);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${URL}/users/${userId}/history${queryString ? `?${queryString}` : ""}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (res.data?.code === 200) {
        setItems(res.data.data || []);
      } else {
        toast.error(res.data?.message || "Failed to load history");
        setItems([]);
      }
    } catch (e) {
      console.error("Error loading history:", e);
      if (e?.response?.status === 401) toast.error("Authorization required");
      else toast.error("Error loading history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
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
          <div className="w-full space-y-6 bg-white rounded shadow-md p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button color="blue" onClick={() => router.push("/users")}>
                  Back
                </Button>
                <div className="text-sm text-gray-700">
                  History for user: <span className="font-mono">{userId}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  color="blue"
                  onClick={fetchHistory}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <ClipLoader size={13} color="#ffffff" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <span>Apply filters</span>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="From"
                name="from"
                type="datetime-local"
                value={filters.from}
                onChange={handleFilterChange}
              />
              <Input
                label="To"
                name="to"
                type="datetime-local"
                value={filters.to}
                onChange={handleFilterChange}
              />
              <Input
                label="Type (contains)"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              />
            </div>

            {items.length === 0 ? (
              <div className="text-gray-700">No history.</div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-xs text-gray-600">
                        <span className="font-mono">{it.type}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {it.at ? new Date(it.at).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-black">
                      <div className="text-xs text-gray-600">
                        By: {it.actor?.fullName || it.actor?.email || it.actorUserId || "—"}
                      </div>
                      <div className="mt-2">{renderUserHistoryPayload(it)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UserHistoryPage;

