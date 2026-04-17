"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Header from "@/component/header";
import Loader from "@/ui/loader";
import { URL } from "@/utils/constants";
import { Button, Select, Option } from "@material-tailwind/react";
import Input from "@/ui/Input";
import ReactSelect from "react-select";
import { ClipLoader } from "react-spinners";
import { renderUserHistoryPayload } from "@/utils/userHistoryRender";
import { toast } from "react-toastify";

const UsersHistoryPage = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    targetUserId: "",
    actorName: "",
    actorRole: "",
    type: "",
  });

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    if (filters.targetUserId) qs.set("targetUserId", filters.targetUserId);
    if (filters.actorName) qs.set("actorName", filters.actorName);
    if (filters.actorRole) qs.set("actorRole", filters.actorRole);
    if (filters.type) qs.set("type", filters.type);
    return qs.toString();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${URL}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const list = res.data?.data || [];
      setUsers(list);
      setUserOptions(
        list.map((u) => ({
          value: u.id,
          label: u.fullName ? `${u.fullName} (${u.email || ""})` : u.email || String(u.id),
        }))
      );
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${URL}/users/history?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.data?.code === 200) {
        setItems(res.data.data || []);
      } else {
        toast.error(res.data?.message || "Failed to load history");
        setItems([]);
      }
    } catch (e) {
      console.error("Error loading users history:", e);
      if (e?.response?.status === 401) toast.error("Authorization required");
      else toast.error("Error loading history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const selectedTarget = useMemo(() => {
    if (!filters.targetUserId) return null;
    return userOptions.find((o) => String(o.value) === String(filters.targetUserId)) || null;
  }, [filters.targetUserId, userOptions]);

  const targetLabel = (it) => {
    if (it?.orderId) return `Order #${it.orderId}`;
    return it?.targetUser?.fullName || it?.targetUser?.email || it?.targetUserId || "—";
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
                <div className="text-sm text-gray-800 font-medium">Users history</div>
              </div>
              <Button color="blue" onClick={fetchHistory} disabled={loading} className="w-full md:w-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="From"
                name="from"
                type="datetime-local"
                value={filters.from}
                onChange={handleFilterChange}
              />
              <Input label="To" name="to" type="datetime-local" value={filters.to} onChange={handleFilterChange} />
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-black mb-1">Target user</div>
                <ReactSelect
                  options={userOptions}
                  value={selectedTarget}
                  onChange={(opt) => setFilters((p) => ({ ...p, targetUserId: opt ? String(opt.value) : "" }))}
                  isClearable
                  isSearchable
                  placeholder="All users"
                  className="text-black"
                  styles={{
                    control: (provided) => ({ ...provided, color: "black" }),
                    singleValue: (provided) => ({ ...provided, color: "black" }),
                    option: (provided, state) => ({
                      ...provided,
                      color: "black",
                      backgroundColor: state.isSelected ? "#e2e8f0" : "white",
                    }),
                  }}
                />
              </div>
              <Input
                label="By (name/email contains)"
                name="actorName"
                value={filters.actorName}
                onChange={handleFilterChange}
              />
              <Select
                label="By role"
                value={filters.actorRole}
                onChange={(value) => setFilters((p) => ({ ...p, actorRole: value || "" }))}
                className="text-black"
                labelProps={{ className: "text-black" }}
              >
                <Option className="text-black" value="">
                  Any
                </Option>
                <Option className="text-black" value="admin">
                  Admin
                </Option>
                <Option className="text-black" value="manager">
                  Manager
                </Option>
                <Option className="text-black" value="mechanic">
                  Mechanic
                </Option>
                <Option className="text-black" value="electrician">
                  Electrician
                </Option>
                <Option className="text-black" value="user">
                  User
                </Option>
                <Option className="text-black" value="client">
                  Client
                </Option>
              </Select>
              <Input label="Type (contains)" name="type" value={filters.type} onChange={handleFilterChange} />

              <Button
                variant="text"
                color="red"
                onClick={() =>
                  setFilters({
                    from: "",
                    to: "",
                    targetUserId: "",
                    actorName: "",
                    actorRole: "",
                    type: "",
                  })
                }
                className="w-full md:w-auto"
              >
                Clear filters
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-gray-700">No history.</div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={`${it.type}-${it.id}`} className="border rounded p-3 bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="font-mono">{it.type}</span>
                        <span className="text-gray-500">Target: {targetLabel(it)}</span>
                      </div>
                      <div className="text-xs text-gray-600">{it.at ? new Date(it.at).toLocaleString() : ""}</div>
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

export default UsersHistoryPage;

