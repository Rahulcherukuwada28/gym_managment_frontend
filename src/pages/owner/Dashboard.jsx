import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api'; 

const Dashboard = () => {
    const navigate = useNavigate();
    
    // --- 🕒 CLOCK STATE (NEW) ---
    const [currentTime, setCurrentTime] = useState(new Date());

    // Initial State
    const [stats, setStats] = useState({
        active_members: { count: 0, names: [] },
        grace_period: { count: 0, names: [] },
        expired: { count: 0, names: [] },
        today_visits: { count: 0, names: [] }
    });
    
    const [selectedCategory, setSelectedCategory] = useState(null); 

    // --- 🕒 CLOCK EFFECT (NEW) ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Data from Backend
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('dashboard/summary/');
                setStats({
                    active_members: response.data.active_members || { count: 0, names: [] },
                    grace_period: response.data.grace_period || { count: 0, names: [] },
                    expired: response.data.expired || { count: 0, names: [] },
                    today_visits: response.data.today_visits || { count: 0, names: [] } 
                });
            } catch (err) {
                console.error("Dashboard sync failed:", err);
            }
        };
        fetchStats();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const openList = (title, data, variant) => {
        setSelectedCategory({ title, data, variant });
    };

    // Smart Date Logic
    const getDaysLeft = (dateString) => {
        if (!dateString) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0); 
        const expiry = new Date(dateString); expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) return { text: `${diffDays} days left`, color: "text-emerald-400" };
        if (diffDays === 0) return { text: "Expires Today", color: "text-orange-400" };
        if (diffDays >= -4) return { text: "Grace Period", color: "text-orange-400 font-bold" };
        return { text: `Expired ${Math.abs(diffDays)} days ago`, color: "text-red-400" };
    };

    return (
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed font-sans text-white"
            style={{ backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8693.jpg')" }}
        >
            <div className="min-h-screen w-full bg-black/40 backdrop-blur-sm overflow-y-auto">

                {/* Navbar */}
                <nav className="sticky top-0 z-40 border-b border-white/20 bg-white/10 backdrop-blur-xl shadow-lg">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/30 to-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                                <span className="font-bold text-xl drop-shadow-md">R</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg tracking-tight">Fitness</h1>
                                <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">Admin Console</p>
                            </div>
                        </div>

                        {/* RIGHT SIDE: CLOCK + LOGOUT */}
                        <div className="flex items-center gap-6">
                            
                            {/* 🕒 CLOCK WIDGET */}
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-xl font-mono font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                                    {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            <button onClick={handleLogout} className="px-5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all">
                                LOG OUT
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-6 py-10">
                    <div className="mb-10">
                        <h2 className="text-4xl font-bold mb-2 drop-shadow-lg">Dashboard</h2>
                        <p className="text-white/70 font-medium">Real-time overview. Click cards for details.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <StatCard title="Active Members" data={stats.active_members} icon="🟢" onClick={() => openList("Active Members", stats.active_members, "success")} />
                        <StatCard title="Grace Period" data={stats.grace_period} icon="🟠" variant="warning" onClick={() => openList("In Grace Period", stats.grace_period, "warning")} />
                        <StatCard title="Expired" data={stats.expired} icon="🔴" variant="danger" onClick={() => openList("Expired Members", stats.expired, "danger")} />
                        <StatCard title="Today's Visits" data={stats.today_visits} icon="🔵" onClick={() => openList("Today's Visits", stats.today_visits, "info")} />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div onClick={() => navigate('/members')} className="group cursor-pointer md:col-span-2 relative overflow-hidden rounded-3xl border border-white/30 p-8 hover:scale-[1.01] transition-all bg-white/5 backdrop-blur-xl">
                            <h3 className="text-2xl font-bold mb-2">Member Management</h3>
                            <p className="text-white/70">Access master database and payment history.</p>
                        </div>
                        <div onClick={() => navigate('/members/add')} className="group cursor-pointer relative overflow-hidden rounded-3xl border border-dashed border-white/40 p-8 flex flex-col justify-center items-center text-center hover:bg-white/10 transition-all">
                            <div className="text-3xl font-light mb-2">+</div>
                            <h3 className="text-lg font-bold">New Registration</h3>
                        </div>
                    </div>
                </main>

                {/* Modal Logic */}
                {selectedCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedCategory(null)}></div>
                        <div className="relative w-full max-w-lg max-h-[80vh] bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-bold tracking-tight">{selectedCategory.title}</h3>
                                <button onClick={() => setSelectedCategory(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white">✕</button>
                            </div>
                            <div className="overflow-y-auto p-2 custom-scrollbar">
                                {selectedCategory.data?.names?.length > 0 ? (
                                    <div className="space-y-1">
                                        {selectedCategory.data.names.map((person, index) => {
                                            const daysInfo = getDaysLeft(person.end_date);
                                            return (
                                                <div key={index} className="flex justify-between items-center p-4 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${selectedCategory.variant === 'danger' ? 'bg-red-500' : selectedCategory.variant === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                                        <span className="font-medium text-lg text-white/90 group-hover:text-white">{person.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-white/30 block uppercase tracking-wider mb-0.5">Expiry</span>
                                                        <span className="text-sm font-mono text-white/80 block">{formatDate(person.end_date)}</span>
                                                        {daysInfo && <span className={`text-[10px] font-bold uppercase tracking-wide block mt-0.5 ${daysInfo.color}`}>{daysInfo.text}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-white/30 italic flex flex-col items-center gap-2"><span className="text-2xl">📭</span><span>No records found.</span></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }`}</style>
        </div>
    );
};

// Helper Functions
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const StatCard = ({ title, data, icon, variant, onClick }) => {
    const count = data?.count || 0;
    let bgStyle = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)';
    let borderStyle = 'border-white/20';
    let textGlow = '';

    if (variant === 'warning') { bgStyle = 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0.05) 100%)'; borderStyle = 'border-orange-500/30'; textGlow = 'text-orange-100'; } 
    else if (variant === 'danger') { bgStyle = 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)'; borderStyle = 'border-rose-500/30'; textGlow = 'text-rose-100'; }

    return (
        <div onClick={onClick} className={`relative overflow-hidden rounded-2xl p-6 border ${borderStyle} shadow-lg transition-all hover:-translate-y-1 hover:brightness-110 cursor-pointer group`} style={{ background: bgStyle, backdropFilter: 'blur(16px)' }}>
            <div className="flex justify-between items-start mb-4"><h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">{title}</h3><span className="text-2xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{icon}</span></div>
            <div className="flex items-end gap-2"><span className={`text-5xl font-bold tracking-tighter drop-shadow-xl ${textGlow}`}>{count}</span><span className="text-[10px] text-white/40 mb-2 font-medium bg-white/10 px-2 py-1 rounded-full group-hover:bg-white/20 transition-colors">View List</span></div>
        </div>
    );
};

export default Dashboard;