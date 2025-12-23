'use client'

import { useState } from 'react';
import Image from 'next/image';
import { submitJadwal, generatePreview } from '../actions';

export default function InputForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Single-row form state handled by form inputs (we use native FormData on submit)

  async function handlePreview() {
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);

    // Validate tema
    if (!formData.get('tema')) {
      alert("Mohon isi field Tema terlebih dahulu");
      return;
    }

    setPreviewLoading(true);
    setPreviewUrl(null);
    setStatus(null);

    const result = await generatePreview(formData);
    setPreviewLoading(false);
    if (result.success && result.imageUrl) {
      setPreviewUrl(result.imageUrl);
      setStatus("Preview berhasil digenerate!");
    } else {
      setStatus(result.message);
    }
  }

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
          <div className="flex gap-2">
            <input type="text" name="tema" required placeholder="Misal: Tips Coding NextJS" className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black" />
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              className="mt-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 text-sm whitespace-nowrap"
            >
              {previewLoading ? 'Generating...' : 'Generate Preview'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black">Akun Instagram</label>
          <select name="account" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black bg-white">
            <option value="jakaambisi">jakaambisi</option>
            <option value="viravoyages">viravoyages</option>
            <option value="karin.nova_">karin.nova_</option>
          </select>
        </div>

        {previewUrl && (
          <div className="mt-4 border rounded p-2 bg-gray-50">
            <p className="text-xs font-bold mb-2 text-gray-500">PREVIEW GAMBAR AI:</p>
            <div className="relative w-full h-64 sm:h-[300px]">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="rounded shadow-sm object-cover"
                unoptimized
              />
              <input type="hidden" name="imageUrl" value={previewUrl} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black">Tanggal</label>
            <input type="date" name="tanggal" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-black">Jam</label>
            <input type="time" name="jam" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black" />
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