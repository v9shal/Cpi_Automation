import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';

const Semester: React.FC = () => {
  const [semNo, setSemNo] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!semNo || !year || semNo <= 0 || year <= 0 || !startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
      setError('Invalid input fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await axios.post('http://localhost:4000/api/students/semesters', {
        Sem_no: semNo,
        Year: year,
        Start_Date: startDate,
        End_Date: endDate,
      });

      setSuccess(res.data.message || 'Semester registered successfully');
      setSemNo(null);
      setYear(null);
      setStartDate('');
      setEndDate('');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || 'Failed to register semester');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Semester Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full px-4 py-2 border rounded-lg" type="number" placeholder="Enter semester number" value={semNo ?? ''} onChange={(e) => setSemNo(parseInt(e.target.value))} disabled={loading} />
        <input className="w-full px-4 py-2 border rounded-lg" type="number" placeholder="Enter year" value={year ?? ''} onChange={(e) => setYear(parseInt(e.target.value))} disabled={loading} />
        <input className="w-full px-4 py-2 border rounded-lg" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
        <input className="w-full px-4 py-2 border rounded-lg" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={loading}>
          {loading ? 'Registering...' : 'Register Semester'}
        </button>
      </form>
      {success && <div className="mt-3 text-green-600">{success}</div>}
      {error && <div className="mt-3 text-red-600">{error}</div>}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <a href="/sem" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Semester</a>
        <a href="/enroll" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Enroll Students</a>
        <a href="/uploadGrade" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Grade Upload</a>
        <a href="/spi" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">SPI</a>
        <a href="/allresult"className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">semester result</a>
        <a href="/gradehistory" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Grade History</a>
      </div>
    </div>
  );
};

export default Semester;
