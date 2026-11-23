import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "./api";
export const Workspace = createContext(null);
export const useWorkspace = () => useContext(Workspace);
export function useData(path, version = 0) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api(path));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, version]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(path)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [path, version]);
  return { data, error, loading, reload: load };
}
