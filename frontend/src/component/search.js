import { useEffect, useRef, useState } from 'react';

export function partMatchesQuery(item, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    const fields = [
        item?.name,
        item?.articleNumber,
        item?.countryCode,
        item?.serviceCategory?.serviceName,
    ];
    return fields.some((value) => String(value || '').toLowerCase().includes(q));
}

const SearchInput = ({ search, setSearch, filteredData, onSearchSelect }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const query = String(search || '').trim();
    const matches = Array.isArray(filteredData) ? filteredData : [];

    useEffect(() => {
        const onPointerDown = (event) => {
            if (!wrapRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const choose = (item) => {
        onSearchSelect(item);
        setOpen(false);
    };

    return (
        <div className="relative z-[9999]" ref={wrapRef}>
            <input
                type="text"
                placeholder="Search by name or article number…"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => {
                    if (query) setOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200 text-black w-full md:w-80"
            />
            {open && query && (
                <div className="absolute z-[9999] w-full md:w-96 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-[70vh] overflow-y-auto overscroll-contain">
                    {matches.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No matches</div>
                    ) : (
                        matches.map((item) => (
                            <button
                                key={item.id || `${item.name}-${item.articleNumber}`}
                                type="button"
                                className="block w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 text-black border-b border-gray-100 last:border-b-0"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => choose(item)}
                            >
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                    {String(item.articleNumber || '').trim()
                                        ? `Art. ${item.articleNumber}`
                                        : 'No article'}
                                    {item.quantity != null && item.quantity !== ''
                                        ? ` · Qty ${item.quantity}`
                                        : ''}
                                    {item.pricePerUnit != null && item.pricePerUnit !== ''
                                        ? ` · ${item.pricePerUnit}€`
                                        : ''}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchInput;
