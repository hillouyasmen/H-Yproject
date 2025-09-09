import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const Ctx = createContext(null);

export function NotifProvider({ children }) {
  const [list, setList] = useState([]); // [{id,type,title,text,ts,read}]

  const add = useCallback((n) => {
    const item = {
      id: n.id ?? Date.now() + Math.random(),
      type: n.type || "info",
      title: n.title || n.type || "Notification",
      text: n.text || "",
      ts: n.ts || Date.now(),
      read: false,
    };
    setList((prev) => [item, ...prev].slice(0, 200));
  }, []);

  const markAllRead = useCallback(() => {
    setList((prev) => prev.map((x) => ({ ...x, read: true })));
  }, []);

  const clear = useCallback(() => setList([]), []);

  const unread = useMemo(() => list.filter((x) => !x.read).length, [list]);

  const value = useMemo(
    () => ({ list, add, markAllRead, clear, unread }),
    [list, add, markAllRead, clear, unread]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotif() {
  return (
    useContext(Ctx) || {
      list: [],
      add: () => {},
      markAllRead: () => {},
      clear: () => {},
      unread: 0,
    }
  );
}
