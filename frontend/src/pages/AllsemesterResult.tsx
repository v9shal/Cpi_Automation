import React, { useState } from 'react'
import { FormEvent } from 'react'
import axios, { AxiosError } from 'axios'

interface SemesterResult {
  Sem_no: number;
  Year: number;
  SPI: number;
}

interface CpiResult {
  Sem_no: number;
  Year: number;
  CPI: number;
}

interface TotalResult {
  Roll_no: number;
  Sem_no: number;
  Year: number;
  spiData: SemesterResult[];
  cpiData: CpiResult[];
}

const AllsemesterResult = () => {
  const [rollNo, setRollNo] = useState<string>('');
  const [semNo, setSemNo] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [totalResponse, setTotalResponse] = useState<TotalResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!rollNo || !semNo || !year) {
      setError('Please fill all required fields');
      return;
    }
    
    // Convert to appropriate types
    const rollNoNum = parseInt(rollNo);
    const semNoNum = parseInt(semNo);
    const yearNum = parseInt(year);
    
    if (isNaN(rollNoNum) || isNaN(semNoNum) || isNaN(yearNum)) {
      setError('Roll number, semester, and year must be valid numbers');
      return;
    }
    
    setLoading(true);
    try {
      // FIX: Use proper params object for GET request
      const historyResponse = await axios.get('http://localhost:4000/api/academic/CpiAndSpiAllSemesters', {
        params: {
          Roll_no: rollNoNum,
          Sem_no: semNoNum,
          Year: yearNum
        }
      });
      setTotalResponse(historyResponse.data);
    } catch (err) {
      const error = err as AxiosError<{ error?: string, message?: string }>;
      console.error('Axios Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to get student performance indices'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Student Performance Indices</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rollNo">
                Roll Number *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="rollNo"
                type="text"
                placeholder="Enter Roll Number"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
              />
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="semNo">
                Semester Number *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="semNo"
                type="text"
                placeholder="Enter Semester Number"
                value={semNo}
                onChange={(e) => setSemNo(e.target.value)}
                required
              />
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="year">
                Year *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="year"
                type="text"
                placeholder="Enter Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Get Results'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4" role="alert">
              <p>{error}</p>
            </div>
          )}
        </form>
      </div>

      {totalResponse && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-semibold mb-4">
            Performance History for Roll No: {totalResponse.Roll_no}
          </h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">SPI (Semester Performance Index)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SPI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {totalResponse.spiData.map((spi, index) => (
                    <tr key={`spi-${index}`}>
                      <td className="py-2 px-4 border-b border-gray-200">{spi.Sem_no}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{spi.Year}</td>
                      <td className="py-2 px-4 border-b border-gray-200 font-medium">{spi.SPI.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">CPI (Cumulative Performance Index)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CPI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {totalResponse.cpiData.map((cpi, index) => (
                    <tr key={`cpi-${index}`}>
                      <td className="py-2 px-4 border-b border-gray-200">{cpi.Sem_no}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{cpi.Year}</td>
                      <td className="py-2 px-4 border-b border-gray-200 font-medium">{cpi.CPI.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <a href="/sem" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Semester</a>
        <a href="/enroll" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Enroll Students</a>
        <a href="/uploadGrade" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Grade Upload</a>
        <a href="/spi" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">SPI</a>
        <a href="/allresult"className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">semester result</a>
        <a href="/gradehistory" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Grade History</a>
    </div>
  );
}

export default AllsemesterResult;