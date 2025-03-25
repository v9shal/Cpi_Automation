import React, { useState, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';

interface GradeResponse {
  spi: number;
  cpi: number;
  studentName?: string;
  semester?: number;
  year?: number;
  courses?: {
    subjectCode: string;
    subjectName: string;
    grade: string;
    credits: number;
  }[];
}

const Spi = () => {
  // Form input states
  const [rollNo, setRollNo] = useState<string>('');
  const [semNo, setSemNo] = useState<string>('');
  const [year, setYear] = useState<string>('');
  
  // Results states
  const [spi, setSpi] = useState<number | null>(null);
  const [cpi, setCpi] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [response, setResponse] = useState<GradeResponse | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const clickButton =async()=>{
    const response=axios.get('http://localhost:4000/api/academic/CpiAndSpiAllSemesters',{
      rollNo:rollNo
    })
  }

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
      
      const spiResponse = await axios.post('http://localhost:4000/api/academic/processGrades', {
        Roll_no: rollNoNum,
        Sem_no: semNoNum,
        Year: yearNum
      });

      if (spiResponse.data) {
        const spiResult = spiResponse.data;
        
        const cpiResponse = await axios.post('http://localhost:4000/api/academic/calcCPI', {
          Roll_no: rollNoNum,
          Sem_no: semNoNum,
          Year: yearNum
        });
        
        console.log(cpiResponse);
        
        // Correctly extract student name from the response
        let name = 'Unknown';
        if (cpiResponse.data.studentName && 
            Array.isArray(cpiResponse.data.studentName) && 
            cpiResponse.data.studentName.length > 0 && 
            cpiResponse.data.studentName[0].Name) {
          name = cpiResponse.data.studentName[0].Name;
        }
        
        setStudentName(name);

        // Combine both responses
        const combinedData: GradeResponse = {
          spi: parseFloat(spiResult.SPI),
          cpi: parseFloat(cpiResponse.data.CPI),
          studentName: name,
          semester: semNoNum,
          year: yearNum,
          courses: spiResult.courses || [] // If your backend provides courses data
        };

        console.log("Combined response:", combinedData);
        setResponse(combinedData);
        setSpi(combinedData.spi);
        setCpi(combinedData.cpi);
      } else {
        setError('No data returned from server');
      }
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Student Performance Index</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 mb-2">
              Roll Number
            </label>
            <input
              type="text"
              id="rollNo"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter roll number"
              required
            />
          </div>
          
          <div>
            <label htmlFor="semNo" className="block text-sm font-medium text-gray-700 mb-2">
              Semester Number
            </label>
            <input
              type="number"
              id="semNo"
              value={semNo}
              onChange={(e) => setSemNo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter semester"
              min="1"
              max="8"
              required
            />
          </div>
          
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter year"
              min="2000"
              max="2050"
              required
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Loading...' : 'Calculate Indices'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-md text-red-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {response && (
        <div className="mt-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {studentName ? `Results for ${studentName}` : 'Performance Results'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-md shadow border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">Semester Performance Index (SPI)</p>
                <p className="text-3xl font-bold text-blue-600">{spi?.toFixed(2)}</p>
                <p className="text-gray-500 text-sm mt-2">
                  {response.semester && response.year 
                    ? `Semester ${response.semester}, ${response.year}` 
                    : `Semester ${semNo}, ${year}`}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow border-l-4 border-green-500">
                <p className="text-gray-500 text-sm">Cumulative Performance Index (CPI)</p>
                <p className="text-3xl font-bold text-green-600">{cpi?.toFixed(2)}</p>
                <p className="text-gray-500 text-sm mt-2">Overall performance across semesters</p>
              </div>
            </div>
            
            {response.courses && response.courses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Course Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {response.courses.map((course, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.subjectCode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.subjectName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${course.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {course.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
};

export default Spi;