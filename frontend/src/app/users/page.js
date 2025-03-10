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

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editRoleModalIsOpen, setEditRoleModalIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [userOptions, setUserOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');

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
            name: 'Full Name',
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
            } else {
                console.error('Failed to update role:', response.data.message);
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    const deleteUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${URL}/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.code === 200) {
                setUsers(users.filter(user => user.id !== userId));
            } else {
                console.error('Failed to delete user:', response.data.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleUserChange = (selectedOption) => {
        setSelectedUser(selectedOption);
        if (selectedOption) {
            setUsers(users.filter(user => user.id === selectedOption.value));
        } else {
            fetchUsers();
        }
    };

    const handleInputChange = (value) => {
        setInputValue(value);
    };

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
            <div className="min-h-screen bg-gray-100 p-8 font-sans">
                {loading ? (
                    <div className="flex justify-center items-center min-h-screen">
                        <Loader loading={loading} />
                    </div>
                ) : (
                    <div className="w-full space-y-6 bg-white rounded shadow-md">
                         <ReactSelect
                            options={userOptions}
                            value={selectedUser}
                            onChange={handleUserChange}
                            onInputChange={handleInputChange}
                            inputValue={inputValue}
                            placeholder="Search..."
                            isClearable
                            isSearchable
                            menuIsOpen={inputValue.length > 0}
                            className="mb-4 p-[16px] w-80"
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
                        <DataTable
                            columns={columns}
                            data={users}
                            pagination
                            highlightOnHover
                            pointerOnHover
                            className="min-w-full border-collapse"
                        />
                    </div>
                )}
                <Modal isOpen={editRoleModalIsOpen} onClose={closeEditRoleModal} title="Edit User Role">
                    <div className="space-y-4">
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
                        <div className="flex justify-end">
                            <Button variant="text" color="red" onClick={closeEditRoleModal} className="mr-1">
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={updateRole}>
                                <span>Update</span>
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default UsersPage;
