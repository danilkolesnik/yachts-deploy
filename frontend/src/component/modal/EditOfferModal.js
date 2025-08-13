import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import { Button, Select, Option } from "@material-tailwind/react";
import ReactSelect from 'react-select';

const EditOfferModal = ({ isOpen, onClose, onSubmit, formData, handleChange, handleSelectChange, userOptions, catagoryData, partOptions, openCreateServiceModal, openCreatePartModal, openCreateCustomerModal }) => {
    const combinedParts = partOptions.map(part => ({
        ...part,
        color: part.value.unofficially ? 'green' : 'red'
    }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Offer">
        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto h-96" style={{ height: '400px', overflowY: 'auto' }}>
            <div className="mb-4">
                <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700">
                    Select Customer
                </label>
                <ReactSelect
                    id="customer-select"
                    options={userOptions}
                    value={userOptions.find(option => option.label === formData.customerFullName)}
                    onChange={selectedOption => handleChange({ target: { name: 'customerFullName', value: selectedOption ? selectedOption.label : '' } })}
                    placeholder="Select a customer..."
                    isClearable
                    isSearchable
                    className="mb-2"
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
                <Button 
                    type="button"
                    onClick={openCreateCustomerModal} 
                    color="blue" 
                    size="sm"
                    className="w-auto px-4"
                >
                    Add New Customer
                </Button>
            </div>
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
                    options={combinedParts}
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
                            color: state.data.color,
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
                <Button color="green" type="submit">
                    <span>Update</span>
                </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditOfferModal;