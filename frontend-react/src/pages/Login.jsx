import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    const API = API_URL;
    console.log("API URL:", API);

    const handleLogin = async () => {
        if (!email || !password) {
            setMsg("Enter email & password");
            return;
        }

        setMsg("Logging in...");

        try {
            const response = await fetch(`${API}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error("Server error");
            }

            const data = await response.json();
            if (data.success) {
                setMsg(data.message || "Login success 🎉");

                localStorage.setItem("token", data.token || "loggedin");
                localStorage.setItem("role", data.role || "user");

                setTimeout(() => {
                    if (data.role === "admin") {
                        navigate("/admin");
                    } else {
                        navigate("/");
                    }
                }, 1000);
            } else {
                setMsg(data.message || "Login failed");
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
                background: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=2000&q=80') no-repeat center/cover fixed"
            }}
        >
            <div className="p-8 sm:p-10 rounded-[1rem] w-full max-w-[400px] bg-white/5 backdrop-blur-md border border-white/20 shadow-2xl">
                <h2 className="text-center text-3xl font-bold mb-8 text-white tracking-wide">Login Form</h2>

                <div className="space-y-6 mb-6">
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
                        placeholder="Enter your password"
                        className="w-full pb-2 bg-transparent text-white border-b border-white/50 focus:border-white outline-none transition-all placeholder-white/70"
                    />
                </div>

                <div className="flex justify-between items-center mb-8 text-sm text-white/90">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                        <span>Remember me</span>
                    </label>
                    <a href="#" className="hover:text-white transition-colors">Forgot password?</a>
                </div>

                <button
                    onClick={handleLogin}
                    disabled={msg === "Logging in..."}
                    className="w-full bg-white text-black font-semibold py-3 rounded-md hover:bg-gray-100 transition-colors mb-6"
                >
                    {msg === "Logging in..." ? "Logging in..." : "Log In"}
                </button>

                <p className="text-center text-white/90 text-sm">
                    Don't have an account? <Link to="/signup" className="text-white hover:underline">Register</Link>
                </p>

                {msg && msg !== "Logging in..." && (
                    <p className="text-center mt-4 text-orange-400 font-medium">{msg}</p>
                )}
            </div>
        </div>
    );
};

export default Login;
