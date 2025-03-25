import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface SemesterId {
  Sem_no: number;
  Year: number;
}

interface EnrollmentResponse {
  success: boolean;
  message: string;
  student: { Roll_no: number; Name: string; Department: string; Year: number };
  semester: { Sem_no: number; Year: number };
  enrollments: { subjectCode: string; subjectName: string; result: string }[];
}

const EnrollStudent: React.FC = () => {
  const [rollNo, setRollNo] = useState<number>(0);
  const [subjectCodesInput, setSubjectCodesInput] = useState<string>(''); 
  const [semesterId, setSemesterId] = useState<SemesterId>({ Sem_no: 0, Year: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rollNo || rollNo <= 0) {
      setError('Roll number must be a positive number');
      return;
    }
    const subjectCodes = subjectCodesInput.split(',').map(s => s.trim()).filter(s => s);
    if (!subjectCodes.length) {
      setError('At least one subject code is required');
      return;
    }
    if (!semesterId.Sem_no || !semesterId.Year || semesterId.Sem_no <= 0 || semesterId.Year <= 0) {
      setError('Semester number and year must be positive numbers');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setEnrollmentData(null);

      const res = await axios.post<EnrollmentResponse>(
        'http://localhost:4000/api/academic/registerStudentWithSubjects', 
        { Roll_no: rollNo, subjectCodes, semesterId }
      );

      setSuccess(res.data.message || 'Student enrolled successfully');
      setEnrollmentData(res.data);
      setRollNo(0);
      setSubjectCodesInput('');
      setSemesterId({ Sem_no: 0, Year: 0 });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || error.message || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">Enroll Student in Subjects</h2>
      
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter roll number"
          type="number"
          value={rollNo || ''}
          onChange={(e) => setRollNo(e.target.value ? parseInt(e.target.value) : 0)}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter subject codes (e.g., CS101, MA101)"
          type="text"
          value={subjectCodesInput}
          onChange={(e) => setSubjectCodesInput(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter semester number"
          type="number"
          value={semesterId.Sem_no || ''}
          onChange={(e) => setSemesterId({ ...semesterId, Sem_no: e.target.value ? parseInt(e.target.value) : 0 })}
          disabled={loading}
        />
        <input
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter year"
          type="number"
          value={semesterId.Year || ''}
          onChange={(e) => setSemesterId({ ...semesterId, Year: e.target.value ? parseInt(e.target.value) : 0 })}
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Enrolling...' : 'Enroll Student'}
        </button>
      </form>
  
      {/* Success & Error Messages */}
      {success && <div className="text-green-600 mt-4 text-center">{success}</div>}
      {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
  
      {/* Enrollment Details */}
      {enrollmentData && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Enrollment Details</h3>
          <p><strong>Student:</strong> {enrollmentData.student.Name} (Roll No: {enrollmentData.student.Roll_no})</p>
          <p><strong>Semester:</strong> {enrollmentData.semester.Sem_no}, Year: {enrollmentData.semester.Year}</p>
          <h4 className="font-semibold mt-2">Enrolled Subjects:</h4>
          <ul className="list-disc list-inside">
            {enrollmentData.enrollments.map((enrollment, index) => (
              <li key={index}>
                {enrollment.subjectCode} - {enrollment.subjectName}: {enrollment.result}
              </li>
            ))}
          </ul>
        </div>
      )}
  
      {/* Navigation Links */}
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <a href="/sem" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Semester</a>
        <a href="/enroll" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Enroll Students</a>
        <a href="/uploadGrade" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Grade Upload</a>
        <a href="/spi" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">SPI</a>
        <a href="/gradehistory" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Grade History</a>
        <a href="/allresult"className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">semester result</a>
      </div>
    </div>
  );
  
};

export default EnrollStudent;
