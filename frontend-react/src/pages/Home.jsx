import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    const functions = [
        "💍 Marriage",
        "🎂 Birthday",
        "🎉 Party",
        "🏢 Corporate Event"
    ];

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    const handleAuth = () => {
        if (isLoggedIn) {
            localStorage.removeItem("token");
            alert("Logged out");
            setIsLoggedIn(false);
        } else {
            navigate("/login");
        }
    };

    const goMenu = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            navigate("/login");
        } else {
            navigate("/catering");
        }
    };



    return (
        <div className="home-bg home-ui min-h-screen text-white home-center-container">
            <div className="home-shell w-full px-3 md:px-6 py-4 md:py-8 macbook-panel-container">
                <div className="home-panel fade-in-up">
                    <div className="home-main">
                        <nav className="home-topbar">
                            <div className="brand-wrap">
                                <img
                                    src="/frontend/images/IMG_5225.PNG"
                                    alt="logo"
                                    className="brand-logo"
                                />
                                <h1>Sindhu Mahal</h1>
                            </div>

                            <Button onClick={handleAuth} variant="secondary" icon={isLoggedIn ? "🚪" : "🔑"}>
                                {isLoggedIn ? "Logout" : "Login"}
                            </Button>
                        </nav>

                        <section className="home-hero-content">
                            <div className="hero-copy fade-in-up">
                                <h2>
                                    Grab Big Deals
                                    <br />
                                    on <span>Yummy Meals!</span>
                                </h2>
                                <p>
                                    Just confirm your order and enjoy delicious food delivered fast with
                                    premium quality service.
                                </p>
                                <div className="flex flex-wrap gap-4 mt-6">
                                    <Button
                                        onClick={goMenu}
                                        variant="primary"
                                        size="lg"
                                        icon="🍽"
                                    >
                                        Catering Menu
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/restaurant")}
                                        variant="glass"
                                        size="lg"
                                        icon="🏪"
                                    >
                                        Restaurant
                                    </Button>
                                </div>
                            </div>

                            <div className="hero-visual fade-in-up-delayed">
                                <img
                                    src="/frontend/images/2.png"
                                    alt="hero"
                                    className="hero-main-image"
                                />

                                <div className="hero-card hero-card--user floating-card">
                                    <span>👨‍🍳</span>
                                    <div>
                                        <strong>Chef Service</strong>
                                        <small>Fast and fresh</small>
                                    </div>
                                </div>

                                <div className="hero-card hero-card--dish floating-card-delayed">
                                    <span>⭐</span>
                                    <div>
                                        <strong>Top Rated</strong>
                                        <small>Best quality meals</small>
                                    </div>
                                </div>

                                <div className="hero-tags">
                                    {functions.map((item, index) => (
                                        <span key={item} className="hero-tag" style={{ "--i": index }}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
