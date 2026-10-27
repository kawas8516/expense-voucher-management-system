import { useSearchParams } from "react-router-dom";

// starting filter from the URL, eg. /director/vouchers?status=approved -> { status: "approved" }
// (the Vouchers menu in the navbar links to these)
export function useStatusParam() {
  const [params] = useSearchParams();
  const status = params.get("status");
  return status ? { status } : {};
}
