
import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { Pet, PetType, SkullType, formatPetAge } from '../types';
import { Plus, Search, UserPlus, Edit, Trash2 } from 'lucide-react';

const PatientManagement: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [petToDelete, setPetToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    clinicName: string;
    name: string;
    breed: string;
    age: number | '';
    ageMonths: number | '';
    type: PetType;
    skullType: SkullType;
  }>({
    clinicName: '',
    name: '',
    breed: '',
    age: '',
    ageMonths: '',
    type: PetType.CANINE,
    skullType: SkullType.MESOCEPHALIC
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
    const petData = {
      ...formData,
      age: formData.age === '' ? 0 : Number(formData.age),
      ageMonths: formData.ageMonths === '' ? 0 : Number(formData.ageMonths)
    };
    
    if (editingPetId) {
      await DB.updatePet(editingPetId, petData);
    } else {
      await DB.savePet(petData);
    }
    
    const updatedPets = await DB.getPets();
    setPets(updatedPets);
    setIsAdding(false);
    setEditingPetId(null);
    setFormData({
      clinicName: '',
      name: '',
      breed: '',
      age: '',
      ageMonths: '',
      type: PetType.CANINE,
      skullType: SkullType.MESOCEPHALIC
    });
  };

  const handleEditClick = (pet: Pet) => {
    setEditingPetId(pet.id);
    setFormData({
      clinicName: pet.clinicName,
      name: pet.name,
      breed: pet.breed || '',
      age: pet.age === 0 && (pet.ageMonths || 0) > 0 ? 0 : (pet.age === 0 ? '' : pet.age),
      ageMonths: (pet.ageMonths === 0 || pet.ageMonths === undefined) ? '' : pet.ageMonths,
      type: pet.type,
      skullType: pet.skullType
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingPetId(null);
    setFormData({
      clinicName: '',
      name: '',
      breed: '',
      age: '',
      ageMonths: '',
      type: PetType.CANINE,
      skullType: SkullType.MESOCEPHALIC
    });
  };

  const filteredPets = pets.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
            {editingPetId ? 'Editar Información del Paciente' : 'Nuevo Paciente'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Clínica Veterinaria</label>
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.clinicName}
                onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Especie</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as PetType })}
              >
                {Object.values(PetType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cráneo</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={formData.skullType}
                onChange={e => setFormData({ ...formData, skullType: e.target.value as SkullType })}
              >
                {Object.values(SkullType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) })}
                    placeholder="Ej. 1"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Años</span>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    value={formData.ageMonths}
                    onChange={e => setFormData({ ...formData, ageMonths: e.target.value === '' ? '' : Math.min(11, Math.max(0, parseInt(e.target.value) || 0)) })}
                    placeholder="Ej. 3"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Meses (0-11)</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                {editingPetId ? 'Actualizar Información' : 'Guardar Paciente'}
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
              placeholder="Buscar por nombre o clínica..."
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
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Clínica</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Especie/Raza</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Cráneo</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Edad</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Fecha Registro</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPets.map(pet => (
                <tr key={pet.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{pet.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{pet.clinicName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{pet.type} / {pet.breed}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{pet.skullType}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatPetAge(pet.age, pet.ageMonths)}</td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-sm">
                    {new Date(pet.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(pet)}
                      className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-indigo-400 font-semibold transition-all inline-flex items-center gap-1 text-xs"
                      title="Editar Paciente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => setPetToDelete(pet.id)}
                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-rose-400 font-semibold transition-all inline-flex items-center gap-1 text-xs"
                      title="Eliminar Paciente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No se encontraron pacientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {petToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full mx-4 shadow-xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">¿Eliminar paciente definitivamente?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              ¿Está seguro de que desea eliminar permanentemente este paciente? Esta acción no se puede deshacer y **borrará permanentemente** todo su historial clínico, reportes generados e imágenes del odontograma.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPetToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (petToDelete) {
                    await DB.deletePet(petToDelete);
                    const updatedPets = await DB.getPets();
                    setPets(updatedPets);
                    setPetToDelete(null);
                  }
                }}
                className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-md shadow-rose-200 dark:shadow-none"
              >
                Eliminar Definitivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
