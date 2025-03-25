const xlsx = require("xlsx");
const pool = require("../config/dbconfig");
const GRADEModel = require('../models/GradeModel');
const StudentModel = require('../models/studentModel');
const SubjectModel = require('../models/subjectModel');
const SemesterModel = require('../models/semesterModel');
const getFullGradeHistory=async (req,res)=>{
    const {Roll_no}=req.query;
    const connection=await pool.getConnection();
    try{
        const grades=await GRADEModel.getAllGradeHistoryByStudent(Roll_no);
        res.json({grades});
    }catch(error){
        console.error("Error fetching grades:",error);
        res.status(500).json({error:"Internal Server Error",details:error.message});

    }finally{

      connection.release();
    }

}
const uploadGrades = async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
  
    const connection = await pool.getConnection();
    try {
      const fileName = req.file.originalname;
      const fileInfo = extractInfoFromFileName(fileName);
  
      if (!fileInfo) {
        return res.status(400).json({ error: "Invalid file name format" });
      }
  
      const { subjectCode, sem_no, year } = fileInfo;
  
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet, {
        header: ["Roll_no", "Grade"],
        defval: null,
        blankrows: false,
        range: 1,
      });
  
      if (!data || data.length === 0) {
        return res.status(400).json({ error: "No data found in the uploaded file" });
      }
  
      await connection.beginTransaction();
  
      const processedGrades = [];
      const errors = [];
  
      for (const row of data) {
        const { Roll_no = '', Grade = '' } = row;
  
        try {
          if (!Roll_no || !Grade) {
            throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
          }
  
          const normalizedRollNo = String(Roll_no).trim();
          const normalizedGrade = String(Grade).trim().toUpperCase();
  
          const student = await StudentModel.getStudent(normalizedRollNo);
          if (!student || student.length === 0) {
            throw new Error(`Student ${normalizedRollNo} not found`);
          }
  
          const subject = await SubjectModel.getSubjectByCode(subjectCode);
          if (!subject) {
            throw new Error(`Subject ${subjectCode} not found`);
          }
  
          const semester = await SemesterModel.getSemester(sem_no, year);
          if (!semester) {
            throw new Error(`Semester (${sem_no}, ${year}) not found`);
          }
  
          const validGrades = ['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD', 'F'];
          if (!validGrades.includes(normalizedGrade)) {
            throw new Error(`Invalid grade ${normalizedGrade} for student ${normalizedRollNo}`);
          }
  
          const result = await GRADEModel.addGrade(normalizedRollNo, subjectCode, sem_no, year, normalizedGrade);
          const history = await GRADEModel.getGradeHistory(normalizedRollNo, subjectCode, sem_no, year);
  
          processedGrades.push({
            Roll_no: normalizedRollNo,
            Subject_Code: subjectCode,
            Sem_no: sem_no,
            Year: year,
            Current_Grade: normalizedGrade,
            Grade_History: history.map(h => ({ Attempt: h.Attempt, Grade: h.Grade })),
          });
  
        } catch (rowError) {
          console.error('Row processing error:', rowError);
          errors.push({
            row: row,
            error: rowError.message,
          });
        }
      }
  
      await connection.commit();
  
      if (errors.length > 0) {
        return res.status(206).json({
          message: "Grades processed with some errors",
          processedGrades,
          errors,
          successRate: `${processedGrades.length}/${data.length} rows processed`,
        });
      }
  
      res.json({
        message: "Grades uploaded successfully",
        processedGrades,
        totalRowsProcessed: data.length,
      });
  
    } catch (error) {
      await connection.rollback();
      console.error("Error processing grades:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    } finally {
      connection.release();
    }
  };

function extractInfoFromFileName(fileName) {
    const pattern = /^([A-Z]+\d+)_sem(\d+)_(\d{4})\.xlsx$/i;
    const match = fileName.match(pattern);

    if (!match) {
        return null;
    }

    return {
        subjectCode: match[1],           
        sem_no: parseInt(match[2]),       
        year: parseInt(match[3])         
    };
}

const processBatchResults = async (req, res) => {
    try {
        const { semesterId, batchData } = req.body;
        
        const { Sem_no, Year } = semesterId;
        const semester = await SemesterModel.getSemester(Sem_no, Year);
        if (!semester) {
            return res.status(400).json({ error: "Invalid semester" });
        }

        const processResults = [];
        const errors = [];

        for (const studentResult of batchData) {
            const { Roll_no, grades } = studentResult;

            try {
                const student = await StudentModel.getStudent(Roll_no);
                if (!student || student.length === 0) {
                    throw new Error(`Student ${Roll_no} not found`);
                }

                for (const gradeEntry of grades) {
                    const { Subject_Code, Grade } = gradeEntry;

                    await GRADEModel.addGrade(
                        Roll_no, 
                        Subject_Code, 
                        Sem_no, 
                        Year, 
                        Grade
                    );
                }

                processResults.push({
                    Roll_no,
                    status: 'SUCCESS'
                });

            } catch (studentError) {
                errors.push({
                    Roll_no,
                    error: studentError.message
                });
            }
        }

        return res.status(errors.length > 0 ? 206 : 200).json({
            message: "Batch results processed",
            processResults,
            errors
        });

    } catch (error) {
        console.error("Batch processing error:", error);
        res.status(500).json({ 
            error: "Batch processing failed", 
            details: error.message 
        });
    }
  
};

module.exports = { 
    uploadGrades,
    processBatchResults,
    getFullGradeHistory
};