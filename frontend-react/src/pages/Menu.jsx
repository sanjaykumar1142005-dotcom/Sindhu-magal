import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const Menu = () => {
    const [data, setData] = useState({
        breakfast: [
            ['(300 ML) தண்ணீர் பாட்டில்', 10],
            ['அன்னாசி கேசரி', 40],
            ['ஆப்பம் + தேங்காய் பால்', 50],
            ['இட்லி', 40],
            ['காபி(Coffee)', 15],
            ['காளான் பிரியாணி (Mushroom Biryani, Onion Raita)', 120],
            ['டீ (Tea)', 15],
            ['நெய் பொங்கல்', 60],
            ['பூரி', 40]
        ],
        lunch: [],
        dinner: []
    });

    const [activeSection, setActiveSection] = useState('breakfast');
    const [cart, setCart] = useState([]);
    const [members, setMembers] = useState(1);
    const [history, setHistory] = useState([]);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const EB_CHARGES = 2500;

    useEffect(() => {
        if (isBillOpen || isHistoryOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isBillOpen, isHistoryOpen]);

    useEffect(() => {
        // Fetch Menu from Backend
        const fetchMenu = async () => {
            try {
                const response = await fetch(`${API_URL}/menu`);
                const result = await response.json();
                if (result.success && result.data && result.data.length > 0) {
                    const SERVICE_CHARGE = 40;
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
        const count = typeof m === 'number' ? m : (parseInt(m) || 0);
        if (count <= 150) return 7500;
        if (count <= 200) return 5000;
        return 2500;
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
        if (cart.length === 0) return 0;
        const SERVICE_CHARGE = 40;
        const itemsTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const count = typeof members === 'number' ? members : (parseInt(members) || 0);
        return (itemsTotal + SERVICE_CHARGE) * count;
    };

    const grandTotal = getFoodTotal() + getHallRent(members) + EB_CHARGES;

    const saveHistory = () => {
        const count = typeof members === 'number' ? members : (parseInt(members) || 0);
        const newEntry = {
            date: new Date().toLocaleString(),
            items: [...cart],
            members: count,
            hallRent: getHallRent(count),
            ebCharges: EB_CHARGES,
            foodTotal: getFoodTotal(),
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

    const printBill = () => {
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="menu-bg menu-ui text-white pb-24 min-h-screen" style={{ backgroundImage: "url('/frontend/images/high-angle-view-various-vegetables-black-background_23-2147917348.avif')" }}>
            <div className="hide-on-print">
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

            {/* MEMBERS SECTION */}
            <div className="max-w-6xl mx-auto p-6 pb-32">
                <div className="menu-cart-card p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
                        <span className="text-xl">👥</span>
                        <h3 className="font-bold text-lg tracking-wide uppercase">Members & Hall Rent</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="text-center">
                            <p className="font-semibold uppercase tracking-wider text-xs text-orange-400 mb-2">Guest Count</p>
                            <input
                                type="number"
                                value={members}
                                min="0"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setMembers(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center text-2xl font-bold text-white focus:border-orange-500 transition-all menu-input"
                            />
                        </div>
                        <div className="text-center flex flex-col justify-center">
                            <p className="font-semibold uppercase tracking-wider text-xs text-orange-400 mb-2">Hall Rental</p>
                            <p className="text-3xl font-black text-white">₹{getHallRent(members).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-white/10">
                        <Button onClick={clearCart} variant="danger" fullWidth icon="🗑️">Reset</Button>
                        <Button 
                            onClick={() => setIsBillOpen(true)} 
                            variant="primary" 
                            fullWidth 
                            icon="📄"
                            disabled={cart.length === 0}
                        >
                            Generate Bill
                        </Button>
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 w-full glass p-5 flex justify-between items-center md:hidden z-20 border-t border-white/10">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-orange-400 font-bold">Total (₹{Math.ceil(grandTotal / ((typeof members === 'number' ? members : parseInt(members)) || 1)).toLocaleString()}/head)</span>
                    <span className="font-black text-2xl">₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                    <Button onClick={clearCart} variant="danger" icon="🗑️" className="p-3" />
                    <Button onClick={() => setIsBillOpen(true)} variant="primary" className="px-6 py-3 font-bold uppercase text-xs">Bill</Button>
                </div>
            </div>
            </div>

            {/* BILL MODAL */}
            {isBillOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print-modal-wrapper">
                    <div className="glass menu-modal p-5 rounded-3xl w-[95%] max-w-lg text-white max-h-[95vh] overflow-y-auto shadow-2xl print-modal-content">
                        <h2 className="text-center font-bold text-xl mb-4 border-b border-white/10 pb-2 hide-on-print">Quotation</h2>
                        <div id="printArea" className="text-black bg-white p-6 border-2 border-gray-100 rounded-3xl shadow-sm max-w-full mx-auto my-2">
                            {/* Receipt Header */}
                            <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-200">
                                <img
                                    src="/frontend/images/IMG_5225.PNG"
                                    alt="logo"
                                    className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-orange-500"
                                />
                                <h2 className="text-xl font-black uppercase tracking-widest text-black">Sindhu Mahal</h2>
                                <p className="text-[9px] text-black font-bold tracking-tighter uppercase mt-0.5">Quotation • {new Date().toLocaleDateString()}</p>
                            </div>

                            {/* Itemized Table */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-[10px] font-black text-black uppercase tracking-widest px-2">
                                    <span>Item Detail</span>
                                    <span>Qty</span>
                                </div>
                                <div className="space-y-1">
                                    {cart.map(item => (
                                        <div key={item.name} className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="font-bold text-black text-sm">{item.name}</span>
                                            <span className="bg-gray-200 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">x {item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Guest Count</span>
                                    <span className="font-bold text-black">{members === '' ? 0 : members}</span>
                                </div>
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Food Total</span>
                                    <span className="font-bold text-black">₹{getFoodTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Hall Rent</span>
                                    <span className="font-bold text-black">₹{getHallRent(members).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Electricity (EB) & Misc</span>
                                    <span className="font-bold text-black">₹{EB_CHARGES.toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                                    <span className="text-[10px] font-black uppercase text-black">Grand Total</span>
                                    <span className="text-xl font-black text-black">₹{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>



                            {/* Footer */}
                            <div className="text-center">
                                <p className="text-xs font-black text-black italic uppercase tracking-wider">Thank You!</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6 hide-on-print">
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
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hide-on-print">
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
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setSelectedHistoryItem(h)}
                                            variant="info"
                                            size="sm"
                                            icon="👁️"
                                            className="px-3 py-1.5 text-xs font-bold"
                                        >
                                            View
                                        </Button>
                                        <button
                                            onClick={() => deleteHistory(index)}
                                            className="menu-minus-btn px-3 py-1 rounded text-sm font-semibold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        <Button onClick={() => setIsHistoryOpen(false)} variant="danger" fullWidth className="mt-4">Close Menu</Button>
                    </div>
                </div>
            )}

            {/* DETAIL BILL MODAL FOR SAVED HISTORY */}
            {selectedHistoryItem && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 print-modal-wrapper">
                    <div className="glass menu-modal p-5 rounded-3xl w-[95%] max-w-lg text-white max-h-[95vh] overflow-y-auto shadow-2xl print-modal-content">
                        <h2 className="text-center font-bold text-xl mb-4 border-b border-white/10 pb-2 hide-on-print">Saved Quotation Details</h2>
                        <div id="printArea" className="text-black bg-white p-6 border-2 border-gray-100 rounded-3xl shadow-sm max-w-full mx-auto my-2">
                            {/* Receipt Header */}
                            <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-200">
                                <img
                                    src="/frontend/images/IMG_5225.PNG"
                                    alt="logo"
                                    className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-orange-500"
                                    onError={(e) => {e.target.style.display='none'}}
                                />
                                <h2 className="text-xl font-black uppercase tracking-widest text-black">Sindhu Mahal</h2>
                                <p className="text-[9px] text-black font-bold tracking-tighter uppercase mt-0.5">Catering Quotation • {selectedHistoryItem.date}</p>
                            </div>

                            {/* Itemized Table */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-[10px] font-black text-black uppercase tracking-widest px-2">
                                    <span>Item Detail</span>
                                    <span>Qty</span>
                                </div>
                                <div className="space-y-1">
                                    {(selectedHistoryItem.items || []).map(item => (
                                        <div key={item.name} className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="font-bold text-black text-sm">{item.name}</span>
                                            <span className="bg-gray-200 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono">x {item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Guest Count</span>
                                    <span className="font-bold text-black">{selectedHistoryItem.members || 1}</span>
                                </div>
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Food Total</span>
                                    <span className="font-bold text-black">
                                        ₹{Math.ceil(selectedHistoryItem.foodTotal || (selectedHistoryItem.total - (selectedHistoryItem.hallRent || 0) - (selectedHistoryItem.ebCharges || 2500))).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Hall Rent</span>
                                    <span className="font-bold text-black">₹{(selectedHistoryItem.hallRent || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-black font-medium">
                                    <span>Electricity (EB) & Misc</span>
                                    <span className="font-bold text-black">₹{(selectedHistoryItem.ebCharges || 2500).toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                                    <span className="text-[10px] font-black uppercase text-black">Grand Total</span>
                                    <span className="text-xl font-black text-black">₹{selectedHistoryItem.total.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center">
                                <p className="text-xs font-black text-black italic uppercase tracking-wider">Thank You!</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6 hide-on-print">
                            <Button onClick={() => window.print()} variant="success" icon="🖨️">Print</Button>
                            <Button onClick={() => setSelectedHistoryItem(null)} variant="danger" fullWidth>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
