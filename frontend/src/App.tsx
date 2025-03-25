import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './App.css'
import RegisterStudent from './pages/registerStudent';
import Semester from './pages/semester';
import Subjects from './pages/subjects';
import EnrollStudents from './pages/enrollStudent';
import GradeManagement from './pages/gradeUpload';
import GradeUpload from './pages/gradeUpload';
import Spi from './pages/spi';
import FullGradeHistory from './pages/gradeHistory';
import BatchCpiSpi from './pages/batchCpiSpi';
import AllsemesterResult from './pages/AllsemesterResult';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
            <Route path="/" element={<RegisterStudent />} />
            <Route path ="/sem" element={<Semester/>}/>
            <Route path="/sub"element={<Subjects/>}/>
            <Route path ="/enroll" element={<EnrollStudents/>}/>
            <Route path ="/uploadGrade" element={<GradeUpload/>}/>
            <Route path ="/spi" element={<Spi/>}/>
            <Route path='/gradehistory' element={<FullGradeHistory/>}/>
            <Route path ='/batchCpiSpi' element={<BatchCpiSpi/>}/>
            <Route path='/allresult' element={<AllsemesterResult/>}/>
      </Routes>
    </>
  )
}

export default App
