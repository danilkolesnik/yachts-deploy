import React, { useMemo } from "react";
import { Button, Select, Option } from "@material-tailwind/react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const PaginationBar = ({
  page,
  limit,
  total,
  hasMore,
  onPageChange,
  onLimitChange,
  limitOptions = [25, 50, 100, 200],
  className = "",
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 50);
  const safeTotal = Math.max(0, Number(total) || 0);

  const pageCount = useMemo(() => {
    if (!safeTotal) return 1;
    return Math.max(1, Math.ceil(safeTotal / safeLimit));
  }, [safeLimit, safeTotal]);

  const from = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const to = safeTotal === 0 ? 0 : clamp(safePage * safeLimit, 1, safeTotal);

  const canPrev = safePage > 1;
  const canNext = safePage < pageCount && (hasMore ?? true);

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${className}`}>
      <div className="text-sm text-gray-700">
        {safeTotal ? (
          <span>
            Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{" "}
            <span className="font-medium">{safeTotal}</span>
          </span>
        ) : (
          <span>Showing 0 results</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="w-full sm:w-40">
          <Select
            label="Per page"
            value={String(safeLimit)}
            onChange={(v) => onLimitChange?.(Number(v))}
            className="text-black"
            labelProps={{ className: "text-black" }}
          >
            {limitOptions.map((n) => (
              <Option key={n} className="text-black" value={String(n)}>
                {n}
              </Option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          <Button
            variant="outlined"
            color="blue"
            onClick={() => onPageChange?.(safePage - 1)}
            disabled={!canPrev}
            className="w-full sm:w-auto"
          >
            Prev
          </Button>
          <div className="text-sm text-gray-700 min-w-[120px] text-center">
            Page <span className="font-medium">{safePage}</span> / <span className="font-medium">{pageCount}</span>
          </div>
          <Button
            variant="outlined"
            color="blue"
            onClick={() => onPageChange?.(safePage + 1)}
            disabled={!canNext}
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationBar;

