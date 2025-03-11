import { useState } from "react";
import { Check } from "lucide-react";

export default function MultiSelect({ options, selectedValues, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSelect = (value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  const handleOptionClick = (e, value) => {
    e.stopPropagation()
    toggleSelect(value);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };


  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        onClick={handleButtonClick}
        className="w-full px-4 py-2 text-left border rounded-md text-black bg-white shadow-sm"
      >
        {selectedValues.length > 0
          ? selectedValues.map((s) => options.find((o) => o.value === s)?.label).join(", ")
          : "Select..."}
      </button>
      {isOpen && (
        <div className="absolute w-full mt-1 bg-white text-black border rounded-md shadow-lg z-10">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center px-4 py-2 cursor-pointer text-black hover:bg-gray-100"
              onClick={(e) => handleOptionClick(e, option.value)}
            >
              <Check
                className={`mr-2 h-4 w-4 ${selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"}`}
              />
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
