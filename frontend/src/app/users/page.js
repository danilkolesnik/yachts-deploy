'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Loader from '@/ui/loader';
import Header from '@/component/header';
import { URL } from '@/utils/constants';
import { Button, Select, Option } from '@material-tailwind/react';
import Modal from '@/ui/Modal';
import ReactSelect from 'react-select';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editRoleModalIsOpen, setEditRoleModalIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [userOptions, setUserOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const roles = [
        { value: 'admin', label: 'Admin' },
        { value: 'mechanic', label: 'Mechanic' },
        { value: 'electrician', label: 'Electrician' },
        { value: 'user', label: 'User' },
    ];


    const columns = [
        {
            name: 'ID',
            selector: row => row.id,
            sortable: true,
        },
        {
            name: 'Customer Name',
            selector: row => row.fullName,
            sortable: true,
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true,
        },
        {
            name: 'Role',
            selector: row => row.role,
            sortable: true,
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => openEditRoleModal(row)}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => deleteUser(row.id)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            button: "true",
        },
    ];

    const openEditRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role || roles[0].value);
        setEditRoleModalIsOpen(true);
    };

    const closeEditRoleModal = () => {
        setEditRoleModalIsOpen(false);
        setSelectedUser(null);
        setNewRole('');
    };

    const updateRole = async () => {
        if (!selectedUser) return;

        try {
            const response = await axios.put(`${URL}/users/${selectedUser.id}/role`, { role: newRole });

            if (response.data.code === 200) {
                setUsers(users.map(user => user.id === selectedUser.id ? { ...user, role: newRole } : user));
                closeEditRoleModal();
                toast.success("User role updated successfully");
            } else {
                console.error('Failed to update role:', response.data.message);
                toast.error("Failed to update role");
            }
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error("Error updating role");
        }
    };

    const deleteUser = (userId) => {
        setUserToDelete(userId);
        setDeleteConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${URL}/users/${userToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.code === 200) {
                setUsers(users.filter(user => user.id !== userToDelete));
                toast.success("User deleted successfully");
                setDeleteConfirmModalOpen(false);
                setUserToDelete(null);
            } else {
                console.error('Failed to delete user:', response.data.message);
                toast.error("Failed to delete user");
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error("Error deleting user");
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmModalOpen(false);
        setUserToDelete(null);
    };

    const handleUserChange = (selectedOption) => {
        setSelectedUser(selectedOption);
    };

    const handleInputChange = (value) => {
        setInputValue(value);
    };

    // Filter users based on search and role filter
    const filteredUsers = users.filter(user => {
        const matchesSearch = !selectedUser || user.id === selectedUser.value;
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${URL}/users`);
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            const options = users.map(user => ({
                value: user.id,
                label: `${user.fullName}`,
            }));
            setUserOptions(options);
        }
    }, [users]);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
                {loading ? (
                    <div className="flex justify-center items-center min-h-screen">
                        <Loader loading={loading} />
                    </div>
                ) : (
                    <div className="w-full space-y-6 bg-white rounded shadow-md">
                        <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <ReactSelect
                                options={userOptions}
                                value={selectedUser}
                                onChange={handleUserChange}
                                onInputChange={handleInputChange}
                                inputValue={inputValue}
                                placeholder="Search by name..."
                                isClearable
                                isSearchable
                                menuIsOpen={inputValue.length > 0}
                                className="w-full md:w-80"
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        color: 'black',
                                    }),
                                    singleValue: (provided) => ({
                                        ...provided,
                                        color: 'black',
                                    }),
                                    option: (provided, state) => ({
                                        ...provided,
                                        color: 'black',
                                        backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                    }),
                                }}
                            />
                            <Select
                                label="Filter by Role"
                                value={roleFilter}
                                onChange={(value) => setRoleFilter(value)}
                                className="text-black border-gray-300 rounded-xs w-full md:w-40"
                                labelProps={{ className: 'text-black' }}
                                containerProps={{ className: 'min-w-[120px] w-full md:w-auto' }}
                            >
                                <Option className="text-black" value="">All Roles</Option>
                                <Option className="text-black" value="admin">Admin</Option>
                                <Option className="text-black" value="user">User</Option>
                                <Option className="text-black" value="mechanic">Mechanic</Option>
                                <Option className="text-black" value="electrician">Electrician</Option>
                            </Select>
                        </div>
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={columns}
                                data={filteredUsers}
                                pagination
                                highlightOnHover
                                pointerOnHover
                                className="min-w-full border-collapse"
                                responsive
                            />
                        </div>
                    </div>
                )}
                <Modal isOpen={editRoleModalIsOpen} onClose={closeEditRoleModal} title="Edit User Role">
                    <div className="space-y-4 h-full justify-between w-full" style={{ height: '200px' }}>
                        <Select
                            label="Role"
                            value={newRole}
                            onChange={(value) => setNewRole(value)}
                            required
                            className="text-black"
                            labelProps={{ className: "text-black" }}
                        >
                            {roles.map(role => (
                                <Option key={role.value} value={role.value} className="text-black">{role.label}</Option>
                            ))}
                        </Select>
                        <div className="flex justify-end gap-2">
                            <Button variant="text" color="red" onClick={closeEditRoleModal} className="w-full md:w-auto">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={updateRole} className="w-full md:w-auto">
                                <span>Update</span>
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={deleteConfirmModalOpen} onClose={cancelDelete} title="Confirm Deletion">
                    <div className="space-y-4">
                        {userToDelete && (() => {
                            const user = users.find(u => u.id === userToDelete);
                            return (
                                <p className="text-gray-700">
                                    Are you sure you want to delete user <strong>"{user?.fullName || `#${userToDelete}`}"</strong>? This action cannot be undone.
                                </p>
                            );
                        })()}
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                                variant="text" 
                                color="gray" 
                                onClick={cancelDelete}
                                disabled={deleting}
                                className="mr-2"
                            >
                                <span>No, Cancel</span>
                            </Button>
                            <Button 
                                color="red" 
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <div className="flex items-center gap-2">
                                        <ClipLoader size={13} color={"#ffffff"} />
                                        <span>Deleting...</span>
                                    </div>
                                ) : (
                                    <span>Yes, Delete</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default UsersPage;
