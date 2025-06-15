"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@material-tailwind/react";
import { URL } from '@/utils/constants';
import Header from '@/component/header';
import axios from 'axios';

const YachtsPage = () => {
    const [yachts, setYachts] = useState([]);
    const [newYacht, setNewYacht] = useState({ name: '', model: '' });
    const [editingYacht, setEditingYacht] = useState(null);

    useEffect(() => {
        fetchYachts();
    }, []);

    const fetchYachts = async () => {
        try {
            const response = await axios.get(`${URL}/yachts`);
            if (response.data.code === 200) {
                setYachts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching yachts:', error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${URL}/yachts`, newYacht);
            if (response.data.code === 201) {
                setNewYacht({ name: '', model: '' });
                fetchYachts();
            }
        } catch (error) {
            console.error('Error creating yacht:', error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${URL}/yachts/${editingYacht.id}`, editingYacht);
            if (response.data.code === 200) {
                setEditingYacht(null);
                fetchYachts();
            }
        } catch (error) {
            console.error('Error updating yacht:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`${URL}/yachts/${id}`);
            if (response.data.code === 200) {
                fetchYachts();
            }
        } catch (error) {
            console.error('Error deleting yacht:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-4xl font-bold mb-8">Yachts Management</h1>

                {/* Create Form */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Add New Yacht</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={newYacht.name}
                                onChange={(e) => setNewYacht({ ...newYacht, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Model</label>
                            <input
                                type="text"
                                value={newYacht.model}
                                onChange={(e) => setNewYacht({ ...newYacht, model: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <Button type="submit" color="blue">Add Yacht</Button>
                    </form>
                </div>

                {/* Yachts List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">Yachts List</h2>
                    <div className="space-y-4">
                        {yachts.map((yacht) => (
                            <div key={yacht.id} className="border p-4 rounded-lg">
                                {editingYacht?.id === yacht.id ? (
                                    <form onSubmit={handleUpdate} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                value={editingYacht.name}
                                                onChange={(e) => setEditingYacht({ ...editingYacht, name: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Model</label>
                                            <input
                                                type="text"
                                                value={editingYacht.model}
                                                onChange={(e) => setEditingYacht({ ...editingYacht, model: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button type="submit" color="green">Save</Button>
                                            <Button onClick={() => setEditingYacht(null)} color="red">Cancel</Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-medium">{yacht.name}</h3>
                                            <p className="text-gray-600">{yacht.model}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button onClick={() => setEditingYacht(yacht)} color="blue">Edit</Button>
                                            <Button onClick={() => handleDelete(yacht.id)} color="red">Delete</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YachtsPage; 