import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api'; 

const ArchivedMembers = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🆕 State for Custom "In-App" Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        fetchArchived();
    }, []);

    const fetchArchived = async () => {
        try {
            const response = await api.get('members/archived/');
            const data = response.data.members ? response.data.members : response.data;
            setMembers(data);
        } catch (err) {
            console.error("Failed to load archives", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        // Quick restore doesn't need a heavy modal, but we can add one if preferred.
        // For now, keeping restore simple.
        try {
            await api.post(`members/${id}/restore/`);
            setMembers(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error("Restore failed", err);
        }
    };

    // 🟢 STEP 1: Open the Custom App Modal (No browser popup)
    const initiateDelete = (member) => {
        setSelectedMember(member);
        setDeleteModalOpen(true);
    };

    // 🟢 STEP 2: Execute Delete when user clicks "Confirm" in Modal
    const confirmDelete = async () => {
        if (!selectedMember) return;
        
        try {
            await api.delete(`members/${selectedMember.id}/permanent-delete/`);
            // Update UI
            setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
            // Close Modal
            setDeleteModalOpen(false);
            setSelectedMember(null);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Error deleting member. Check connection."); // Only fallback for errors
            setDeleteModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center bg-fixed font-sans text-white" style={{ backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8693.jpg')" }}>
            <div className="min-h-screen w-full bg-black/40 backdrop-blur-sm overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <button onClick={() => navigate('/members')} className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest mb-2 transition-colors">← Back to Active List</button>
                            <h1 className="text-4xl font-bold drop-shadow-md text-white/80">Archived Members</h1>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl pb-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest">Name</th>
                                    <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest">Mobile</th>
                                    <th className="p-6 font-bold text-white/50 uppercase text-[10px] tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="3" className="p-10 text-center text-white/30">Loading...</td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan="3" className="p-10 text-center text-white/30">No archived members found.</td></tr>
                                ) : (
                                    members.map((member) => (
                                        <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-6 font-bold text-lg text-white/60">{member.name || member.first_name}</td>
                                            <td className="p-6 text-white/50 font-mono text-sm">{member.phone}</td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-3">
                                                    
                                                    {/* Restore Button */}
                                                    <button 
                                                        onClick={() => handleRestore(member.id)} 
                                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                                                    >
                                                        <span>Restore</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                                        </svg>
                                                    </button>

                                                    {/* Delete Button (Triggers App Modal) */}
                                                    <button 
                                                        onClick={() => initiateDelete(member)} 
                                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                                                    >
                                                        <span>Delete</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🔴 CUSTOM IN-APP MODAL (Overlay) */}
                {deleteModalOpen && selectedMember && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                            
                            {/* Modal Header */}
                            <div className="bg-red-500/10 p-6 border-b border-red-500/20">
                                <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    Permanent Delete
                                </h3>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 text-center">
                                <p className="text-white/70 mb-2">
                                    Are you sure you want to delete <br/>
                                    <span className="text-white font-bold text-lg">{selectedMember.name || selectedMember.first_name}</span>?
                                </p>
                                <p className="text-xs text-white/40 uppercase tracking-widest mt-4">
                                    ⚠️ Action cannot be undone
                                </p>
                            </div>

                            {/* Modal Actions */}
                            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                                <button 
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50 rounded-xl font-bold transition-transform active:scale-95"
                                >
                                    Yes, Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* End Modal */}

            </div>
        </div>
    );
};

export default ArchivedMembers;