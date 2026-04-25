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
            className="min-h-screen flex items-center justify-center bg-gray-900"
            style={{
                background: "url('https://images.unsplash.com/photo-1498654896293-37aacf113fd9') no-repeat center/cover fixed"
            }}
        >
            <div className="p-6 rounded-2xl w-full max-w-md bg-white/10 backdrop-blur-md shadow-lg">
                <h2 className="text-center text-xl font-bold mb-4 text-white">Login</h2>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full mb-3 p-3 rounded text-black outline-none"
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full mb-3 p-3 rounded text-black outline-none"
                />

                <Button
                    onClick={handleLogin}
                    variant="success"
                    fullWidth
                    loading={msg === "Logging in..."}
                    className="mb-4"
                >
                    Login
                </Button>

                <p className="text-center text-white text-sm">
                    Don't have an account? <Link to="/signup" className="text-green-400 font-bold hover:underline">Create one</Link>
                </p>

                <p className="text-center mt-3 text-orange-400 font-medium">{msg}</p>
            </div>
        </div>
    );
};

export default Login;
