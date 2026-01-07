import React, { useState } from "react";

/**
 * InlineListEditor - Component for inline editing of lists (requirements, benefits)
 * Supports add, edit, remove operations with inline form controls
 */
export function InlineListEditor({
  items = [],
  onAdd,
  onUpdate,
  onRemove,
  itemType = "item", // 'requirement' or 'benefit'
  typeOptions = [],
  typeField = "requirement_type", // or 'benefit_type'
  titleField = "title",
  descriptionField = "description",
  additionalFields = [],
  placeholder = "Add new item...",
  emptyMessage = "No items yet",
  className = "",
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEditing = (index, item) => {
    setEditingIndex(index);
    setEditForm({ ...item });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (editingIndex !== null) {
      onUpdate(editingIndex, editForm);
    }
    cancelEditing();
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const isEditing = (index) => editingIndex === index;

  return (
    <div className={`space-y-3 ${className}`}>
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
          >
            {isEditing(index) ? (
              // Edit mode
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={editForm[typeField] || ""}
                    onChange={(e) =>
                      handleEditChange(typeField, e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type...</option>
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editForm[titleField] || ""}
                    onChange={(e) =>
                      handleEditChange(titleField, e.target.value)
                    }
                    placeholder="Title..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {additionalFields.map((field) => (
                  <input
                    key={field.name}
                    type={field.type || "text"}
                    value={editForm[field.name] || ""}
                    onChange={(e) =>
                      handleEditChange(field.name, e.target.value)
                    }
                    placeholder={field.placeholder || `${field.label}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}

                <textarea
                  value={editForm[descriptionField] || ""}
                  onChange={(e) =>
                    handleEditChange(descriptionField, e.target.value)
                  }
                  placeholder="Description (optional)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEditing}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // Display mode
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {typeOptions.find((opt) => opt.value === item[typeField])
                        ?.label || item[typeField]}
                    </span>
                    {item.is_required && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {item[titleField]}
                  </h4>
                  {item[descriptionField] && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item[descriptionField]}
                    </p>
                  )}
                  {additionalFields.map(
                    (field) =>
                      item[field.name] && (
                        <p
                          key={field.name}
                          className="text-xs text-gray-500 mt-1"
                        >
                          {field.label}: {item[field.name]}
                        </p>
                      )
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    type="button"
                    onClick={() => startEditing(index, item)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-150"
                    title="Edit"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-150"
                    title="Remove"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
