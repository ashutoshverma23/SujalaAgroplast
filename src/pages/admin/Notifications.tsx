import { Info, AlertTriangle, CheckCircle2, MoreVertical } from "lucide-react";

const NotificationItem = ({ title, message, time, type }: any) => {
  const getIcon = () => {
    switch (type) {
      case "ALERT": return <AlertTriangle className="text-rose-600" size={20} />;
      case "SUCCESS": return <CheckCircle2 className="text-emerald-600" size={20} />;
      default: return <Info className="text-blue-600" size={20} />;
    }
  };

  const getBg = () => {
    switch (type) {
      case "ALERT": return "bg-rose-50 border-rose-100";
      case "SUCCESS": return "bg-emerald-50 border-emerald-100";
      default: return "bg-blue-50 border-blue-100";
    }
  };

  return (
    <div className={`p-6 rounded-[2rem] border ${getBg()} flex items-start gap-4 transition-all hover:shadow-md`}>
      <div className="p-3 bg-white rounded-2xl shadow-sm">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <span className="text-xs font-bold text-gray-400">{time}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{message}</p>
        <div className="mt-4 flex items-center gap-3">
          <button className="text-xs font-bold text-emerald-600 hover:underline">Mark as read</button>
          <span className="text-gray-300">•</span>
          <button className="text-xs font-bold text-rose-600 hover:underline">Dismiss</button>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const notifications = [
    { title: "Low Stock Alert", message: "Inventory for 'Drip Irrigation Kit v2' is below the threshold at Hubli Main Store.", time: "2 hours ago", type: "ALERT" },
    { title: "New Dealer Registered", message: "Welcome Rahul Deshmukh from Dharwad region to the Sujala network.", time: "5 hours ago", type: "SUCCESS" },
    { title: "System Update", message: "We've updated the farmer registry to include GPS land mapping features.", time: "1 day ago", type: "INFO" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Notifications</h2>
          <p className="text-gray-500 font-medium mt-1">Stay updated with real-time activities across your network.</p>
        </div>
        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((n, i) => (
          <NotificationItem key={i} {...n} />
        ))}
      </div>
      
      <div className="text-center pt-8">
        <button className="text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors">
          View Notification History
        </button>
      </div>
    </div>
  );
};

export default Notifications;