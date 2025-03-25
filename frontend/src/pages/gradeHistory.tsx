import React, { useState } from "react";
import axios, { AxiosError } from "axios";

interface GradeHistory {
  Roll_no: number;
  Subject_Code: string;
  Grade: string;
  Sem_no: number;
  Year: number;
  Attempt: number;
}

const FullGradeHistory: React.FC = () => {
  const [rollNo, setRollNo] = useState<string>("");
  const [grades, setGrades] = useState<GradeHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchGrades = async () => {
    if (!rollNo) {
      setError("Please enter a roll number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setGrades([]);

      const res = await axios.get<{ grades: GradeHistory[] }>(
        "http://localhost:4000/api/upload/fullgradehistory",
        {
          params: { Roll_no: rollNo }, 
        }
      );

      console.log(res.data);
      setGrades(res.data.grades);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || "Failed to fetch grade history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Full Grade History</h2>

      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Enter Roll Number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchGrades}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Fetch Grades"}
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {grades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Subject Code</th>
                <th className="border p-2">Grade</th>
                <th className="border p-2">Semester</th>
                <th className="border p-2">Year</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={index} className="text-center border-t">
                  <td className="border p-2">{grade.Subject_Code}</td>
                  <td className="border p-2">{grade.Grade}</td>
                  <td className="border p-2">{grade.Sem_no}</td>
                  <td className="border p-2">{grade.Year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <a href="/sem" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Semester</a>
        <a href="/enroll" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Enroll Students</a>
        <a href="/uploadGrade" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Grade Upload</a>
        <a href="/spi" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">SPI</a>
        <a href="/gradehistory" className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Grade History</a>
        <a href="/allresult"className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">semester result</a>
      </div>
    </div>
  );
};

export default FullGradeHistory;
