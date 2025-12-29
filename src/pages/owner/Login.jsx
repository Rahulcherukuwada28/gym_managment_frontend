import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    // ✅ FIX: Get the Live URL from Vercel, or use local if testing on laptop
    const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.5:8000';

    // ✅ FIX 1: remove `e`, remove preventDefault
    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            // ✅ FIX 2: use SAME IP as QR (NOT 127.0.0.1)
            const response = await axios.post(
                'http://192.168.1.5:8000/api/token/',
                { username, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            // ✅ tokens stored correctly
            localStorage.setItem('access', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat font-sans"
            style={{ 
                backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8693.jpg')" 
            }}
        >
            <div className="absolute inset-0 bg-black/40"></div>

            <div className="relative z-10 w-full max-w-sm mx-4">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl"></div>

                <div className="relative z-20 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                            Fitness
                        </h1>
                        <p className="text-white/80 text-sm mt-2 font-medium tracking-wide">
                            GYM MANAGEMENT OS
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/40 border border-red-500/50 rounded-xl text-white text-xs text-center font-bold shadow-sm">
                            {error}
                        </div>
                    )}

                    {/* ❌ form submit REMOVED, UI unchanged */}
                    <div className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/90 ml-1 uppercase tracking-wider drop-shadow-sm">
                                Username
                            </label>
                            <input 
                                type="text" 
                                className="w-full bg-black/30 border border-white/20 text-white px-5 py-3 rounded-xl focus:outline-none focus:bg-black/50 focus:border-white/50 transition-all placeholder:text-white/30 text-sm backdrop-blur-sm"
                                placeholder="Enter ID"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/90 ml-1 uppercase tracking-wider drop-shadow-sm">
                                Password
                            </label>
                            <input 
                                type="password" 
                                className="w-full bg-black/30 border border-white/20 text-white px-5 py-3 rounded-xl focus:outline-none focus:bg-black/50 focus:border-white/50 transition-all placeholder:text-white/30 text-sm backdrop-blur-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        {/* ✅ FIX 3: button is now explicit click */}
                        <button 
                            type="button"
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full py-4 mt-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                            bg-black/30 border border-white/20 text-white backdrop-blur-sm
                            hover:bg-blue-500/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/50 active:scale-[0.98]"
                        >
                            {loading ? 'Authenticating...' : 'Log In'}
                        </button>

                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-white/50">
                            Designed by Rahul Cherukuwada
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
