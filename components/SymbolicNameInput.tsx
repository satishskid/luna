
import React, { useState }
from 'react';
import { SYMBOLIC_NAMES_LIST } from '../constants';
import { SymbolicName } from '../types';
import { PaperPlaneIcon } from './icons';

interface SymbolicNameInputProps {
  onNameSelected: (name: SymbolicName) => void;
}

const SymbolicNameInput: React.FC<SymbolicNameInputProps> = ({ onNameSelected }) => {
  const [customName, setCustomName] = useState('');
  const [selectedPredefined, setSelectedPredefined] = useState<SymbolicName | null>(null);

  const handleSelectPredefined = (name: SymbolicName) => {
    setSelectedPredefined(name);
    setCustomName(''); // Clear custom input if predefined is selected
    onNameSelected(name);
  };

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    setSelectedPredefined(null); // Clear predefined selection
  };
  
  const handleCustomNameSubmit = () => {
    if (customName.trim()) {
      onNameSelected({ id: customName.trim().toLowerCase().replace(/\s+/g, '-'), name: customName.trim() });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-gray-100">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4" style={{fontFamily: "'Lora', serif"}}>Welcome to Luna</h1>
        <p className="text-lg text-slate-300 mb-8">Choose a symbolic name for our journey together. This is your private space.</p>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-sky-400">Choose a name:</h2>
          <div className="grid grid-cols-2 gap-3">
            {SYMBOLIC_NAMES_LIST.map(name => (
              <button
                key={name.id}
                onClick={() => handleSelectPredefined(name)}
                className={`p-3 rounded-lg transition-all duration-200 ease-in-out
                            ${selectedPredefined?.id === name.id 
                              ? 'bg-sky-500 text-white shadow-lg scale-105' 
                              : 'bg-slate-700 hover:bg-slate-600 focus:bg-sky-600 focus:ring-2 focus:ring-sky-400 focus:outline-none'} `}
              >
                {name.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-slate-400 my-4">Or, create your own:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customName}
              onChange={handleCustomNameChange}
              placeholder="Enter your symbolic name"
              className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none placeholder-slate-500"
            />
             <button
                onClick={handleCustomNameSubmit}
                disabled={!customName.trim()}
                className="p-3 bg-sky-600 hover:bg-sky-500 rounded-lg text-white disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Submit custom name"
            >
                <PaperPlaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-8">
          Your conversations with Luna are not stored or shared. This is your private sanctuary for reflection.
        </p>
      </div>
    </div>
  );
};

export default SymbolicNameInput;
