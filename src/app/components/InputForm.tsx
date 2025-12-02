'use client'

import { useState } from 'react';
import { submitJadwal } from '../actions'; 

export default function InputForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Rows state for multiple planned posts
  const [rows, setRows] = useState(() => [{ tema: '', tanggal: '', jam: '' }]);
  // Planned count control
  const [plannedCount, setPlannedCount] = useState<number>(1);
  // Per-item result details from the last submit
  const [perResults, setPerResults] = useState<Array<any> | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    // Build FormData for one or many rows
    const formData = new FormData();
    for (const r of rows) {
      formData.append('tema', r.tema);
      formData.append('tanggal', r.tanggal);
      formData.append('jam', r.jam);
    }

    const result = await submitJadwal(formData);
    
    setLoading(false);
    setStatus(result.message);
    setPerResults(result?.results ?? null);
    
    if (result.success) {
      // reset rows to single blank row on success
      setRows([{ tema: '', tanggal: '', jam: '' }]);
      setPlannedCount(1);
      // Tabel akan otomatis update karena kita pakai revalidatePath di server action
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-black">Tambah Jadwal (multi)</h3>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">Baris: {rows.length}</div>
          <div className="flex items-center space-x-2 text-sm">
            <label className="text-gray-600">Planned</label>
            <input
              type="number"
              min={1}
              max={20}
              value={plannedCount}
              onChange={(e) => {
                const n = Math.max(1, Math.min(20, Number(e.target.value || 1)));
                setPlannedCount(n);
                setRows(prev => {
                  if (n === prev.length) return prev;
                  if (n > prev.length) {
                    return [...prev, ...Array.from({ length: n - prev.length }).map(() => ({ tema: '', tanggal: '', jam: '' }))];
                  }
                  return prev.slice(0, n);
                });
              }}
              className="w-16 p-1 border rounded text-black"
            />
          </div>
        </div>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="border rounded p-3 space-y-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="font-medium text-black">Item {idx + 1}</div>
            <div className="space-x-2">
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))} className="text-sm text-red-600 hover:underline">Hapus</button>
              )}
              {idx === rows.length - 1 && (
                <button type="button" onClick={() => setRows(prev => [...prev, { tema: '', tanggal: '', jam: '' }])} className="text-sm text-blue-600 hover:underline">Tambah baris</button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Tema Postingan</label>
            <input value={row.tema} onChange={(e) => setRows(prev => { const copy = [...prev]; copy[idx] = {...copy[idx], tema: e.target.value}; return copy; })} type="text" name="tema" required placeholder="Misal: Tips Coding NextJS" className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black">Tanggal</label>
              <input value={row.tanggal} onChange={(e) => setRows(prev => { const copy = [...prev]; copy[idx] = {...copy[idx], tanggal: e.target.value}; return copy; })} type="date" name="tanggal" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Jam</label>
              <input value={row.jam} onChange={(e) => setRows(prev => { const copy = [...prev]; copy[idx] = {...copy[idx], jam: e.target.value}; return copy; })} type="time" name="jam" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"/>
            </div>
          </div>
        </div>
      ))}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Mengirim...' : 'Simpan Jadwal'}
        </button>
        {status && (
          <p className={`text-center text-sm ${status.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
            {status}
          </p>
        )}
        {perResults && (
          <div className="mt-2 space-y-2">
            <div className="text-sm font-medium text-black">Detail hasil per-item:</div>
            <div className="space-y-1">
              {perResults.map((r, i) => (
                <div key={i} className={`p-2 rounded text-sm ${r.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="flex justify-between">
                    <div>Item {r.index + 1} — {r.ok ? 'OK' : 'GAGAL'}</div>
                    <div className="text-xs text-gray-500">Attempts: {r.attempts ?? '-'}</div>
                  </div>
                  <div className="mt-1 text-xs">
                    {r.ok ? (
                      <div>Response: <pre className="inline whitespace-pre-wrap">{JSON.stringify(r.body ?? r.statusText ?? r.status)}</pre></div>
                    ) : (
                      <div>Error: <pre className="inline whitespace-pre-wrap">{typeof r.error === 'string' ? r.error : JSON.stringify(r.error)}</pre></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </form>
  );
}