import { Button, Select, Option } from "@material-tailwind/react";
import { ClipLoader } from 'react-spinners';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import ReactSelect from 'react-select';
import OfferLineItemsFields from '@/component/OfferLineItemsFields';
import { mergeSelectedParts, mergeSelectedServices } from '@/utils/offerLineItems';

const CreateOfferModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    formData, 
    handleChange, 
    handleSelectChange, 
    userOptions, 
    catagoryData, 
    partOptions, 
    openCreateServiceModal, 
    openCreatePartModal, 
    openCreateCustomerModal, 
    loading, 
    yachts,
    handleYachtSelect 
}) => {
    const yachtOptions = yachts.map(yacht => ({
        value: yacht,
        label: `${yacht.name} - ${yacht.model}`
    }));

    const serviceOptions = catagoryData.map(category => ({
        value: category,
        label: `${category.serviceName} - ${category.priceInEuroWithoutVAT}€`
    }));

    const selectedServiceOptions = serviceOptions.filter(option =>
        Array.isArray(formData.services) && formData.services.some(service => {
            const serviceId = service?.id ?? service?.value?.id;
            const optionId = option.value?.id;

            if (serviceId && optionId) {
                return serviceId === optionId;
            }

            return (service?.serviceName ?? service?.value?.serviceName) === option.value?.serviceName;
        })
    );

    const combinedParts = partOptions.map(part => ({
        ...part,
        color: part.unofficially ? 'green' : 'red'
    }));

    return(
        <Modal isOpen={isOpen} onClose={onClose} title="Create Offer" size="xl" bodyClassName="!p-0">
        <form
            onSubmit={onSubmit}
            className="flex flex-col h-[70vh] max-h-[700px]"
        >
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-4">
            <div className="mb-4">
                <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700">
                    Select Customer
                </label>
                <ReactSelect
                    id="customer-select"
                    options={userOptions}
                    value={userOptions.find(option => option.label === formData.customerFullName) || null}
                    onChange={selectedOption => {
                        handleChange({ target: { name: 'customerFullName', value: selectedOption ? selectedOption.label : '' } });
                        // Reset selected yachts when customer changes
                    }}
                    placeholder="Select a customer..."
                    isClearable
                    isSearchable
                    className="mb-2"
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
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
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                        }),
                        menuList: (base) => ({
                            ...base,
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
            <div className="mb-4">
                <label htmlFor="yacht-select" className="block text-sm font-medium text-gray-700">
                    Select Yacht(s)
                </label>
                <ReactSelect
                    id="yacht-select"
                    options={yachtOptions}
                    value={yachtOptions.filter(option => 
                        formData.yachts.some(yacht => yacht.name === option.value.name && yacht.model === option.value.model)
                    )}
                    onChange={selectedOptions => handleYachtSelect(selectedOptions?.map(option => option.value) || [])}
                    placeholder={formData.customerFullName ? "Select yachts..." : "First select a customer..."}
                    isClearable
                    isSearchable
                    isMulti
                    className="mt-1"
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    styles={{
                        control: (provided) => ({
                            ...provided,
                        }),
                        option: (provided, state) => ({
                            ...provided,
                            color: 'black',
                            backgroundColor: state.isSelected ? '#e2e8f0' : state.isFocused ? '#cbd5e0' : 'white',
                        }),
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                        }),
                        menuList: (base) => ({
                            ...base,
                        }),
                    }}
                />
            </div>
            <Input
                label="Boat Registration"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                required
            />
            {/* <Input
                label="Yacht Name"
                name="yachtName"
                value={formData.yachtName}
                onChange={handleChange}
                required
            />
            <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
            /> */}
            <Select
                label="Language"
                value={formData.language}
                onChange={(value) => handleSelectChange(value, 'language')}
                required
                className="text-black"
                labelProps={{ className: "text-black" }}
            >
                <Option value="hr" className="text-black">Hrvatski</Option>
                <Option value="en" className="text-black">English</Option>
                <Option value="de" className="text-black">Deutsch</Option>
            </Select>
            <div className="mb-4">
                <label htmlFor="services-select" className="block text-sm font-medium text-gray-700">
                    Select Services
                </label>
                <ReactSelect
                    id="services-select"
                    isMulti
                    options={serviceOptions}
                    value={selectedServiceOptions}
                    onChange={(selectedOptions) =>
                        handleSelectChange(
                            mergeSelectedServices(
                                formData.services,
                                (selectedOptions || []).map((option) => option.value),
                            ),
                            'services',
                        )
                    }
                    placeholder="Select services..."
                    className="mt-1"
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    styles={{
                        control: (provided) => ({
                            ...provided,
                        }),
                        option: (provided, state) => ({
                            ...provided,
                            color: 'black',
                            backgroundColor: state.isSelected ? '#e2e8f0' : state.isFocused ? '#cbd5e0' : 'white',
                        }),
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                        }),
                        menuList: (base) => ({
                            ...base,
                        }),
                    }}
                />
            </div>
            <Button type="button" onClick={openCreateServiceModal} color="blue">
                Add Service
            </Button>
            <OfferLineItemsFields
                services={formData.services}
                parts={[]}
                onServicesChange={(nextServices) => handleSelectChange(nextServices, 'services')}
                onPartsChange={() => {}}
            />
            <div className="mb-4">
                <label htmlFor="parts-select" className="block text-sm font-medium text-gray-700">
                    Select Parts
                </label>
                <ReactSelect
                    id="parts-select"
                    isMulti
                    options={combinedParts}
                    value={formData.parts}
                    onChange={(selectedOptions) =>
                        handleSelectChange(mergeSelectedParts(formData.parts, selectedOptions || []), 'parts')
                    }
                    placeholder="Select parts..."
                    className="mt-1"
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    styles={{
                        control: (provided) => ({
                            ...provided,
                        }),
                        option: (provided, state) => ({
                            ...provided,
                            color: state.data.unofficially ? 'green' : 'gray',
                            backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                        }),
                        multiValueLabel: (provided, state) => ({
                            ...provided,
                            color: state.data.unofficially ? 'green' : 'gray',
                        }),
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                        }),
                        menuList: (base) => ({
                            ...base,
                        }),
                    }}
                />
            </div>
            <Button type="button" onClick={openCreatePartModal} color="blue">
                Add Part
            </Button>
            <OfferLineItemsFields
                services={[]}
                parts={formData.parts}
                onServicesChange={() => {}}
                onPartsChange={(nextParts) => handleSelectChange(nextParts, 'parts')}
            />

            <Input
                label="Discount (%)"
                name="discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercent ?? ''}
                onChange={handleChange}
            />

            <div>
                <label htmlFor="offer-remark" className="block text-sm font-medium text-gray-700 mb-1">
                    Remark (payment terms)
                </label>
                <textarea
                    id="offer-remark"
                    name="comment"
                    rows={3}
                    value={formData.comment ?? ''}
                    onChange={handleChange}
                    placeholder="e.g. 50% advance payment, 50% after completing the work"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm"
                />
            </div>

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
            </div>
            <div className="flex justify-end shrink-0 border-t border-gray-200 px-4 py-3 bg-white">
                <Button type="button" variant="text" color="red" onClick={onClose} className="mr-1">
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