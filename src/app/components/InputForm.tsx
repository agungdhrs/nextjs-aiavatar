'use client'

import { useState } from 'react';
import { submitJadwal } from '../actions'; 

export default function InputForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Single-row form state handled by form inputs (we use native FormData on submit)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const result = await submitJadwal(formData);
    
    setLoading(false);
    setStatus(result.message);
    if (result.success) {
      (event.target as HTMLFormElement).reset();
      // Tabel akan otomatis update karena kita pakai revalidatePath di server action
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded p-3 space-y-3 bg-white">
        <div>
          <label className="block text-sm font-medium text-black">Tema Postingan</label>
          <input type="text" name="tema" required placeholder="Misal: Tips Coding NextJS" className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black">Tanggal</label>
            <input type="date" name="tanggal" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-black">Jam</label>
            <input type="time" name="jam" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"/>
          </div>
        </div>
      </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Mengirim...' : 'Simpan Jadwal'}
        </button>
        {status && (
          <p className={`text-center text-sm ${status.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
            {status}
          </p>
        )}
        {/* No per-item details in single-input mode */}
    </form>
  );
}