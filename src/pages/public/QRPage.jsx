import { useState } from "react";
import axios from "axios";

// 🔴 CONFIG: Change this to your Server's Local IP
const API_URL = "http://192.168.1.5:8000/api/attendance/mark/";

const QRPage = () => {
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- HANDLERS ---
  const handleNumClick = (num) => {
    if (digits.length < 4) {
      setDigits((prev) => prev + num);
      setError("");
    }
  };

  const handleBackspace = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setDigits("");
    setError("");
  };

  const handleMark = async () => {
    if (digits.length !== 4) {
      setError("Please enter 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        API_URL,
        { last_4_digits: digits },
        { headers: { "Content-Type": "application/json" } }
      );

      setResult(response.data); 
      setDigits("");
    } catch (err) {
      console.error("Attendance Error:", err);
      const msg = err.response?.data?.message || "Connection failed. Check Server.";
      setError(msg);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setDigits("");
    setError("");
  };

  // --- HELPERS ---
  const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate) return { text: "No Expiry Date", color: "text-white/30" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(expiryDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Expired ${Math.abs(diffDays)} days ago`, color: "text-red-400" };
    if (diffDays === 0) return { text: "Expires Today!", color: "text-orange-400 animate-pulse" };
    if (diffDays <= 5) return { text: `${diffDays} Days Left (Renew Soon)`, color: "text-orange-300" };
    return { text: `${diffDays} Days Remaining`, color: "text-emerald-300" };
  };

  // Calculate days for result view
  const daysInfo = result ? calculateDaysLeft(result.expiry_date) : null;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8693.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />

      {/* MAIN CARD */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center">
        
        {/* --- STATE 1: INPUT SCREEN --- */}
        {!result && (
          <div className="p-8 w-full flex flex-col h-full pt-6">
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight drop-shadow-md">Gym Check-In</h1>
              <p className="text-white/50 text-sm mt-1 uppercase tracking-widest">Enter Last 4 Digits</p>
            </div>

            {/* Display Screen */}
            <div className={`mb-8 p-6 rounded-2xl border ${error ? "bg-red-500/10 border-red-500/50 animate-shake" : "bg-black/40 border-white/10"} flex justify-center items-center h-24 transition-all duration-300`}>
              {error ? (
                 <span className="text-red-400 font-bold text-center">{error}</span>
              ) : (
                <div className="flex gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        digits[i] 
                          ? "bg-emerald-400 scale-125 shadow-[0_0_10px_#34d399]" 
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
             <div className="text-center h-8 mb-4 text-2xl font-mono tracking-[1em] text-emerald-200 font-bold min-h-[32px]">
                {digits}
             </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num.toString())}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-2xl font-bold transition-all active:scale-95 flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              
              <button 
                onClick={handleClear} 
                className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 active:scale-95"
              >
                CLR
              </button>
              
              <button 
                onClick={() => handleNumClick("0")} 
                className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-2xl font-bold transition-all active:scale-95"
              >
                0
              </button>

              <button 
                onClick={handleBackspace} 
                className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/5 flex items-center justify-center active:scale-95"
              >
                ⌫
              </button>
            </div>

            <button
              onClick={handleMark}
              disabled={loading || digits.length !== 4}
              className={`w-full py-4 rounded-2xl font-bold text-lg tracking-widest shadow-lg transition-all 
                ${loading || digits.length !== 4 
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" 
                  : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-900/50 active:scale-95"
                }`}
            >
              {loading ? "VERIFYING..." : "MARK ATTENDANCE"}
            </button>
          </div>
        )}

        {/* --- STATE 2: RESULT SCREEN --- */}
        {result && (
          <div className="p-8 w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
            
            {/* 🏅 GYM LOGO (At Top) */}
            <div className="mb-8 rounded-full p-1 border-2 border-white/10 shadow-2xl bg-black/40">
                <img 
                    src="https://marketplace.canva.com/EAFxdcos7WU/1/0/1600w/canva-dark-blue-and-brown-illustrative-fitness-gym-logo-oqe3ybeEcQQ.jpg" 
                    alt="Gym Logo" 
                    className="w-24 h-24 rounded-full object-cover"
                />
            </div>

            {/* NAME + VERIFIED TICK */}
            <h2 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                {result.name} 
                {/* 🔵 Verified Blue Tick */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-500 filter drop-shadow-lg">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
            </h2>
            <p className="text-white/60 mb-8 max-w-[200px]">{result.message}</p>

            {/* Info Card */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
              <div className="text-left border-r border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Status</p>
                <p className={`font-bold text-lg ${
                    result.status === 'active' ? 'text-emerald-400' : 
                    result.status === 'grace' ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {result.status.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Plan Expiry</p>
                <p className="font-bold text-lg text-white">
                  {result.expiry_date}
                </p>
              </div>
            </div>

            {/* 🏋️ LIGHT WEIGHT BUDDY BUTTON */}
            <button
              className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold tracking-widest transition-all active:scale-95 uppercase"
            >
              Light weight Buddy! 🏋️
            </button>

            {/* 🗓️ REMAINING DAYS */}
            <div className="mt-4 text-center">
                <p className={`text-sm font-bold font-mono tracking-wide ${daysInfo?.color}`}>
                    {daysInfo?.text}
                </p>
            </div>
            

          </div>
          
        )}
        <div className="absolute bottom-4 text-white/20 text-xs">
                    Designed By Rahul Cherukuwada
            </div>

      </div>

      <div className="absolute bottom-4 text-white/20 text-xs">
         Secure Attendance System v2.0
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default QRPage;