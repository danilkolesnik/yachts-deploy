import { useState } from "react";
import { Button, Select, Option } from "@material-tailwind/react";
import { ClipLoader } from 'react-spinners';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import ReactSelect from 'react-select';

const CreateOfferModal = ({ isOpen, onClose, onSubmit, formData, handleChange, handleSelectChange, userOptions, catagoryData, partOptions, openCreateServiceModal, openCreatePartModal, loading }) => {
    return(
        <Modal isOpen={isOpen} onClose={onClose} title="Create Offer">
        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto h-full" style={{ height: '400px', overflowY: 'auto' }}>
            <ReactSelect
                options={userOptions}
                value={userOptions.find(option => option.label === formData.customerFullName) || null}
                onChange={selectedOption => handleChange({ target: { name: 'customerFullName', value: selectedOption ? selectedOption.label : '' } })}
                placeholder="Select a customer..."
                isClearable
                isSearchable
                className="mb-4"
                styles={{
                    control: (provided) => ({
                        ...provided,
                    }),
                    singleValue: (provided) => ({
                        ...provided,
                        color: 'black',
                    }),
                    option: (provided, state) => ({
                        ...provided,
                        color: 'black',
                        backgroundColor: state.isSelected ? '#e2e8f0' : state.isFocused ? '#cbd5e0' : 'white',
                    }),
                }}
            />
            <Input
                label="Yacht Name"
                name="yachtName"
                value={formData.yachtName}
                onChange={handleChange}
                required
            />
            <Input
                label="Yacht Model"
                name="yachtModel"
                value={formData.yachtModel}
                onChange={handleChange}
                required
            />
            <Input
                label="Boat Registration"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                required
            />
            <Select
                label="Services"
                value={formData.services}
                onChange={(value) => handleSelectChange(value, 'services')}
                required
                className="text-black"
                labelProps={{ className: "text-black" }}
            >
                {catagoryData.map((category) => (
                    <Option key={category.id} value={category} className="text-black">
                        {`${category.serviceName} - ${category.priceInEuroWithoutVAT}€`}
                    </Option>
                ))}
            </Select>
            <Button onClick={openCreateServiceModal} color="blue">
                Add Service
            </Button>
            <div className="mb-4">
                <label htmlFor="parts-select" className="block text-sm font-medium text-gray-700">
                    Select Parts
                </label>
                <ReactSelect
                    id="parts-select"
                    isMulti
                    options={partOptions}
                    value={formData.parts}
                    onChange={(selectedOptions) => handleSelectChange(selectedOptions, 'parts')}
                    placeholder="Select parts..."
                    className="mt-1"
                    styles={{
                        control: (provided) => ({
                            ...provided,
                        }),
                        option: (provided, state) => ({
                            ...provided,
                            color: 'black',
                            backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                        }),
                    }}
                />
            </div>
            <Button onClick={openCreatePartModal} color="blue">
                Add Part
            </Button>

            <Select
                label="Status"
                value={formData.status}
                onChange={(value) => handleSelectChange(value, 'status')}
                required
                className="text-black"
                labelProps={{ className: "text-black" }}
            >
                <Option value="created" className="text-black">Created</Option>
                <Option value="sent" className="text-black">Sent</Option>
                <Option value="discussing" className="text-black">Discussing</Option>
                <Option value="confirmed" className="text-black">Confirmed</Option>
                <Option value="canceled" className="text-black">Canceled</Option>
            </Select>
            <div className="flex justify-end">
                <Button variant="text" color="red" onClick={onClose} className="mr-1">
                    <span>Cancel</span>
                </Button>
                <Button color="green" type="submit" disabled={loading}>
                    {loading ? <ClipLoader size={13} color={"#123abc"} /> : <span>Add</span>}
                </Button>
            </div>
        </form>
    </Modal>
    )
};

export default CreateOfferModal;