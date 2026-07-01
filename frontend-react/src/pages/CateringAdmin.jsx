import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const CateringAdmin = () => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ 
        name: '', 
        price: '', 
        category: 'breakfast'
    });
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const API = API_URL;

    useEffect(() => {
        const role = localStorage.getItem("role");
        const token = localStorage.getItem("token");
        if (role !== "admin" || !token) {
            navigate("/login");
        } else {
            fetchMenu();
        }
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch(`${API}/menu`);
            const data = await res.json();
            if (data.success) {
                setItems(data.data);
            } else {
                setMsg(data.message || "Failed to fetch catering menu");
            }
        } catch (err) {
            console.error("Failed to fetch catering menu:", err);
            setMsg("Failed to connect to backend server. Please verify it is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItem.name || !newItem.price) {
            setMsg("Please fill name and price");
            return;
        }
        try {
            const res = await fetch(`${API}/admin/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ 
                    name: newItem.name,
                    price: parseInt(newItem.price) || 0,
                    category: newItem.category
                })
            });
            const data = await res.json();
            if (data.success) {
                setMsg("Catering Item Added!");
                setNewItem({ 
                    name: '', 
                    price: '', 
                    category: 'breakfast'
                });
                fetchMenu();
            } else {
                setMsg(data.message || "Failed to add item");
            }
        } catch (err) {
            console.error(err);
            setMsg("Failed to add item. Please check your server connection.");
        }
    };

    const handleUpdate = async () => {
        try {
            const res = await fetch(`${API}/admin/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    id: editingItem.id,
                    name: editingItem.name,
                    price: parseInt(editingItem.price) || 0,
                    category: editingItem.category
                })
            });
            const data = await res.json();
            if (data.success) {
                setMsg("Catering Item Updated!");
                setEditingItem(null);
                fetchMenu();
            } else {
                setMsg(data.message || "Failed to update item");
            }
        } catch (err) {
            console.error(err);
            setMsg("Failed to update item. Please check your server connection.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this catering item?")) return;
        try {
            const res = await fetch(`${API}/admin/menu/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            });
            const data = await res.json();
            if (data.success) {
                setMsg("Item Deleted!");
                fetchMenu();
            } else {
                setMsg(data.message || "Failed to delete item");
            }
        } catch (err) {
            console.error(err);
            setMsg("Failed to delete item. Please check your server connection.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto animate-fadeIn">
                {/* Information Callout */}
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <span className="text-2xl">🍽️</span>
                    <p className="text-sm text-orange-200">
                        <strong>Catering Admin Dashboard:</strong> Managing items displayed in the Catering Menu.
                    </p>
                </div>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/frontend/images/IMG_5225.PNG" 
                            alt="logo" 
                            className="w-12 h-12 rounded-full object-cover border border-orange-500/50"
                            onError={(e) => {e.target.style.display='none'}}
                        />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-orange-500">Sindhu Catering Admin</h1>
                            <p className="text-xs text-gray-400">Manage catering food options & services</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/')} variant="glass" icon="🏠"><span className="hidden sm:inline">Home</span></Button>
                        <Button onClick={() => navigate('/admin')} variant="glass" icon="📊"><span className="hidden sm:inline">Admin Panel</span></Button>
                        <Button onClick={() => navigate('/catering')} variant="glass" icon="🍽"><span className="hidden sm:inline">Catering Menu</span></Button>
                    </div>
                </div>

                {msg && <p className="bg-green-600/20 text-green-400 p-3 rounded mb-6 text-center font-bold">{msg}</p>}

                {/* Add Item Form */}
                <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-orange-400">Add New Catering Item</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Catering Item Name"
                                className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Price per Head (₹)"
                                className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            />
                            <select
                                className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500"
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                            </select>
                        </div>

                        {/* No toggles needed */}

                        <Button onClick={handleAdd} variant="primary" icon="➕" fullWidth>
                            Add Catering Item
                        </Button>
                    </div>
                </div>

                {/* List Items */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
                        </div>
                    ) : (
                        ['breakfast', 'lunch', 'dinner'].map(cat => (
                            <div key={cat} className="mb-8">
                                <h2 className="text-2xl font-bold mb-4 capitalize text-orange-400 border-b border-orange-400/20 pb-2 flex justify-between items-center">
                                    <span>{cat} Menu</span>
                                    <span className="text-sm font-normal text-gray-400">
                                        ({items.filter(i => i.category === cat).length} items)
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {items.filter(i => i.category === cat).map(item => (
                                        <div key={item.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center group border border-white/5 hover:border-orange-500/20 transition-all">
                                            {editingItem && editingItem.id === item.id ? (
                                                <div className="flex flex-col md:flex-row gap-3 flex-grow bg-black/30 p-3 rounded-lg border border-orange-500/20">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-grow">
                                                        <input
                                                            className="bg-black text-white p-2 rounded-lg border border-white/20"
                                                            value={editingItem.name}
                                                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            placeholder="Item Name"
                                                        />
                                                        <input
                                                            className="bg-black text-white p-2 rounded-lg border border-white/20"
                                                            type="number"
                                                            value={editingItem.price}
                                                            onChange={e => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                                                            placeholder="Price"
                                                        />
                                                        <select
                                                            className="bg-black text-white p-2 rounded-lg border border-white/20"
                                                            value={editingItem.category}
                                                            onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                                        >
                                                            <option value="breakfast">Breakfast</option>
                                                            <option value="lunch">Lunch</option>
                                                            <option value="dinner">Dinner</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="flex gap-2 self-end md:self-center">
                                                        <Button onClick={handleUpdate} variant="success" size="sm">Save</Button>
                                                        <Button onClick={() => setEditingItem(null)} variant="glass" size="sm">Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-lg text-white">{item.name}</span>
                                                            <span className="text-orange-400 font-extrabold">₹{item.price}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => setEditingItem(item)} variant="info" size="sm" icon="✏️">
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </Button>
                                                        <Button onClick={() => handleDelete(item.id)} variant="danger" size="sm" icon="🗑️">
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {items.filter(i => i.category === cat).length === 0 && (
                                        <p className="text-gray-500 italic text-sm py-4">No items registered in this category.</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CateringAdmin;
