import { useEffect, useState } from "react";
import api, { getErrorMsg } from "../api/axios";

// gets { stats, recent } from /dashboard (server decides by role)
export function useDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMsg(err)));
  }, []);

  return { data, error };
}
