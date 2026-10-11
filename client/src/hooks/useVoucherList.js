import { useEffect, useState } from "react";
import api, { getErrorMsg } from "../api/axios";

// loads /vouchers with filters + sorting, used by all list pages
// baseParams = fixed params for the page, eg. { status: "pending" }
export function useVoucherList(baseParams = {}, defaultSort = { sort: "created", order: "desc" }) {
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(defaultSort);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, rows: [], error: "" });

  const paramStr = JSON.stringify({ ...filters, ...baseParams, ...sort });
  const key = paramStr + "#" + reloadCount;

  useEffect(() => {
    let cancelled = false;
    api
      .get("/vouchers", { params: JSON.parse(paramStr) })
      .then((res) => {
        if (!cancelled) setResult({ key, rows: res.data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, rows: [], error: getErrorMsg(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [paramStr, key]);

  // click same column again -> flip order
  function toggleSort(column) {
    if (sort.sort === column) {
      setSort({ sort: column, order: sort.order === "asc" ? "desc" : "asc" });
    } else {
      setSort({ sort: column, order: "asc" });
    }
  }

  return {
    vouchers: result.rows,
    error: result.error,
    loading: result.key !== key,
    sort,
    toggleSort,
    setFilters,
    reload: () => setReloadCount((c) => c + 1),
  };
}
