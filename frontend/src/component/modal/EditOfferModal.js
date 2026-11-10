import { useState } from 'react';
import Modal from '@/ui/Modal';
import Input from '@/ui/Input';
import { Button, Select, Option } from "@material-tailwind/react";
import ReactSelect from 'react-select';
import OfferLineItemsFields from '@/component/OfferLineItemsFields';
import ManualOfferPartForm from '@/component/ManualOfferPartForm';
import {
    buildServiceSelectOptions,
    createLineKey,
    filterServiceSelectOption,
    findServiceOptionByExactCode,
    getSparePartHighlightColor,
} from '@/utils/offerLineItems';
import { ensureDescriptionForLanguage } from '@/utils/translateText';

const EditOfferModal = ({ isOpen, onClose, onSubmit, formData, handleChange, handleSelectChange, userOptions, catagoryData, partOptions, openCreateServiceModal, openCreatePartModal, openCreateCustomerModal, yachts, handleYachtSelect }) => {
    const [pendingService, setPendingService] = useState(null);
    const [pendingPart, setPendingPart] = useState(null);
    const [languageBusy, setLanguageBusy] = useState(false);

    const combinedParts = partOptions.map(part => ({
        ...part,
        color: getSparePartHighlightColor(part)
    }));

    const yachtOptions = yachts.map(yacht => ({
        value: yacht,
        label: `${yacht.name} - ${yacht.model}`
    }));

    const serviceOptions = buildServiceSelectOptions(catagoryData, formData.language);

    const handleServiceInputChange = (inputValue, { action }) => {
        if (action !== 'input-change') return inputValue;
        const exact = findServiceOptionByExactCode(serviceOptions, inputValue);
        if (exact) {
            setPendingService(exact);
        }
        return inputValue;
    };

    const addServiceLine = () => {
        if (!pendingService?.value) return;
        const category = pendingService.value;
        handleSelectChange(
            [
                ...(formData.services || []),
                {
                    ...category,
                    lineKey: createLineKey(),
                    quantity: 1,
                    descriptionEn: '',
                    descriptionHr: '',
                },
            ],
            'services',
        );
        setPendingService(null);
    };

    const addPartLine = () => {
        if (!pendingPart) return;
        handleSelectChange(
            [
                ...(formData.parts || []),
                {
                    ...pendingPart,
                    lineKey: createLineKey(),
                    quantity: 1,
                    descriptionEn: '',
                    descriptionHr: '',
                },
            ],
            'parts',
        );
        setPendingPart(null);
    };

    const handleLanguageChange = async (value) => {
        handleSelectChange(value, 'language');
        setLanguageBusy(true);
        try {
            const nextServices = await Promise.all(
                (formData.services || []).map((s) => ensureDescriptionForLanguage(s, value)),
            );
            const nextParts = await Promise.all(
                (formData.parts || []).map((p) => ensureDescriptionForLanguage(p, value)),
            );
            handleSelectChange(nextServices, 'services');
            handleSelectChange(nextParts, 'parts');
        } finally {
            setLanguageBusy(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Offer" size="xl">
            <div className="max-h-[70vh] overflow-y-auto pr-2 text-black">
                <form onSubmit={onSubmit} className="space-y-4">
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
            <Select
                label="Language"
                value={formData.language}
                onChange={handleLanguageChange}
                required
                className="text-black"
                labelProps={{ className: "text-black" }}
                disabled={languageBusy}
            >
                <Option value="hr" className="text-black">Hrvatski</Option>
                <Option value="en" className="text-black">English</Option>
                <Option value="de" className="text-black">Deutsch</Option>
            </Select>
            {languageBusy ? (
                <p className="text-xs text-gray-500">Updating line descriptions for the new language…</p>
            ) : null}
            <div className="mb-4">
                <label htmlFor="services-select" className="block text-sm font-medium text-gray-700">
                    Add service line
                </label>
                <div className="flex flex-col md:flex-row gap-2 mt-1">
                    <div className="flex-1">
                        <ReactSelect
                            id="services-select"
                            options={serviceOptions}
                            value={pendingService}
                            onChange={(option) => setPendingService(option)}
                            onInputChange={handleServiceInputChange}
                            filterOption={filterServiceSelectOption}
                            placeholder="Search by name or service code…"
                            isClearable
                            isSearchable
                            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                            menuShouldScrollIntoView={false}
                            styles={{
                                control: (provided) => ({ ...provided }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: 'black',
                                    backgroundColor: state.isSelected ? '#e2e8f0' : state.isFocused ? '#cbd5e0' : 'white',
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    </div>
                    <Button type="button" color="blue" onClick={addServiceLine} disabled={!pendingService}>
                        Add line
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Search by service name or Synesis code. Exact code auto-selects the service. Same service can be added multiple times.
                </p>
            </div>
            <Button type="button" onClick={openCreateServiceModal} color="blue" variant="outlined">
                Create new service
            </Button>
            <OfferLineItemsFields
                services={formData.services}
                parts={[]}
                language={formData.language}
                onServicesChange={(nextServices) => handleSelectChange(nextServices, 'services')}
                onPartsChange={() => {}}
            />
            <div className="mb-4">
                <label htmlFor="parts-select" className="block text-sm font-medium text-gray-700">
                    Add part line
                </label>
                <div className="flex flex-col md:flex-row gap-2 mt-1">
                    <div className="flex-1">
                        <ReactSelect
                            id="parts-select"
                            options={combinedParts}
                            value={pendingPart}
                            onChange={(option) => setPendingPart(option)}
                            placeholder="Select a part to add…"
                            isClearable
                            isSearchable
                            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                            menuShouldScrollIntoView={false}
                            styles={{
                                control: (provided) => ({ ...provided }),
                                option: (provided, state) => ({
                                    ...provided,
                                    color: getSparePartHighlightColor(state.data),
                                    backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    </div>
                    <Button type="button" color="blue" onClick={addPartLine} disabled={!pendingPart}>
                        Add line
                    </Button>
                </div>
            </div>
            <Button type="button" onClick={openCreatePartModal} color="blue" variant="outlined">
                Create new warehouse part
            </Button>
            <ManualOfferPartForm
                onAdd={(line) =>
                    handleSelectChange([...(formData.parts || []), line], 'parts')
                }
            />
            <OfferLineItemsFields
                services={[]}
                parts={formData.parts}
                language={formData.language}
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
                <label htmlFor="edit-offer-remark" className="block text-sm font-medium text-gray-700 mb-1">
                    Remark (payment terms)
                </label>
                <textarea
                    id="edit-offer-remark"
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
                <Option value="finished" className="text-black">Completed</Option>
                <Option value="canceled" className="text-black">Canceled</Option>
            </Select>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="text" color="red" onClick={onClose} className="mr-1">
                            <span>Cancel</span>
                        </Button>
                        <Button color="green" type="submit">
                            <span>Update</span>
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default EditOfferModal;