import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    const API = "http://192.168.0.179:5000";

    const handleSignup = async () => {
        if (!email || !password) {
            setMsg("Enter email & password");
            return;
        }

        setMsg("Creating account...");

        try {
            const response = await fetch(`${API}/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                setMsg("Account created! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            } else {
                setMsg(data.message || "Signup failed");
            }

        } catch (error) {
            console.error("Error:", error);
            setMsg("Server not responding ❌");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80') no-repeat center/cover fixed"
            }}
        >
            <div className="p-8 rounded-[2rem] w-full max-w-md glass border border-white/10 shadow-2xl">
                <div className="flex flex-col items-center mb-6">
                    <img src="/frontend/images/IMG_5225.PNG" alt="logo" className="w-16 h-16 rounded-full mb-2 border-2 border-orange-500/50" />
                    <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">Join Sindhu Mahal</h2>
                    <p className="text-gray-400 text-sm mt-1">Create your account today</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/30 text-white border border-white/10 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create Password"
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/30 text-white border border-white/10 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleSignup}
                    variant="success"
                    fullWidth
                    loading={msg === "Creating account..."}
                    className="mb-4"
                >
                    Sign Up
                </Button>

                <p className="text-center text-white text-sm">
                    Already have an account? <Link to="/login" className="text-blue-400 font-bold hover:underline">Login here</Link>
                </p>

                <p className="text-center mt-4 text-orange-400 font-medium">{msg}</p>
            </div>
        </div>
    );
};

export default Signup;
