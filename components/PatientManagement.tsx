
import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { Pet, PetType } from '../types';
import { Plus, Search, UserPlus } from 'lucide-react';

const PatientManagement: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    ownerName: '',
    name: '',
    breed: '',
    age: 0,
    type: PetType.DOG,
    medicalNotes: ''
  });

  useEffect(() => {
    const loadPets = async () => {
      const loadedPets = await DB.getPets();
      setPets(loadedPets);
    };
    loadPets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await DB.savePet(formData);
    const updatedPets = await DB.getPets();
    setPets(updatedPets);
    setIsAdding(false);
    setFormData({
      ownerName: '',
      name: '',
      breed: '',
      age: 0,
      type: PetType.DOG,
      medicalNotes: ''
    });
  };

  const filteredPets = pets.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Gestión de Pacientes</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Dueño</label>
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la Mascota</label>
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as PetType })}
              >
                <option value={PetType.DOG}>Perro</option>
                <option value={PetType.CAT}>Gato</option>
                <option value={PetType.OTHER}>Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Raza</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.breed}
                onChange={e => setFormData({ ...formData, breed: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Edad</label>
              <input
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Consideraciones Médicas</label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 text-slate-900 dark:text-white"
                value={formData.medicalNotes}
                onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Guardar Paciente
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              placeholder="Buscar por mascota o dueño..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Mascota</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Dueño</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Especie/Raza</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Edad</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPets.map(pet => (
                <tr key={pet.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{pet.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{pet.ownerName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{pet.type} / {pet.breed}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{pet.age} años</td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-sm">
                    {new Date(pet.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredPets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No se encontraron pacientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientManagement;
