import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api'; // ✅ Smart API

const AddMember = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        mobile: '',
        startDate: new Date().toISOString().split('T')[0] // Defaults to Today
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 1. Validate Phone
        if (!/^\d{10}$/.test(formData.mobile)) {
            setError("Phone number must be exactly 10 digits.");
            setLoading(false);
            return;
        }

        // 2. Prepare Payload (MATCHING YOUR BACKEND VIEW EXACTLY)
        const payload = {
            name: formData.fullName,      // ✅ Backend expects 'name'
            phone: formData.mobile,       // ✅ Backend expects 'phone'
            start_date: formData.startDate // ✅ Backend expects 'start_date'
        };

        try {
            console.log("Sending Payload:", payload); // Debug log
            
            // 3. Send Request
            await api.post('members/', payload);

            // 4. Success
            navigate('/members');

        } catch (err) {
            console.error("Add Member Failed:", err);
            
            // Show REAL Server Error
            if (err.response && err.response.data) {
                // Formatting error object to string for display
                const serverMsg = typeof err.response.data === 'object' 
                    ? JSON.stringify(err.response.data).replace(/[{}"]/g, ' ') 
                    : err.response.data;
                setError(`Server Error: ${serverMsg}`);
            } else if (err.message) {
                setError(`Network Error: ${err.message}`);
            } else {
                setError("Unknown Error. Check Console.");
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/20 text-white text-lg px-5 py-4 rounded-xl focus:outline-none focus:bg-white/10 focus:border-blue-400/50 transition-all placeholder:text-white/20 backdrop-blur-xl";

    return (
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed font-sans text-white flex items-center justify-center p-4"
            style={{ backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8693.jpg')" }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 md:p-10">
                    
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold drop-shadow-md mb-2">New Member</h2>
                        <p className="text-white/50 text-sm">Enter details to activate monthly pass.</p>
                    </div>

                    {/* Error Box */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-xs font-mono break-words animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-blue-200/80 ml-1 tracking-wider">Full Name</label>
                            <input name="fullName" type="text" placeholder="e.g. Rahul" required className={inputClass} value={formData.fullName} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-blue-200/80 ml-1 tracking-wider">Phone Number</label>
                            <input 
                                name="mobile" type="tel" maxLength="10" placeholder="9876543210" required className={inputClass} value={formData.mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, mobile: val });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-blue-200/80 ml-1 tracking-wider">Start Date</label>
                            <input name="startDate" type="date" required className={`${inputClass} appearance-none`} value={formData.startDate} onChange={handleChange} />
                        </div>

                        <button 
                            type="submit" disabled={loading}
                            className="w-full py-4 mt-6 font-bold rounded-xl text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                            bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-400/30"
                        >
                            {loading ? 'Activating...' : 'Confirm Registration'}
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => navigate('/members')} className="text-sm text-white/40 hover:text-white transition-colors">
                            Cancel
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddMember;