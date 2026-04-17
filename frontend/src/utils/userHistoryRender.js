import React from 'react';

export const formatPermissionCode = (code) => {
  const raw = String(code || '');
  if (!raw) return raw;
  const pretty = raw
    .split('.')
    .filter(Boolean)
    .map((part) => part.replace(/[_-]+/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
  return pretty || raw;
};

export const formatHistoryPayload = (payload) => {
  if (payload == null) return '';
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    const looksLikeJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return payload;
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

export const parseHistoryPayload = (payload) => {
  if (payload == null) return { parsed: null, raw: payload };
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    const looksLikeJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return { parsed: null, raw: payload };
    try {
      return { parsed: JSON.parse(trimmed), raw: payload };
    } catch {
      return { parsed: null, raw: payload };
    }
  }
  return { parsed: payload, raw: payload };
};

export const FieldRow = ({ label, value }) => {
  const renderValue = (v) => {
    if (v == null || v === '') return <span className="text-gray-400">—</span>;
    if (Array.isArray(v)) {
      if (v.length === 0) return <span className="text-gray-400">—</span>;
      const isPermissionsRow = String(label || '').toLowerCase().includes('permission');
      return (
        <div className="flex flex-wrap gap-1">
          {v.map((x, idx) => (
            <span
              key={`${label}-${idx}`}
              className="px-2 py-0.5 text-[11px] border rounded bg-white text-gray-800"
              title={String(x)}
            >
              {isPermissionsRow ? formatPermissionCode(x) : String(x)}
            </span>
          ))}
        </div>
      );
    }
    if (typeof v === 'object') {
      return (
        <pre className="text-[11px] bg-white border rounded p-2 overflow-x-auto whitespace-pre-wrap">
          {formatHistoryPayload(v)}
        </pre>
      );
    }
    return <span className="break-words">{String(v)}</span>;
  };

  return (
    <div className="grid grid-cols-3 gap-2 py-1 border-b last:border-b-0">
      <div className="text-[11px] text-gray-500 col-span-1">{label}</div>
      <div className="text-[12px] text-gray-900 col-span-2">{renderValue(value)}</div>
    </div>
  );
};

export const pickEmployeeProfileFields = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const {
    fullName,
    dateOfBirth,
    phone,
    secondaryPhone,
    address,
    contractStart,
    contractEnd,
    position,
    notes,
    responsibilityAreas,
    permissions,
  } = obj;
  return {
    fullName,
    dateOfBirth,
    phone,
    secondaryPhone,
    address,
    contractStart,
    contractEnd,
    position,
    notes,
    responsibilityAreas,
    permissions,
  };
};

export const renderUserHistoryPayload = (it) => {
  const { parsed, raw } = parseHistoryPayload(it?.payload);

  // common case: role change recorded as audit event with type "user"
  if (it?.type === 'user' && parsed && typeof parsed === 'object') {
    const oldRole = parsed.oldRole ?? parsed.before?.role ?? null;
    const newRole = parsed.newRole ?? parsed.after?.role ?? null;
    const oldFullName = parsed.before?.fullName ?? null;
    const newFullName = parsed.after?.fullName ?? null;
    const oldEmail = parsed.before?.email ?? null;
    const newEmail = parsed.after?.email ?? null;

    const hasSimpleRoleChange = oldRole != null || newRole != null;
    const hasBeforeAfter =
      (parsed.before && typeof parsed.before === 'object') ||
      (parsed.after && typeof parsed.after === 'object');

    if (hasSimpleRoleChange && !hasBeforeAfter) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">Old</div>
            <FieldRow label="Role" value={oldRole} />
          </div>
          <div className="border rounded bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">New</div>
            <FieldRow label="Role" value={newRole} />
          </div>
        </div>
      );
    }

    if (hasBeforeAfter) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">Before</div>
            <FieldRow label="Full name" value={oldFullName} />
            <FieldRow label="Email" value={oldEmail} />
            <FieldRow label="Role" value={oldRole} />
          </div>
          <div className="border rounded bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">After</div>
            <FieldRow label="Full name" value={newFullName} />
            <FieldRow label="Email" value={newEmail} />
            <FieldRow label="Role" value={newRole} />
          </div>
        </div>
      );
    }
  }

  if (it?.type === 'permissions' && parsed && typeof parsed === 'object') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">Old</div>
            <FieldRow label="Role" value={parsed.oldRole} />
            <FieldRow label="Permissions" value={parsed.oldPermissions || []} />
            <FieldRow label="Responsibility areas" value={parsed.oldResponsibilityAreas || []} />
          </div>
          <div className="border rounded bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">New</div>
            <FieldRow label="Role" value={parsed.newRole} />
            <FieldRow label="Permissions" value={parsed.newPermissions || []} />
            <FieldRow label="Responsibility areas" value={parsed.newResponsibilityAreas || []} />
          </div>
        </div>
      </div>
    );
  }

  if (it?.type === 'employee_profile' && parsed && typeof parsed === 'object') {
    const before = pickEmployeeProfileFields(parsed.before);
    const after = pickEmployeeProfileFields(parsed.after);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded bg-white p-2">
          <div className="text-[11px] text-gray-500 mb-1">Before</div>
          {before ? (
            <div>
              {Object.entries(before).map(([k, v]) => (
                <FieldRow key={`before-${k}`} label={k} value={v} />
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">—</div>
          )}
        </div>
        <div className="border rounded bg-white p-2">
          <div className="text-[11px] text-gray-500 mb-1">After</div>
          {after ? (
            <div>
              {Object.entries(after).map(([k, v]) => (
                <FieldRow key={`after-${k}`} label={k} value={v} />
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">—</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-x-auto whitespace-pre-wrap">
      {typeof raw === 'string' ? formatHistoryPayload(raw) : formatHistoryPayload(raw)}
    </pre>
  );
};

