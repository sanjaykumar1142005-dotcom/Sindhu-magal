import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Menu = () => {
    const [data, setData] = useState({
        breakfast: [],
        lunch: [],
        dinner: []
    });

    const [activeSection, setActiveSection] = useState('breakfast');
    const [cart, setCart] = useState([]);
    const [members, setMembers] = useState(1);
    const [history, setHistory] = useState([]);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const role = localStorage.getItem("role");

    useEffect(() => {
        // Fetch Menu from Backend
        const fetchMenu = async () => {
            try {
                const response = await fetch("http://192.168.0.179:5000/menu");
                const result = await response.json();
                if (result.success) {
                    const grouped = {
                        breakfast: result.data.filter(i => i.category === 'breakfast').map(i => [i.name, i.price]),
                        lunch: result.data.filter(i => i.category === 'lunch').map(i => [i.name, i.price]),
                        dinner: result.data.filter(i => i.category === 'dinner').map(i => [i.name, i.price])
                    };
                    setData(grouped);
                }
            } catch (err) {
                console.error("Failed to fetch menu:", err);
            } finally {
                setLoading(false);
            }
        };

        const savedHistory = JSON.parse(localStorage.getItem("orders") || "[]");
        setHistory(savedHistory);
        fetchMenu();
    }, []);

    const getHallRent = (m) => {
        if (m <= 150) return 7500;
        else if (m <= 159) return 5000;
        else return 2500;
    };

    const getItemQty = (name) => {
        const item = cart.find(i => i.name === name);
        return item ? item.qty : 0;
    };

    const addToCart = (name, price) => {
        setCart(prev => {
            const existing = prev.find(item => item.name === name);
            if (existing) {
                return prev.map(item => item.name === name ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { name, price, qty: 1 }];
        });
    };

    const removeFromCart = (name) => {
        setCart(prev => {
            const existing = prev.find(item => item.name === name);
            if (existing) {
                if (existing.qty > 1) {
                    return prev.map(item => item.name === name ? { ...item, qty: item.qty - 1 } : item);
                }
                return prev.filter(item => item.name !== name);
            }
            return prev;
        });
    };

    const clearCart = () => setCart([]);

    const getFoodTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price * item.qty * members), 0);
    };

    const grandTotal = getFoodTotal() + getHallRent(members);

    const saveHistory = () => {
        const newEntry = {
            date: new Date().toLocaleString(),
            items: cart,
            total: grandTotal
        };
        const updatedHistory = [...history, newEntry];
        setHistory(updatedHistory);
        localStorage.setItem("orders", JSON.stringify(updatedHistory));
        alert("Saved to History");
    };

    const deleteHistory = (index) => {
        const updatedHistory = history.filter((_, i) => i !== index);
        setHistory(updatedHistory);
        localStorage.setItem("orders", JSON.stringify(updatedHistory));
    };

    const printBill = () => window.print();

    return (
        <div className="menu-bg menu-ui text-white pb-24 min-h-screen" style={{ backgroundImage: "url('/frontend/images/high-angle-view-various-vegetables-black-background_23-2147917348.avif')" }}>
            {/* NAV */}
            <nav className="glass menu-nav p-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img 
                        src="/frontend/images/IMG_5225.PNG" 
                        alt="logo" 
                        className="w-12 h-12 rounded-full object-cover border border-orange-500/50 hover:scale-110 transition-transform"
                    />
                    <h1 className="text-xl font-extrabold tracking-tight text-white hidden sm:block">Sindhu Mahal</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => navigate('/')} 
                        variant="glass" 
                        icon="🏠"
                        className="p-2 sm:px-4"
                    >
                        <span className="hidden sm:inline">Home</span>
                    </Button>

                    {role === 'admin' && (
                        <Button 
                            onClick={() => navigate('/admin')} 
                            variant="glass" 
                            icon="⚙️"
                            className="p-2 sm:px-4"
                        >
                            <span className="hidden sm:inline">Admin</span>
                        </Button>
                    )}

                    <Button 
                        onClick={() => setIsHistoryOpen(true)} 
                        variant="primary" 
                        icon="📜"
                        className="p-2 sm:px-6"
                    >
                        <span className="hidden sm:inline">History</span>
                    </Button>
                </div>
            </nav>

            {/* MENU BUTTONS */}
            <div className="menu-tabs-container flex justify-center gap-3 mt-6 flex-wrap relative z-20">
                {['breakfast', 'lunch', 'dinner'].map(type => (
                    <Button
                        key={type}
                        onClick={() => setActiveSection(type)}
                        variant={activeSection === type ? 'primary' : 'glass'}
                        className={`font-bold tracking-wide transition-all ${activeSection === type ? 'scale-110 shadow-orange-500/50' : 'opacity-60 hover:opacity-100'}`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                ))}
            </div>

            {/* SEARCH BAR */}
            <div className="max-w-xl mx-auto px-6 mt-8 relative z-20">
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 text-xl transition-transform group-focus-within:scale-110">🔍</span>
                    <input
                        type="text"
                        placeholder="Search for dishes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500/50 outline-none transition-all shadow-xl placeholder:text-gray-500"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* MENU */}
            <div className="max-w-6xl mx-auto p-6 min-h-[400px]">
                <div 
                    key={activeSection} 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500"
                >
                    {data[activeSection].filter(item => item[0].toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <div 
                            key={item[0]} 
                            className="menu-item-card p-5 flex justify-between items-center rounded-2xl group relative"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            <div className="flex flex-col">
                                <span className="text-lg font-medium tracking-wide">{item[0]}</span>
                                {getItemQty(item[0]) > 0 && (
                                    <span className="text-orange-400 text-sm font-bold animate-pulse">
                                        Added: {getItemQty(item[0])}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <Button 
                                        onClick={() => removeFromCart(item[0])} 
                                        variant="danger"
                                        className="w-10 h-10 p-0 text-xl"
                                    >
                                        -
                                    </Button>
                                    <Button 
                                        onClick={() => addToCart(item[0], item[1])} 
                                        variant="primary"
                                        className="w-10 h-10 p-0 text-xl"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data[activeSection].filter(item => item[0].toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-gray-500 italic text-lg">No items found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MEMBERS & RENT */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 px-6">
                <div className="menu-stat-card p-6 text-center rounded-2xl">
                    <div className="flex items-center justify-center gap-2 mb-3 text-orange-400">
                        <span className="text-xl">👥</span>
                        <p className="font-semibold uppercase tracking-wider text-sm">Guest Count</p>
                    </div>
                    <input
                        type="number"
                        value={members}
                        min="1"
                        onChange={(e) => setMembers(parseInt(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center text-2xl font-bold text-white focus:border-orange-500 transition-all menu-input"
                    />
                </div>

                <div className="menu-stat-card p-6 text-center rounded-2xl flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-2 mb-1 text-orange-400">
                        <span className="text-xl">🏛️</span>
                        <p className="font-semibold uppercase tracking-wider text-sm">Hall Rental</p>
                    </div>
                    <p className="text-4xl font-black text-white px-4 py-2">₹{getHallRent(members).toLocaleString()}</p>
                </div>
            </div>

            {/* CART & TOTAL */}
            <div className="max-w-6xl mx-auto p-6 pb-32">
                <div className="menu-cart-card p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                        <span className="text-xl">🛒</span>
                        <h3 className="font-bold text-lg tracking-wide uppercase">Your Selection</h3>
                    </div>
                    
                    <ul id="cartItems" className="space-y-3">
                        {cart.length === 0 ? (
                            <p className="text-gray-500 italic text-center py-4">No items selected yet</p>
                        ) : (
                            cart.map(item => (
                                <li key={item.name} className="flex justify-between items-center text-gray-200">
                                    <span className="flex-1">{item.name} <span className="text-orange-400 font-bold">x {item.qty}</span></span>
                                    <span className="font-semibold text-white">₹{(item.price * item.qty * members).toLocaleString()}</span>
                                </li>
                            ))
                        )}
                    </ul>

                    {cart.length > 0 && (
                        <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                            <Button onClick={clearCart} variant="danger" fullWidth icon="🗑️">Reset</Button>
                            <Button onClick={() => setIsBillOpen(true)} variant="primary" fullWidth icon="📄">Generate Bill</Button>
                        </div>
                    )}

                    <div className="mt-8 flex justify-between items-end">
                        <span className="text-gray-400 text-sm uppercase tracking-tighter">Grand Total</span>
                        <h2 className="text-4xl font-black text-white">₹{grandTotal.toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 w-full glass p-5 flex justify-between items-center md:hidden z-20 border-t border-white/10">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-orange-400 font-bold">Total Amount</span>
                    <span className="font-black text-2xl">₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                    <Button onClick={clearCart} variant="danger" icon="🗑️" className="p-3" />
                    <Button onClick={() => setIsBillOpen(true)} variant="primary" className="px-6 py-3 font-bold uppercase text-xs">Bill</Button>
                </div>
            </div>

            {/* BILL MODAL */}
            {isBillOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="glass menu-modal p-5 rounded-2xl w-[90%] max-w-md text-white">
                        <h2 className="text-center font-bold text-xl mb-4">Invoice</h2>
                        <div id="printArea">
                            <div id="billContent">
                                {cart.map(item => (
                                    <div key={item.name} className="flex justify-between py-1">
                                        <span>{item.name} x {item.qty}</span>
                                    </div>
                                ))}
                                <hr className="my-2 border-white/20" />
                                <div className="flex justify-between"><span>Food Total</span><span>₹{getFoodTotal()}</span></div>
                                <div className="flex justify-between"><span>Hall Rent</span><span>₹{getHallRent(members)}</span></div>
                                <hr className="my-2 border-white/20" />
                                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{grandTotal}</span></div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={saveHistory} variant="info" icon="💾">Save</Button>
                                <Button onClick={printBill} variant="success" icon="🖨️">Print</Button>
                            </div>
                            <Button onClick={() => setIsBillOpen(false)} variant="danger" fullWidth>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {isHistoryOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="glass menu-modal p-5 rounded-2xl w-[90%] max-w-md text-white max-h-[80vh] overflow-auto">
                        <h2 className="text-center font-bold text-xl mb-4">History</h2>
                        {history.length === 0 ? (
                            <p className="text-center text-gray-400">No history found</p>
                        ) : (
                            history.map((h, index) => (
                                <div key={index} className="menu-history-item border border-white/20 p-3 mb-3 rounded flex justify-between items-center bg-white/5">
                                    <div>
                                        <p className="text-sm text-gray-300">{h.date}</p>
                                        <p className="font-bold text-lg">₹{h.total}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteHistory(index)}
                                        className="menu-minus-btn px-3 py-1 rounded text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                        <Button onClick={() => setIsHistoryOpen(false)} variant="danger" fullWidth className="mt-4">Close Menu</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
