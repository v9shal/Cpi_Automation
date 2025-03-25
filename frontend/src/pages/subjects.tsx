import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface SUBJECT {
  Subject_Code: string;
  Subject_Name: string;
  Credits: number;
  Is_Elective: boolean;
  Department: string;
}

const Subjects = () => {
  const [subject, setSubject] = useState<SUBJECT>({
    Subject_Code: '',
    Subject_Name: '',
    Credits: 0,
    Is_Elective: false,
    Department: '',
  });

  const [subjects, setSubjects] = useState<SUBJECT[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSubject((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!subject.Subject_Code || !subject.Subject_Name || subject.Credits <= 0 || !subject.Department) {
      setError('All fields are required and credits must be positive.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await axios.post<{ message: string; data: SUBJECT[] }>(
        'http://localhost:4000/api/students/subjects',
        subject
      );

      setSuccess(res.data.message || 'Subjects registered successfully');
      setSubjects(res.data.data);

      // Reset form
      setSubject({
        Subject_Code: '',
        Subject_Name: '',
        Credits: 0,
        Is_Elective: false,
        Department: '',
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || 'Failed to register subjects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Subject Registration</h2>
  
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="Subject_Code"
          placeholder="Subject Code"
          value={subject.Subject_Code}
          onChange={handleChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="Subject_Name"
          placeholder="Subject Name"
          value={subject.Subject_Name}
          onChange={handleChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          name="Credits"
          placeholder="Credits"
          value={subject.Credits}
          onChange={handleChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="Department"
          placeholder="Department"
          value={subject.Department}
          onChange={handleChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
        />
  
        {/* Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="Is_Elective"
            checked={subject.Is_Elective}
            onChange={handleChange}
            className="w-5 h-5"
          />
          <label className="text-gray-700 text-lg">Is Elective</label>
        </div>
  
        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Insert Subjects"}
        </button>
      </form>
  
      {/* Navigation Links */}
      <div className="flex flex-wrap gap-3 justify-center mt-6">
        <a href="/sem" className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Semester</a>
        <a href="/enroll" className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Enroll Students</a>
        <a href="/uploadGrade" className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Grade Upload</a>
        <a href="/spi" className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">SPI</a>
        <a href="/gradehistory" className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Grade History</a>
      </div>
      enroll
      {/* Success & Error Messages */}
      {success && <div className="mt-4 text-green-600 font-semibold">{success}</div>}
      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
    </div>
  );
  
};

export default Subjects;
