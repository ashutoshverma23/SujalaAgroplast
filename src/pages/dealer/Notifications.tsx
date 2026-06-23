import { useState, useEffect } from "react";
import { Bell, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { BACKEND_URL } from '../../config';

const NotificationItem = ({ id, title, message, createdAt, isRead, onRead }: any) => {
  return (
    <div className={`p-6 rounded-[2rem] border ${isRead === 'true' ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-100'} flex items-start gap-4 transition-all hover:shadow-md`}>
      <div className={`p-3 rounded-2xl shadow-sm ${isRead === 'true' ? 'bg-white' : 'bg-blue-100'}`}>
        <Bell className={isRead === 'true' ? 'text-gray-400' : 'text-blue-600'} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`font-bold ${isRead === 'true' ? 'text-gray-600' : 'text-gray-900'}`}>{title}</h4>
          <span className="text-xs font-bold text-gray-400">{new Date(createdAt).toLocaleDateString('en-GB')}</span>
        </div>
        <p className={`text-sm mt-1 leading-relaxed ${isRead === 'true' ? 'text-gray-500' : 'text-gray-700'}`}>{message}</p>
        
        {isRead === 'false' && (
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => onRead(id)} className="text-xs font-bold text-emerald-600 hover:underline">Mark as read</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Pagination component ───────────────────────────────────────────────────
const Pagination = ({
  total,
  page,
  perPage,
  onPage,
}: {
  total: number;
  page: number;
  perPage: number;
  onPage: (p: number) => void;
}) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
      <p className="text-xs font-bold text-gray-400">
        Showing <span className="text-gray-700">{Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)}</span> of <span className="text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                p === page
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default function Notifications() {
  const [pageNum, setPageNum] = useState(1);
  const NOTIFS_PER_PAGE = 10;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Notifications</h2>
          <p className="text-gray-500 font-medium mt-1">Updates on your orders and payments.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-4">
            {notifications.slice((pageNum - 1) * NOTIFS_PER_PAGE, pageNum * NOTIFS_PER_PAGE).map((n: any) => (
              <NotificationItem key={n.id} {...n} onRead={markAsRead} />
            ))}
          </div>
          <Pagination
            total={notifications.length}
            page={pageNum}
            perPage={NOTIFS_PER_PAGE}
            onPage={(p) => { setPageNum(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-gray-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">No notifications</h4>
          <p className="text-gray-500 mt-2">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
