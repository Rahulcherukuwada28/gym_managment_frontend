import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import api from '../../utils/api'; 

// 🎨 SIMPLE DARK THEME FOR CALENDAR (Matches your existing UI)
const customCalendarStyles = `
  .react-calendar { background: transparent !important; border: none !important; width: 100%; font-family: sans-serif; }
  .react-calendar__navigation button { color: white; font-weight: bold; font-size: 1.1rem; }
  .react-calendar__navigation button:enabled:hover { background: rgba(255,255,255,0.1); border-radius: 8px; }
  .react-calendar__month-view__weekdays { text-transform: uppercase; font-size: 0.7rem; color: rgba(255,255,255,0.5); }
  .react-calendar__tile { color: white; padding: 15px 0; font-size: 0.9rem; }
  .react-calendar__tile:enabled:hover { background: rgba(255,255,255,0.1); border-radius: 8px; }
  
  /* 🟢 PRESENT */
  .tile-present { background: #10b981 !important; color: white !important; border-radius: 50%; }
  
  /* 🔴 ABSENT */
  .tile-absent { background: #ef4444 !important; color: white !important; border-radius: 50%; }
  
  /* ⚫ PRE-JOIN */
  .tile-pre-join { background: #3f3f46 !important; color: #71717a !important; border-radius: 50%; opacity: 0.5; pointer-events: none; }
  
  .react-calendar__tile--now { background: transparent; border: 1px solid white; border-radius: 50%; }
`;

