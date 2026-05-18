import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    const API = API_URL;

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
                background: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80') no-repeat center/cover fixed"
            }}
        >
            <div className="p-8 sm:p-10 rounded-[1rem] w-full max-w-[400px] bg-white/5 backdrop-blur-md border border-white/20 shadow-2xl">
                <h2 className="text-center text-3xl font-bold mb-8 text-white tracking-wide">Register Form</h2>

                <div className="space-y-6 mb-8">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pb-2 bg-transparent text-white border-b border-white/50 focus:border-white outline-none transition-all placeholder-white/70"
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full pb-2 bg-transparent text-white border-b border-white/50 focus:border-white outline-none transition-all placeholder-white/70"
                    />
                </div>

                <button
                    onClick={handleSignup}
                    disabled={msg === "Creating account..."}
                    className="w-full bg-white text-black font-semibold py-3 rounded-md hover:bg-gray-100 transition-colors mb-6"
                >
                    {msg === "Creating account..." ? "Creating account..." : "Register"}
                </button>

                <p className="text-center text-white/90 text-sm">
                    Already have an account? <Link to="/login" className="text-white hover:underline">Log in</Link>
                </p>

                {msg && msg !== "Creating account..." && (
                    <p className="text-center mt-4 text-orange-400 font-medium">{msg}</p>
                )}
            </div>
        </div>
    );
};

export default Signup;
