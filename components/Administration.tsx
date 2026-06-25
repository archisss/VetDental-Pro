import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { User as AppUser } from '../types';
import { KeyRound, UserPlus, Users, Trash2, Edit, Check, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdministrationProps {
  currentUser: AppUser;
}

const Administration: React.FC<AdministrationProps> = ({ currentUser }) => {
  // Master password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Assistants list state
  const [assistants, setAssistants] = useState<AppUser[]>([]);
  const [astUsername, setAstUsername] = useState('');
  const [astPassword, setAstPassword] = useState('');
  const [astErrorMsg, setAstErrorMsg] = useState('');
  const [astSuccessMsg, setAstSuccessMsg] = useState('');

  // Editing helper state
  const [editingAstId, setEditingAstId] = useState<string | null>(null);
  const [editingAstPassword, setEditingAstPassword] = useState('');

  const loadAssistants = async () => {
    const list = await DB.getAssistants();
    setAssistants(list);
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg('');
    setPwSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setPwErrorMsg('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 4) {
      setPwErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const result = await DB.changePassword(currentUser.username, currentPassword, newPassword);
    if (result.success) {
      setPwSuccessMsg('La contraseña maestra se ha actualizado correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwErrorMsg(result.error || 'Error al cambiar la contraseña. Verifique la contraseña actual.');
    }
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAstErrorMsg('');
    setAstSuccessMsg('');

    if (!astUsername.trim() || !astPassword.trim()) {
      setAstErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    if (astUsername.toLowerCase() === 'admin') {
      setAstErrorMsg('No se puede crear un ayudante con el nombre "admin".');
      return;
    }

    const result = await DB.createAssistant(astUsername.trim(), astPassword.trim());
    if (result.success && result.user) {
      setAstSuccessMsg(`Ayudante "${result.user.username}" creado correctamente.`);
      setAstUsername('');
      setAstPassword('');
      loadAssistants();
    } else {
      setAstErrorMsg(result.error || 'Error al crear el ayudante.');
    }
  };

  const handleUpdateAssistantPassword = async (id: string) => {
    if (!editingAstPassword.trim()) return;
    const ok = await DB.updateAssistant(id, editingAstPassword.trim());
    if (ok) {
      setEditingAstId(null);
      setEditingAstPassword('');
      loadAssistants();
    } else {
      alert('Error al actualizar la contraseña del ayudante.');
    }
  };

  const handleDeleteAssistant = async (id: string, name: string) => {
    if (confirm(`¿Está seguro que desea eliminar la cuenta del ayudante "${name}"?`)) {
      const ok = await DB.deleteAssistant(id);
      if (ok) {
        loadAssistants();
      } else {
        alert('Error al eliminar el ayudante.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Panel de Administración</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Gestione la contraseña maestra y las cuentas de los ayudantes autorizados para subir reportes.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-2xl text-xs font-bold uppercase tracking-wider self-start md:self-center border border-indigo-100 dark:border-indigo-900/30">
          <ShieldCheck className="w-4 h-4" />
          Administrador Principal
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Admin Password Change */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contraseña Maestra</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Modifique la contraseña de acceso principal</p>
              </div>
            </div>

            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-1">Contraseña Actual</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-900 dark:text-white"
                    placeholder="Contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-1">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-900 dark:text-white"
                    placeholder="Mínimo 4 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-900 dark:text-white"
                  placeholder="Repita la nueva contraseña"
                />
              </div>

              {pwErrorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 p-3.5 rounded-2xl text-xs font-semibold border border-rose-100 dark:border-rose-950/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pwErrorMsg}</span>
                </div>
              )}

              {pwSuccessMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30 flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pwSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
              >
                Actualizar Contraseña Maestra
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Assistants management */}
        <div className="lg:col-span-7 space-y-6">
          {/* Create Assistant Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Nuevo Ayudante</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cree un usuario independiente para sus asistentes</p>
              </div>
            </div>

            <form onSubmit={handleCreateAssistant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-1">Usuario del Ayudante</label>
                <input
                  type="text"
                  required
                  value={astUsername}
                  onChange={e => setAstUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-900 dark:text-white"
                  placeholder="ej. assistant_jose"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-1">Contraseña</label>
                <input
                  type="text"
                  required
                  value={astPassword}
                  onChange={e => setAstPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-900 dark:text-white"
                  placeholder="Contraseña de acceso"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                {astErrorMsg && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 p-3.5 rounded-2xl text-xs font-semibold border border-rose-100 dark:border-rose-950/30 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{astErrorMsg}</span>
                  </div>
                )}

                {astSuccessMsg && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30 flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{astSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
                >
                  Registrar Cuenta
                </button>
              </div>
            </form>
          </div>

          {/* Assistants List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cuentas de Ayudantes Registrados</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Listado de personas autorizadas para subir reportes</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[350px] overflow-y-auto pr-2">
              {assistants.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                  No hay ayudantes registrados actualmente.
                </div>
              ) : (
                assistants.map(ast => (
                  <div key={ast.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {ast.username}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {editingAstId === ast.id ? (
                          <span className="text-indigo-500 font-semibold">Editando contraseña...</span>
                        ) : (
                          <span>Contraseña: <strong className="font-mono text-slate-600 dark:text-slate-300">{ast.password || '••••••••'}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingAstId === ast.id ? (
                        <>
                          <input
                            type="text"
                            value={editingAstPassword}
                            onChange={e => setEditingAstPassword(e.target.value)}
                            placeholder="Nueva contraseña"
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleUpdateAssistantPassword(ast.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-colors"
                            title="Confirmar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAstId(null);
                              setEditingAstPassword('');
                            }}
                            className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-xs font-semibold"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingAstId(ast.id);
                              setEditingAstPassword(ast.password || '');
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-indigo-900/10 rounded-xl transition-colors"
                            title="Cambiar Contraseña"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssistant(ast.id, ast.username)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-xl transition-colors"
                            title="Eliminar Ayudante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administration;
