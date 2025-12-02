import { getJadwalList } from './actions';
import InputForm from './components/InputForm';

export default async function Dashboard() {
  // 1. Ambil data langsung di Server (Aman & Cepat)
  const data = await getJadwalList();

  // 2. Pisahkan data Pending & Done
  const pendingPosts = data.filter((item: any) => item.Status === 'Pending');
  const donePosts = data.filter((item: any) => item.Status === 'Done');

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 space-y-10">
      
      {/* Bagian Input Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-black">Input Jadwal Konten AI</h1>
        <InputForm />
      </div>

      {/* Bagian Tabel Pending */}
      <div>
        <h2 className="text-xl font-bold mb-3 text-yellow-600">⏳ Menunggu Post ({pendingPosts.length})</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-black">Tema</th>
                <th className="p-3 text-black">Waktu Post</th>
                <th className="p-3 text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingPosts.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center  text-black">Tidak ada antrian</td></tr>
              ) : (
                pendingPosts.map((row: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-black">{row.Tema}</td>
                    <td className="p-3 text-black">{row.Waktu_Post}</td>
                    <td className="p-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian Tabel Selesai */}
      <div>
        <h2 className="text-xl font-bold mb-3 text-green-600">✅ Selesai Dipost ({donePosts.length})</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-black">Tema</th>
                <th className="p-3 text-black">Waktu</th>
                <th className="p-3 text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {donePosts.map((row: any, i: number) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-black">{row.Tema}</td>
                  <td className="p-3 text-black">{row.Waktu_Post}</td>
                  <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Done</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}