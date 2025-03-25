import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';

const RegisterStudent: React.FC = () => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState<number | ''>('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !rollNo || !department || !year) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await axios.post('http://localhost:4000/api/students/students', {
        Name: name,
        Roll_no: rollNo,
        Department: department,
        Year: year,
      });

      setSuccess(res.data.message || 'Student registered successfully');
      setName('');
      setRollNo('');
      setDepartment('');
      setYear('');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">Student Registration</h2>
  
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter roll number"
          type="number"
          value={rollNo}
          onChange={(e) => setRollNo(Number(e.target.value))}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter year"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
  
      {/* Success & Error Messages */}
      {success && <div className="mt-3 text-green-600 text-center">{success}</div>}
      {error && <div className="mt-3 text-red-600 text-center">{error}</div>}
  
      {/* Navigation Links */}
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

export default RegisterStudent;
