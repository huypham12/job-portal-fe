import React from 'react';
import Select from 'react-select';

/**
 * SearchableSelect - Enhanced dropdown with search functionality using react-select
 * Replaces basic select elements with searchable, accessible dropdowns
 */
export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = '',
  error = false,
  icon,
  multiple = false,
  onCreateOption, // For custom skill creation
  loading = false
}) {
  // Convert options to react-select format
  const selectOptions = options.map(option => ({
    value: option.value,
    label: option.label
  }));

  // Handle value conversion
  const getSelectValue = () => {
    if (multiple) {
      return selectOptions.filter(option => value.includes(option.value));
    }
    return selectOptions.find(option => option.value === value) || null;
  };

  const handleChange = (selected) => {
    if (multiple) {
      onChange(selected ? selected.map(item => item.value) : []);
    } else {
      onChange(selected ? selected.value : '');
    }
  };

  // Custom styles for react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #3b82f6') : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#9ca3af'
      },
      backgroundColor: disabled ? '#f9fafb' : 'white',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'text'
    }),
    valueContainer: (provided) => ({
      ...provided,
      paddingLeft: icon ? '2.5rem' : '0.75rem'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6b7280'
    }),
    input: (provided) => ({
      ...provided,
      color: '#111827'
    }),
    menu: (provided) => ({
      ...provided,
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999
    }),
    // Ensure portal-mounted menu is on top of modal overlays / other stacking contexts
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#dbeafe' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? '#1e40af' : '#111827',
      '&:active': {
        backgroundColor: '#dbeafe'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#dbeafe',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1e40af'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#3b82f6',
      '&:hover': {
        backgroundColor: '#bfdbfe',
        color: '#1d4ed8'
      }
    })
  };

  return (
    <div className={`relative ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          {icon}
        </div>
      )}

      <Select
        options={selectOptions}
        value={getSelectValue()}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={loading}
        isMulti={multiple}
        isClearable={false}
        isSearchable={true}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        menuShouldBlockScroll={true}
        onCreateOption={onCreateOption}
        createOptionPosition="first"
        formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
      />
    </div>
  );
}
