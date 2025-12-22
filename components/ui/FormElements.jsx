import React from 'react';

export const FormInput = ({ label, type="text", ...props }) => (
  <div>
    <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">{label}</label>
    <input 
      type={type} 
      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      {...props}
    />
  </div>
);

export const FormSelect = ({ label, options, ...props }) => (
  <div>
    <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">{label}</label>
    <select 
      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
      {...props}
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
