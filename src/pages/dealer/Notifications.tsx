import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";

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

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/notifications", {
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
      const res = await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
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
          {notifications.map((n: any) => (
            <NotificationItem key={n.id} {...n} onRead={markAsRead} />
          ))}
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
