import React from "react";

export default function DynamicFieldArray({ label, fields, onChange, renderItem, emptyItem }) {
  const addItem = () => onChange([...fields, emptyItem]);
  const updateItem = (idx, value) => onChange(fields.map((item, i) => i === idx ? value : item));
  const removeItem = (idx) => onChange(fields.filter((_, i) => i !== idx));
  return (
    <div className="mb-4">
      <div className="font-bold mb-2">{label}</div>
      {fields.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center mb-2">
          {renderItem(item, (value) => updateItem(idx, value))}
          <button type="button" className="btn btn-xs btn-error" onClick={() => removeItem(idx)}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-outline" onClick={addItem}>Add {label}</button>
    </div>
  );
}