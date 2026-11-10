import { useState } from 'react';
import { Button } from '@material-tailwind/react';
import { toast } from 'react-toastify';
import Input from '@/ui/Input';
import { createLineKey, parseEuroNumber } from '@/utils/offerLineItems';

const emptyForm = {
    name: '',
    quantity: '1',
    unitsOfMeasurement: '',
    pricePerUnit: '',
};

/** Material line that exists only on the offer. No warehouse card, no stock change. */
export default function ManualOfferPartForm({ onAdd }) {
    const [form, setForm] = useState(emptyForm);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const addLine = () => {
        const name = String(form.name || '').trim();
        const unit = String(form.unitsOfMeasurement || '').trim();
        const quantity = parseEuroNumber(form.quantity);
        if (!name) {
            toast.error('Material name is required');
            return;
        }
        if (!String(form.quantity ?? '').trim() || !(quantity > 0)) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        if (!unit) {
            toast.error('Unit of measurement is required');
            return;
        }
        if (!String(form.pricePerUnit ?? '').trim()) {
            toast.error('Price is required');
            return;
        }

        onAdd({
            lineKey: createLineKey(),
            label: name,
            partName: name,
            quantity,
            unitsOfMeasurement: unit,
            pricePerUnit: parseEuroNumber(form.pricePerUnit),
            articleNumber: '',
            value: '',
            offWarehouse: true,
            descriptionEn: '',
            descriptionHr: '',
        });
        setForm(emptyForm);
    };

    return (
        <div className="mt-3 rounded border border-dashed border-gray-300 p-3 space-y-3">
            <div>
                <p className="text-sm font-medium text-gray-800">Add material not in warehouse</p>
                <p className="text-xs text-gray-500 mt-1">
                    Consumables or custom-made items. Added only to this offer. Stock is not created or changed.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                    label="Name"
                    name="manualPartName"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="e.g. Sealant, custom railing"
                />
                <Input
                    label="Quantity"
                    name="manualPartQuantity"
                    value={form.quantity}
                    onChange={(e) => setField('quantity', e.target.value)}
                    placeholder="1"
                />
                <Input
                    label="Unit"
                    name="manualPartUnit"
                    value={form.unitsOfMeasurement}
                    onChange={(e) => setField('unitsOfMeasurement', e.target.value)}
                    placeholder="pcs., m, kg, l"
                />
                <Input
                    label="Price (€)"
                    name="manualPartPrice"
                    value={form.pricePerUnit}
                    onChange={(e) => setField('pricePerUnit', e.target.value)}
                    placeholder="0,00"
                />
            </div>
            <div className="flex justify-end">
                <Button type="button" color="blue" variant="outlined" onClick={addLine}>
                    Add material
                </Button>
            </div>
        </div>
    );
}
