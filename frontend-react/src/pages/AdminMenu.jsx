import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const AdminMenu = () => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', price: '', category: 'breakfast' });
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const API = API_URL;

    console.log("API URL:", API);

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
            }
        } catch (err) {
            console.error(err);
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
                setMsg("Item Added!");
                setNewItem({ name: '', price: '', category: 'breakfast' });
                fetchMenu();
            }
        } catch (err) {
            console.error(err);
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
                body: JSON.stringify(editingItem)
            });
            const data = await res.json();
            if (data.success) {
                setMsg("Item Updated!");
                setEditingItem(null);
                fetchMenu();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this item?")) return;
        try {
            const res = await fetch(`${API}/admin/menu/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            });
            const data = await res.json();
            if (data.success) {
                setMsg("Deleted!");
                fetchMenu();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <span className="text-2xl">💡</span>
                    <p className="text-sm text-orange-200">
                        <strong>Note:</strong> A service charge of ₹40 per head is included in the Food Total but not shown separately on the bill.
                    </p>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/frontend/images/IMG_5225.PNG" 
                            alt="logo" 
                            className="w-12 h-12 rounded-full object-cover border border-orange-500/50"
                        />
                        <h1 className="text-3xl font-bold text-orange-500">Sindhu Mahal Admin</h1>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => navigate('/')} variant="glass" icon="🏠">Home</Button>
                    </div>
                </div>

                {msg && <p className="bg-green-600/20 text-green-400 p-3 rounded mb-4 text-center">{msg}</p>}

                {/* Add Item Form */}
                <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Item Name"
                            className="bg-black/40 p-3 rounded border border-white/10"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            className="bg-black/40 p-3 rounded border border-white/10"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || '' })}
                        />
                        <select
                            className="bg-black/40 p-3 rounded border border-white/10"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                        </select>
                        <Button onClick={handleAdd} variant="primary" icon="➕" className="h-full">Add Item</Button>
                    </div>
                </div>

                {/* List Items */}
                <div className="space-y-4">
                    {['breakfast', 'lunch', 'dinner'].map(cat => (
                        <div key={cat} className="mb-8">
                            <h2 className="text-2xl font-bold mb-4 capitalize text-orange-400 border-b border-orange-400/20 pb-2">{cat}</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {items.filter(i => i.category === cat).map(item => (
                                    <div key={item.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center group">
                                        {editingItem && editingItem.id === item.id ? (
                                            <div className="flex gap-2 flex-grow">
                                                <input
                                                    className="bg-black p-1 rounded border border-white/20"
                                                    value={editingItem.name}
                                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                                />
                                                <input
                                                    className="bg-black p-1 rounded border border-white/20 w-20"
                                                    type="number"
                                                    value={editingItem.price}
                                                    onChange={e => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                                                />
                                                <Button onClick={handleUpdate} variant="success" size="sm">Save</Button>
                                                <Button onClick={() => setEditingItem(null)} variant="glass" size="sm">Cancel</Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="ml-4 text-orange-400">₹{item.price}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button onClick={() => setEditingItem(item)} variant="info" size="sm" icon="✏️">Edit</Button>
                                                    <Button onClick={() => handleDelete(item.id)} variant="danger" size="sm" icon="🗑️">Delete</Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminMenu;
