import React, { useState } from "react";
import axios, { AxiosError } from "axios";

interface SPIResponse {
  Roll_no: string;
  Sem_no: number;
  Year: number;
  SPI: number;
}

interface CPIResponse {
  Roll_no: string;
  studentName: { Name: string }[];
  Sem_no: number;
  CPI: number;
}

interface BatchResponse {
  success: boolean;
  message: string;
  studentsProcessed: number;
  spiResponses: SPIResponse[];
  cpiResponses: CPIResponse[];
}

interface ResultDisplay {
  Roll_no: string;
  Name: string;
  CPI: number;
  SPI: number;
}

const BatchCpiSpi = () => {
  const [results, setResults] = useState<ResultDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [Currentyear, setCurrentyear] = useState<number>(new Date().getFullYear());
  const [Currentsem, setCurrentsem] = useState<number>(1);
  const [batchYear, setBatchYear] = useState<number>(0);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError("");
      setResults([]);
      
      const res = await axios.post<BatchResponse>(
        "http://localhost:4000/api/academic/batchProcessCpiAndSpi",
        { Year: batchYear, Sem_no: Currentsem, Curr_year: Currentyear }
      );

      console.log(res.data);
      
      // Combine SPI and CPI responses
      const combinedResults: ResultDisplay[] = [];
      
      // Map through CPI responses as they contain student names
      res.data.cpiResponses.forEach(cpiItem => {
        // Find matching SPI response
        const spiItem = res.data.spiResponses.find(spi => spi.Roll_no === cpiItem.Roll_no);
        
        combinedResults.push({
          Roll_no: cpiItem.Roll_no,
          Name: cpiItem.studentName?.[0]?.Name || "Unknown",
          CPI: parseFloat(cpiItem.CPI),
          SPI: spiItem?.SPI || 0
        });
      });
      
      setResults(combinedResults);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-center">Batch CPI & SPI Processing</h2>

      <div className="mb-4">
        <label className="block text-gray-700">Batch Year</label>
        <input
          type="number"
          value={batchYear}
          onChange={(e) => setBatchYear(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Enter Batch Year"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Current Semester</label>
        <input
          type="number"
          min="1"
          max="8"
          value={Currentsem}
          onChange={(e) => setCurrentsem(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Enter Semester Number"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Current Year</label>
        <input
          type="number"
          value={Currentyear}
          onChange={(e) => setCurrentyear(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <button
        onClick={fetchResult}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? "Processing..." : "Calculate CPI & SPI"}
      </button>

      {error && <p className="text-red-500 text-center mt-3">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-center">Results</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Roll No</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">CPI</th>
                <th className="border p-2">SPI</th>
              </tr>
            </thead>
            <tbody>
              {results.map((student) => (
                <tr key={student.Roll_no} className="text-center">
                  <td className="border p-2">{student.Roll_no}</td>
                  <td className="border p-2">{student.Name}</td>
                  <td className="border p-2">{student.CPI.toFixed(2)}</td>
                  <td className="border p-2">{student.SPI.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BatchCpiSpi;