const MembersList = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // --- EXISTING MODALS ---
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [paymentDate, setPaymentDate] = useState('');
    const [daysOverdue, setDaysOverdue] = useState(0);

    // --- 🗓️ CALENDAR STATE ---
    const [calendarModalOpen, setCalendarModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState({ joining_date: null, present_dates: [] });
    const [selectedMemberName, setSelectedMemberName] = useState("");

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await api.get('members/'); 
            let data = response.data.members || response.data.results || response.data;
            if (!Array.isArray(data)) data = [];
            setMembers(data);
        } catch (err) {
            console.error("Failed to load members", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 🛠️ DATE FIXER (Ensures Local Time Match) ---
    const normalizeDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // --- 1. OPEN HISTORY ---
    const handleOpenHistory = async (member) => {
        setSelectedMemberName(member.name || member.first_name);
        setCalendarModalOpen(true);
        setHistoryData({ joining_date: null, present_dates: [] }); 

        try {
            const res = await api.get(`members/${member.id}/attendance-history/`);
            
            const cleanPresentDates = (res.data.present_dates || []).map(d => normalizeDate(d));
            const cleanJoinDate = normalizeDate(res.data.joining_date);

            setHistoryData({
                joining_date: cleanJoinDate,
                present_dates: cleanPresentDates 
            });
        } catch (err) {
            console.error("Failed to load history", err);
        }
    };

    // --- 2. CALENDAR LOGIC ---
    const getTileClassName = ({ date, view }) => {
        if (view !== 'month') return null;

        const dateStr = normalizeDate(date);
        const todayStr = normalizeDate(new Date());
        const joinDate = historyData.joining_date;

        if (dateStr > todayStr) return null;

        // 🟢 PRIORITY: Present (Green)
        if (historyData.present_dates.includes(dateStr)) {
            return 'tile-present';
        }

        // ⚫ Pre-Join (Grey)
        if (joinDate && dateStr < joinDate) {
            return 'tile-pre-join';
        }

        // 🔴 Absent (Red)
        if (joinDate && dateStr >= joinDate && dateStr <= todayStr) {
            return 'tile-absent';
        }

        return null;
    };

    // --- RENEW / DELETE HANDLERS ---
    const confirmDelete = (member) => { setMemberToDelete(member); setDeleteModalOpen(true); };
    
    const executeDelete = async () => {
        if (!memberToDelete) return;
        try { await api.delete(`members/${memberToDelete.id}/`); setMembers(prev => prev.filter(m => m.id !== memberToDelete.id)); setDeleteModalOpen(false); } catch (err) { alert("Archive failed."); }
    };

    // --- ✅ UPDATED RENEWAL LOGIC (Precise Calculation) ---
    const openRenewModal = (member) => {
        setSelectedMember(member);
        
        // Use local strings YYYY-MM-DD to calculate exact days diff
        const todayStr = new Date().toLocaleDateString('en-CA'); // e.g. 2023-12-27
        const expiryStr = member.end_date ? new Date(member.end_date).toLocaleDateString('en-CA') : todayStr;

        const todayObj = new Date(todayStr);
        const expiryObj = new Date(expiryStr);

        const diffTime = todayObj - expiryObj;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Exact day difference

        setDaysOverdue(diffDays); 
        setPaymentDate(todayStr); 
        setRenewModalOpen(true);
    };

    const submitRenewal = async () => {
        if (!selectedMember || !paymentDate) return;
        try { const response = await api.post(`members/${selectedMember.id}/renew/`, { payment_date: paymentDate });
            const newEndDate = response.data.new_end_date;
            setMembers(prev => prev.map(m => { if (m.id === selectedMember.id) return { ...m, end_date: newEndDate, expiry_date: newEndDate }; return m; }));
            setRenewModalOpen(false);
        } catch (err) { alert("Renewal failed."); }
    };

    // --- HELPERS ---
    const getDaysLeft = (dateString) => {
        if (!dateString) return null; const t = new Date(); t.setHours(0,0,0,0); const e = new Date(dateString); e.setHours(0,0,0,0);
        const diff = Math.ceil((e - t) / (1000 * 60 * 60 * 24));
        if (diff > 0) return { text: `(${diff} days left)`, color: "text-emerald-400/70" };
        if (diff === 0) return { text: "(Expires Today)", color: "text-orange-400/80" };
        return { text: `(${Math.abs(diff)} days ago)`, color: "text-red-400/60" };
    };
    const getMemberStatus = (endDate, graceDays = 4) => {
        if (!endDate) return { text: "N/A", color: "gray" }; const t = new Date(); t.setHours(0,0,0,0); const e = new Date(endDate); e.setHours(0,0,0,0);
        const g = new Date(e); g.setDate(e.getDate() + graceDays);
        if (t <= e) return { text: "Active", color: "green" }; if (t > e && t <= g) return { text: "Grace", color: "orange" }; return { text: "Expired", color: "red" };
    };
    const getStatusStyle = (color) => {
        if (color === 'green') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
        if (color === 'orange') return 'bg-orange-500/20 text-orange-200 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
        return 'bg-rose-500/20 text-rose-200 border-rose-500/30';
    };
    const formatDate = (dateString) => { if (!dateString) return "-"; const date = new Date(dateString); return isNaN(date) ? "-" : date.toLocaleDateString('en-GB'); };
    const filteredMembers = members.filter(m => ((m.name||"").toLowerCase().includes(searchTerm.toLowerCase()) || (m.phone||"").includes(searchTerm)) && (filterStatus === 'All' || getMemberStatus(m.end_date).text === filterStatus));

    return (
        <div className="min-h-screen bg-cover bg-center bg-fixed font-sans text-white" style={{ backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8693.jpg')" }}>
            <style>{customCalendarStyles}</style>
            
            <div className="min-h-screen w-full bg-black/40 backdrop-blur-sm overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                        <div>
                            <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest mb-2 transition-colors">← Back to Dashboard</button>
                            <h1 className="text-4xl font-bold drop-shadow-md">Member Database</h1>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <input type="text" placeholder="Search..." className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-sm focus:outline-none focus:bg-white/20 transition-all w-full md:w-64 placeholder:text-white/30" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <button onClick={() => navigate('/members/archived')} className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl font-bold transition-all flex items-center justify-center" title="View Archived Members"><span className="text-xl">📂</span></button>
                            <button onClick={() => navigate('/members/add')} className="px-6 py-3 bg-blue-600/80 hover:bg-blue-500 backdrop-blur-md text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 border border-white/10 whitespace-nowrap">+ Add Member</button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {['All', 'Active', 'Grace', 'Expired'].map((status) => (
                            <button key={status} onClick={() => setFilterStatus(status)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filterStatus === status ? (status === 'Active' ? 'bg-emerald-500 text-white border-emerald-400' : status === 'Grace' ? 'bg-orange-500 text-white border-orange-400' : status === 'Expired' ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-black border-white') : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'}`}>{status}</button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl pb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest w-[30%]">Name</th>
                                        <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest w-[20%]">Mobile</th>
                                        <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest w-[25%]">Expiry</th>
                                        <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest w-[10%]">Status</th>
                                        <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest w-[15%] text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-white/30 animate-pulse">Loading...</td></tr>
                                    ) : filteredMembers.length === 0 ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-white/30">No members found.</td></tr>
                                    ) : (
                                        filteredMembers.map((member) => {
                                            const date = member.end_date || member.expiry_date;
                                            const name = member.name || member.first_name;
                                            const phone = member.phone || member.mobile;
                                            const status = getMemberStatus(date);
                                            const daysLeft = getDaysLeft(date);
                                            return (
                                                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                                    {/* 🟢 CLICKABLE NAME */}
                                                    <td className="p-6 cursor-pointer" onClick={() => handleOpenHistory(member)}>
                                                        <div className="font-bold text-lg flex items-center gap-2">
                                                            {name}
                                                            {/* Small hint icon */}
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0h18M5 10.5h.008v.008H5V10.5Zm0 4.5h.008v.008H5V15Zm0 4.5h.008v.008H5V19.5Z" />
                                                            </svg>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-white/70 font-mono text-sm">{phone}</td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-white/90 text-sm font-mono">{formatDate(date)}</span>
                                                            {daysLeft && <span className={`text-[10px] font-bold uppercase tracking-wide ${daysLeft.color}`}>{daysLeft.text}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md uppercase tracking-wider ${getStatusStyle(status.color)}`}>{status.text}</span>
                                                    </td>
                                                    <td className="p-6 text-center flex justify-center gap-2">
                                                        <button onClick={(e) => {e.stopPropagation(); openRenewModal(member)}} className="p-2 rounded-full hover:bg-blue-500/20 text-white/30 hover:text-blue-400 transition-all" title="Renew">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                        </button>
                                                        <button onClick={(e) => {e.stopPropagation(); confirmDelete(member)}} className="p-2 rounded-full hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all" title="Archive">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full text-xs font-bold tracking-widest text-white/60 shadow-lg">
                            TOTAL MEMBERS: {filteredMembers.length}
                        </div>
                    </div>
                </div>

                {/* --- 🗓️ CALENDAR MODAL (MATCHES RENEW MODAL STYLE) --- */}
                {calendarModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCalendarModalOpen(false)}></div>
                        <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white capitalize">{selectedMemberName}</h3>
                                <button onClick={() => setCalendarModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 mb-6 justify-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-emerald-400 flex items-center gap-1">● Present</span>
                                <span className="text-red-400 flex items-center gap-1">● Absent</span>
                                <span className="text-zinc-500 flex items-center gap-1">● Pre-Join</span>
                            </div>

                            <div className="flex justify-center">
                                <Calendar 
                                    tileClassName={getTileClassName}
                                    value={new Date()} 
                                    locale="en-US"
                                    prevLabel="‹" 
                                    nextLabel="›"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- RENEW MODAL (WITH 15-DAY LOGIC) --- */}
                {renewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRenewModalOpen(false)}></div>
                        <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold mb-1">Renew Subscription</h3>
                            <p className="text-white/50 text-sm mb-4">Updating status for <span className="text-white font-bold">{selectedMember?.name || selectedMember?.first_name}</span></p>
                            
                            {/* ⚠️ LOGIC FEEDBACK UI */}
                            <div className={`mt-2 mb-4 p-3 rounded-lg border text-xs ${daysOverdue > 15 ? 'bg-orange-500/10 border-orange-500/20 text-orange-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'}`}>
                                {daysOverdue > 15 ? (
                                    <>
                                        <p className="font-bold uppercase mb-1">⚠️ Long Gap ({daysOverdue} days)</p>
                                        <p className="opacity-70">Gap &gt; 15 days. <b>New Cycle</b> starts from Payment Date.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold uppercase mb-1">✓ Continuous Renewal</p>
                                        <p className="opacity-70">Gap ≤ 15 days. Plan <b>extends</b> from previous expiry.</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className={`text-xs font-bold uppercase tracking-wider ${daysOverdue > 15 ? 'text-orange-400' : 'text-emerald-200/80'}`}>
                                    {daysOverdue > 15 ? 'Confirm New Start Date' : 'Payment Date'}
                                </label>
                                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={`w-full bg-white/5 border text-white px-4 py-3 rounded-xl focus:outline-none ${daysOverdue > 15 ? 'border-orange-500/50 focus:border-orange-500' : 'border-white/20 focus:border-emerald-500/50'}`} />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setRenewModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-colors">Cancel</button>
                                <button onClick={submitRenewal} className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all">Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DELETE MODAL --- */}
                {deleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}></div>
                        <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] p-6 animate-in zoom-in duration-200">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Archive Member?</h3>
                                <p className="text-white/50 text-sm">Are you sure you want to remove <br/><span className="text-white font-bold">{memberToDelete?.name || memberToDelete?.first_name}</span>?</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-colors">No, Keep</button>
                                <button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all">Yes, Archive</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembersList;