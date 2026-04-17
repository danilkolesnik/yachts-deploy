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
import Input from '@/ui/Input';
import { useRouter } from 'next/navigation';

const UsersPage = () => {
    const router = useRouter();
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
    const [profileModalIsOpen, setProfileModalIsOpen] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        dateOfBirth: '',
        phone: '',
        secondaryPhone: '',
        address: '',
        contractStart: '',
        contractEnd: '',
        position: '',
        notes: '',
        responsibilityAreasText: '',
    });

    const [createModalIsOpen, setCreateModalIsOpen] = useState(false);
    const [createType, setCreateType] = useState('user'); // user | employee | client
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: '',
        fullName: '',
        password: '',
        role: 'user',
        // employee card fields
        dateOfBirth: '',
        phone: '',
        secondaryPhone: '',
        address: '',
        contractStart: '',
        contractEnd: '',
        position: '',
        notes: '',
    });
    const [createdClientTempPassword, setCreatedClientTempPassword] = useState('');

    const roles = [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'mechanic', label: 'Mechanic' },
        { value: 'electrician', label: 'Electrician' },
        { value: 'user', label: 'User' },
        { value: 'client', label: 'Client' },
    ];

    const openCreateModal = (type) => {
        setCreateType(type);
        setCreatedClientTempPassword('');
        setCreateForm({
            email: '',
            fullName: '',
            password: '',
            role: type === 'employee' ? 'mechanic' : 'user',
            dateOfBirth: '',
            phone: '',
            secondaryPhone: '',
            address: '',
            contractStart: '',
            contractEnd: '',
            position: '',
            notes: '',
        });
        setCreateModalIsOpen(true);
    };

    const closeCreateModal = () => {
        setCreateModalIsOpen(false);
        setCreating(false);
        setCreatedClientTempPassword('');
    };

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm((prev) => ({ ...prev, [name]: value }));
    };

    const submitCreate = async () => {
        setCreating(true);
        try {
            if (!createForm.email || !createForm.fullName) {
                toast.error('Email and full name are required');
                return;
            }

            if (createType !== 'client' && !createForm.password) {
                toast.error('Password is required');
                return;
            }

            const isValidDateYYYYMMDD = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
            const ensureValidOptionalDate = (value, fieldLabel) => {
                if (!value) return null;
                if (!isValidDateYYYYMMDD(value)) {
                    toast.error(`${fieldLabel} must be a valid date (YYYY-MM-DD)`);
                    return undefined;
                }
                return value;
            };

            // Pre-validate employee profile dates BEFORE creating user (prevents "created despite error")
            let prevalidatedEmployeeProfilePayload = null;
            if (createType === 'employee') {
                const dateOfBirth = ensureValidOptionalDate(createForm.dateOfBirth, 'Date of birth');
                if (dateOfBirth === undefined) return;
                const contractStart = ensureValidOptionalDate(createForm.contractStart, 'Contract start');
                if (contractStart === undefined) return;
                const contractEnd = ensureValidOptionalDate(createForm.contractEnd, 'Contract end');
                if (contractEnd === undefined) return;

                if (contractStart && contractEnd && contractStart > contractEnd) {
                    toast.error('Contract start must be before contract end');
                    return;
                }

                prevalidatedEmployeeProfilePayload = {
                    fullName: createForm.fullName,
                    dateOfBirth,
                    phone: createForm.phone || '',
                    secondaryPhone: createForm.secondaryPhone || '',
                    address: createForm.address || '',
                    contractStart,
                    contractEnd,
                    position: createForm.position || '',
                    notes: createForm.notes,
                };
            }

            // 1) Create base user
            let createdUser;
            let createdUserId = null;
            if (createType === 'client') {
                const res = await axios.post(`${URL}/auth/register/client`, {
                    email: createForm.email,
                    fullName: createForm.fullName,
                });
                if (res.data.code !== 201) {
                    toast.error(res.data.message || 'Failed to create client user');
                    return;
                }
                createdUser = res.data.data;
                createdUserId = createdUser?.id || null;
                if (res.data.temporaryPassword) {
                    setCreatedClientTempPassword(res.data.temporaryPassword);
                }
            } else {
                const res = await axios.post(`${URL}/auth/register`, {
                    email: createForm.email,
                    fullName: createForm.fullName,
                    password: createForm.password,
                });
                if (res.data.code !== 201) {
                    toast.error(res.data.message || 'Failed to create user');
                    return;
                }
                createdUser = res.data.data;
                createdUserId = createdUser?.id || null;
            }

            // 2) Set role for employee/user if needed
            if (createType === 'employee') {
                try {
                    const roleRes = await axios.put(`${URL}/users/${createdUser.id}/role`, {
                        role: createForm.role,
                    });
                    if (roleRes.data.code !== 200) {
                        toast.error(roleRes.data.message || 'Failed to set employee role');
                        throw new Error(roleRes.data.message || 'Failed to set employee role');
                    }

                    // 3) Save employee profile card
                    const profRes = await axios.put(
                        `${URL}/users/${createdUser.id}/profile`,
                        prevalidatedEmployeeProfilePayload
                    );
                    if (profRes.data.code !== 200) {
                        toast.error(profRes.data.message || 'Failed to save employee profile');
                        throw new Error(profRes.data.message || 'Failed to save employee profile');
                    }
                } catch (e) {
                    // rollback: avoid leaving a created user when employee setup failed
                    try {
                        if (createdUserId) {
                            const token = localStorage.getItem('token');
                            await axios.delete(`${URL}/users/${createdUserId}`, {
                                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                            });
                        }
                    } catch (rollbackError) {
                        console.error('Rollback delete failed', rollbackError);
                    }
                    throw e;
                }
            }

            // refresh list
            await fetchUsers();
            toast.success('Created successfully');

            // keep modal open for client to copy temp password
            if (createType !== 'client') {
                closeCreateModal();
            }
        } catch (e) {
            console.error('Create failed', e);
            toast.error('Create failed');
        } finally {
            setCreating(false);
        }
    };

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
                        onClick={() => openProfileModal(row)}
                        className="text-green-500 hover:text-green-700"
                        title="Edit employee profile"
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

    const closeProfileModal = () => {
        setProfileModalIsOpen(false);
        setProfileUser(null);
        setProfileForm({
            fullName: '',
            dateOfBirth: '',
            phone: '',
            secondaryPhone: '',
            address: '',
            contractStart: '',
            contractEnd: '',
            position: '',
            notes: '',
            responsibilityAreasText: '',
        });
        setProfileLoading(false);
        setProfileSaving(false);
    };

    const openProfileModal = async (user) => {
        setProfileUser(user);
        setProfileModalIsOpen(true);
        setProfileLoading(true);
        try {
            const response = await axios.get(`${URL}/users/${user.id}/profile`);
            if (response.data.code === 200 && response.data.data) {
                const profile = response.data.data;
                setProfileForm({
                    fullName: profile.fullName || user.fullName || '',
                    dateOfBirth: profile.dateOfBirth || '',
                    phone: profile.phone || '',
                    secondaryPhone: profile.secondaryPhone || '',
                    address: profile.address || '',
                    contractStart: profile.contractStart || '',
                    contractEnd: profile.contractEnd || '',
                    position: profile.position || '',
                    notes: profile.notes || '',
                    responsibilityAreasText: Array.isArray(profile.responsibilityAreas)
                        ? profile.responsibilityAreas.join(', ')
                        : '',
                });
            } else {
                setProfileForm((prev) => ({
                    ...prev,
                    fullName: user.fullName || '',
                }));
            }
        } catch (error) {
            console.error('Error loading employee profile:', error);
            toast.error('Error loading employee profile');
        } finally {
            setProfileLoading(false);
        }
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

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const saveProfile = async () => {
        if (!profileUser) return;
        setProfileSaving(true);
        try {
            const responsibilityAreas = profileForm.responsibilityAreasText
                ? profileForm.responsibilityAreasText
                      .split(',')
                      .map((item) => item.trim())
                      .filter((item) => item.length > 0)
                : [];

            const payload = {
                fullName: profileForm.fullName,
                dateOfBirth: profileForm.dateOfBirth || null,
                phone: profileForm.phone,
                secondaryPhone: profileForm.secondaryPhone,
                address: profileForm.address,
                contractStart: profileForm.contractStart || null,
                contractEnd: profileForm.contractEnd || null,
                position: profileForm.position,
                notes: profileForm.notes,
                responsibilityAreas,
            };

            const response = await axios.put(
                `${URL}/users/${profileUser.id}/profile`,
                payload
            );

            if (response.data.code === 200) {
                toast.success('Employee profile saved successfully');
                // Обновляем имя клиента в таблице, если изменили fullName
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === profileUser.id
                            ? { ...u, fullName: profileForm.fullName || u.fullName }
                            : u
                    )
                );
                closeProfileModal();
            } else {
                console.error('Failed to save employee profile:', response.data.message);
                toast.error('Failed to save employee profile');
            }
        } catch (error) {
            console.error('Error saving employee profile:', error);
            toast.error('Error saving employee profile');
        } finally {
            setProfileSaving(false);
        }
    };

    // Filter users based on search and role filter
    const filteredUsers = users.filter(user => {
        const matchesSearch = !selectedUser || user.id === selectedUser.value;
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${URL}/users`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error?.response?.status === 401) {
                toast.error('Authorization required');
                return;
            }
            if (error?.response?.status === 403) {
                toast.error('No access to Users');
            }
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
                                <Option className="text-black" value="client">Client</Option>
                                <Option className="text-black" value="manager">Manager</Option>
                                <Option className="text-black" value="mechanic">Mechanic</Option>
                                <Option className="text-black" value="electrician">Electrician</Option>
                            </Select>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <Button color="blue" onClick={() => openCreateModal('user')} className="w-full md:w-auto">
                                    <span>Create user</span>
                                </Button>
                                <Button color="green" onClick={() => openCreateModal('employee')} className="w-full md:w-auto">
                                    <span>Create employee</span>
                                </Button>
                                <Button color="purple" onClick={() => openCreateModal('client')} className="w-full md:w-auto">
                                    <span>Create client access</span>
                                </Button>
                                <Button color="white" onClick={() => router.push('/users/history')} className="w-full md:w-auto border-[2px] border-[#D33] text-[#000]">
                                    <span>History</span>
                                </Button>
                            </div>
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
                <Modal
                    isOpen={editRoleModalIsOpen}
                    onClose={closeEditRoleModal}
                    title="Edit User Role"
                    bodyClassName="overflow-visible"
                >
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

                <Modal
                    isOpen={profileModalIsOpen}
                    onClose={closeProfileModal}
                    title={
                        profileUser
                            ? `Employee profile: ${profileUser.fullName || profileUser.email}`
                            : 'Employee profile'
                    }
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        {profileLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <ClipLoader size={20} color="#123abc" />
                            </div>
                        ) : (
                            <>
                                <Input
                                    label="Full name"
                                    name="fullName"
                                    value={profileForm.fullName}
                                    onChange={handleProfileChange}
                                    required
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Date of birth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={profileForm.dateOfBirth || ''}
                                        onChange={handleProfileChange}
                                    />
                                    <Input
                                        label="Position / Specialization"
                                        name="position"
                                        value={profileForm.position}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Phone"
                                        name="phone"
                                        value={profileForm.phone}
                                        onChange={handleProfileChange}
                                    />
                                    <Input
                                        label="Secondary phone"
                                        name="secondaryPhone"
                                        value={profileForm.secondaryPhone}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <Input
                                    label="Address"
                                    name="address"
                                    value={profileForm.address}
                                    onChange={handleProfileChange}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Contract start"
                                        name="contractStart"
                                        type="date"
                                        value={profileForm.contractStart || ''}
                                        onChange={handleProfileChange}
                                    />
                                    <Input
                                        label="Contract end"
                                        name="contractEnd"
                                        type="date"
                                        value={profileForm.contractEnd || ''}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Responsibility areas
                                    </label>
                                    <textarea
                                        name="responsibilityAreasText"
                                        value={profileForm.responsibilityAreasText}
                                        onChange={handleProfileChange}
                                        rows={2}
                                        className="w-full border rounded-md p-2 text-sm text-black"
                                        placeholder="Example: engine, electricity, hydraulics"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Separate multiple areas with commas.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={profileForm.notes}
                                        onChange={handleProfileChange}
                                        rows={3}
                                        className="w-full border rounded-md p-2 text-sm text-black"
                                        placeholder="Additional comments / remarks"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        variant="text"
                                        color="red"
                                        onClick={closeProfileModal}
                                        className="w-full md:w-auto"
                                        disabled={profileSaving}
                                    >
                                        <span>Cancel</span>
                                    </Button>
                                    <Button
                                        color="green"
                                        onClick={saveProfile}
                                        className="w-full md:w-auto"
                                        disabled={profileSaving}
                                    >
                                        {profileSaving ? (
                                            <div className="flex items-center gap-2">
                                                <ClipLoader size={13} color="#ffffff" />
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <span>Save</span>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={deleteConfirmModalOpen} onClose={cancelDelete} title="Confirm Deletion">
                    <div className="space-y-4">
                        {userToDelete && (() => {
                            const user = users.find(u => u.id === userToDelete);
                            return (
                                <p className="text-gray-700">
                                    Are you sure you want to delete user <strong>&quot;{user?.fullName || `#${userToDelete}`}&quot;</strong>? This action cannot be undone.
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

                <Modal
                    isOpen={createModalIsOpen}
                    onClose={closeCreateModal}
                    title={
                        createType === 'employee'
                            ? 'Create employee'
                            : createType === 'client'
                            ? 'Create client access'
                            : 'Create user'
                    }
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <Input label="Email" name="email" value={createForm.email} onChange={handleCreateChange} required />
                        <Input label="Full name" name="fullName" value={createForm.fullName} onChange={handleCreateChange} required />

                        {createType !== 'client' && (
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                value={createForm.password}
                                onChange={handleCreateChange}
                                required
                            />
                        )}

                        {createType === 'employee' && (
                            <>
                                <Select
                                    label="Role"
                                    value={createForm.role}
                                    onChange={(value) => setCreateForm((p) => ({ ...p, role: value }))}
                                    className="text-black"
                                    labelProps={{ className: "text-black" }}
                                >
                                    <Option className="text-black" value="mechanic">Mechanic</Option>
                                    <Option className="text-black" value="electrician">Electrician</Option>
                                    <Option className="text-black" value="manager">Manager</Option>
                                </Select>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Date of birth" name="dateOfBirth" type="date" value={createForm.dateOfBirth} onChange={handleCreateChange} />
                                    <Input label="Position / Specialization" name="position" value={createForm.position} onChange={handleCreateChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Phone" name="phone" value={createForm.phone} onChange={handleCreateChange} />
                                    <Input label="Secondary phone" name="secondaryPhone" value={createForm.secondaryPhone} onChange={handleCreateChange} />
                                </div>
                                <Input label="Address" name="address" value={createForm.address} onChange={handleCreateChange} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Contract start" name="contractStart" type="date" value={createForm.contractStart} onChange={handleCreateChange} />
                                    <Input label="Contract end" name="contractEnd" type="date" value={createForm.contractEnd} onChange={handleCreateChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={createForm.notes}
                                        onChange={handleCreateChange}
                                        rows={3}
                                        className="w-full border rounded-md p-2 text-sm text-black"
                                        placeholder="Additional comments / remarks"
                                    />
                                </div>
                            </>
                        )}

                        {createType === 'client' && createdClientTempPassword && (
                            <div className="p-3 rounded border bg-gray-50 text-black">
                                <div className="text-sm font-medium">Temporary password (copy and share once):</div>
                                <div className="mt-1 font-mono break-all">{createdClientTempPassword}</div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="text" color="red" onClick={closeCreateModal} disabled={creating}>
                                <span>Cancel</span>
                            </Button>
                            <Button color="green" onClick={submitCreate} disabled={creating}>
                                {creating ? (
                                    <div className="flex items-center gap-2">
                                        <ClipLoader size={13} color="#ffffff" />
                                        <span>Creating...</span>
                                    </div>
                                ) : (
                                    <span>Create</span>
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
