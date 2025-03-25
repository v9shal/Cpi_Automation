import React, { useState, useRef } from 'react';
import axios from 'axios';

interface GradeHistory {
  Attempt: number;
  Grade: string;
}

interface ProcessedGrade {
  Roll_no: string;
  Subject_Code: string;
  Sem_no: number;
  Year: number;
  Current_Grade: string; // Updated to match backend response
  Grade_History: GradeHistory[];
}

interface Error {
  row: any;
  error: string;
}

interface UploadResponse {
  message: string;
  processedGrades: ProcessedGrade[];
  errors?: Error[];
  successRate?: string;
  totalRowsProcessed?: number;
}

const GradeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Validate file type
      if (!selectedFile.name.match(/\.(xlsx)$/i)) {
        setError('Please upload an Excel (.xlsx) file');
        setFile(null);
        return;
      }

      // Validate file name format
      const pattern = /^([A-Z]+\d+)_sem(\d+)_(\d{4})\.xlsx$/i;
      if (!pattern.test(selectedFile.name)) {
        setError('File name must follow the format: SUBJECTCODE_semX_YYYY.xlsx');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:4000/api/upload/upload-grades', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponse(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Upload failed');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResponse(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Upload Student Grades</h1>

      <div className="mb-8">
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Instructions</h2>
          <ul className="list-disc pl-5 text-blue-700 space-y-1">
            <li>Upload Excel (.xlsx) files only</li>
            <li>File name must follow the format: <code>SUBJECTCODE_semX_YYYY.xlsx</code></li>
            <li>Example: <code>CS101_sem1_2023.xlsx</code></li>
            <li>Excel must contain columns for Roll Number and Grade</li>
            <li>Valid grades are: AA, AB, BB, BC, CC, CD, DD, F</li>
          </ul>
        </div>

        <div className="mb-6">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel file
          </label>
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
            accept=".xlsx"
          />
        </div>

        {file && (
          <div className="mb-4 p-3 bg-green-50 rounded-md flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-green-700">
              Selected file: <span className="font-medium">{file.name}</span>
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-md text-red-700">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="font-medium">Error:</span> {error}
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !file || loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload Grades'}
          </button>

          <button
            onClick={resetForm}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {response && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Upload Results</h2>

          <div
            className={`p-4 rounded-md mb-4 ${
              response.errors && response.errors.length > 0 ? 'bg-yellow-50' : 'bg-green-50'
            }`}
          >
            <p
              className={`font-medium ${
                response.errors && response.errors.length > 0 ? 'text-yellow-700' : 'text-green-700'
              }`}
            >
              {response.message}
            </p>

            {response.successRate && (
              <p className="text-gray-700 mt-1">Success rate: {response.successRate}</p>
            )}

            {response.totalRowsProcessed && (
              <p className="text-gray-700 mt-1">Total rows processed: {response.totalRowsProcessed}</p>
            )}
          </div>

          {response.processedGrades && response.processedGrades.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Processed Grades</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade History
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {response.processedGrades.map((grade, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.Roll_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.Subject_Code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.Sem_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.Year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              grade.Current_Grade === 'F'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {grade.Current_Grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {grade.Grade_History.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {grade.Grade_History.map((history) => (
                                <li key={history.Attempt}>
                                  Attempt {history.Attempt}:{" "}
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      history.Grade === 'F'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {history.Grade}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            'No previous attempts'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {response.errors && response.errors.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-red-600">Errors</h3>
              <div className="bg-red-50 p-4 rounded-md">
                <ul className="list-disc pl-5 space-y-1">
                  {response.errors.map((error, index) => (
                    <li key={index} className="text-red-700">
                      {error.error} {error.row && `(Row: ${JSON.stringify(error.row)})`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}
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

export default GradeUpload;