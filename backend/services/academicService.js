const StudentModel = require('../models/studentModel');
const SubjectModel = require('../models/subjectModel');
const EnrollmentModel = require('../models/enrollmentModel');
const SemesterModel = require('../models/semesterModel');
const pool = require('../config/dbconfig');
const SPIModel = require('../models/spiModel');
const CPIModel = require('../models/cpiModel');

class AcademicService {
  static async batchProcessCpiAndSpi(Year, Sem_no, Curr_year) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        if (!Year || !Sem_no || !Curr_year) {
            throw new Error("Year, Sem_no, and Curr_year are required");
        }

        const [result] = await connection.query(
            `SELECT Roll_no FROM Students WHERE Year = ?`,
            [Year]
        );

        if (!result.length) {
            throw new Error("No students found for the given year");
        }

       // console.log(result);
        
        let spiResponses = [];
        let cpiResponses = [];

        for (const { Roll_no } of result) {
            const Spiresponse = await AcademicService.processGradesAndCalculateSPI(Roll_no, Sem_no, Curr_year);
            const Cpiresponse = await AcademicService.calculateCPI(Roll_no, Sem_no, Curr_year);

            spiResponses.push(Spiresponse);
            cpiResponses.push(Cpiresponse);
        }

        await connection.commit();

        return {
            success: true,
            message: "CPI and SPI calculated successfully",
            studentsProcessed: result.length,
            spiResponses,
            cpiResponses
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
static async CpiAndSpiAllSemesters(Roll_no, Sem_no, Year) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Getting all the SPI till this semester for the student
    const [spiData] = await connection.query(
      `SELECT
        Sem_no,
        Year,
        cumulativeSPI AS SPI
      FROM SPI
      WHERE Roll_no = ? AND Sem_no <= ?
      ORDER BY Sem_no`,
      [Roll_no, Sem_no]
    );
    
    if (spiData.length === 0) {
      throw new Error("No SPI found for the given student and semester.");
    }
    
    // Getting all the CPI till this semester for the student
    const [cpiData] = await connection.query(
      `SELECT
        Sem_no,
        Year,
        cumulativeCPI as CPI
      FROM CPI
      WHERE Roll_no = ? AND Sem_no <= ?
      ORDER BY Sem_no`,
      [Roll_no, Sem_no]
    );
    
    if (cpiData.length === 0) {
      throw new Error("No CPI found for the given student and semester.");
    }
    
    await connection.commit();
    
    return {
      Roll_no,
      Sem_no,
      Year,
      spiData,
      cpiData
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    // Added: Release the connection back to the pool
    connection.release();
  }
}
  static async processGradesAndCalculateSPI(Roll_no, Sem_no,Year) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

      
        const [gradesData] = await connection.query(
            `SELECT 
                g.Grade, 
                s.Credits 
             FROM GRADE g
             JOIN Subjects s ON g.Subject_Code = s.Subject_Code
             WHERE g.Roll_no = ? AND g.Sem_no = ? AND g.Year = ?`,
            [Roll_no, Sem_no, Year]
        );


        if (gradesData.length === 0) {
            throw new Error("No grades found for the given student and semester.");
        }

        const gradeToPoints = {
            'AA': 10,
            'AB': 9,
            'BB': 8,
            'BC': 7,
            'CC': 6,
            'CD': 5,
            'DD': 4,
            'F': 0,
            'PP':1,
        };

        let totalWeightedPoints = 0;
        let totalCredits = 0;

        gradesData.forEach(({ Grade, Credits }) => {
            const gradePoints = gradeToPoints[Grade] || 0; 
            totalWeightedPoints += Credits * gradePoints;
            totalCredits += Credits;
        });
        let ans=totalWeightedPoints/totalCredits;
        

        // Calculate SPI
        const SPI = totalCredits === 0 ? 0 : Math.round(ans*100)/100;
        await SPIModel.addSPI(Roll_no, Sem_no, Year, SPI);
        //console.log(SPI);

        await connection.commit(); 

        return {
            Roll_no,
            Sem_no,
            Year,
            SPI
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
static async calculateCPI(Roll_no, Sem_no,Year) {
  const connection = await pool.getConnection();
  try {

    if (!Roll_no || !Sem_no) {
      throw new Error("Roll_no and Sem_no are required");
    }

    // Fetch semester data
    const [semesterData] = await connection.query(
      `SELECT 
          spi.Sem_no,
          spi.Year,
          spi.cumulativeSPI AS SPI,
          SUM(sub.Credits) AS Credits
       FROM SPI spi
       LEFT JOIN Enrollments e ON spi.Roll_no = e.Roll_no AND spi.Sem_no = e.Sem_no AND spi.Year = e.Year
       LEFT JOIN Subjects sub ON e.Subject_Code = sub.Subject_Code
       WHERE spi.Roll_no = ? AND spi.Sem_no <= ?
       GROUP BY spi.Sem_no, spi.Year, spi.cumulativeSPI
       ORDER BY spi.Sem_no`,
      [Roll_no, Sem_no]
    );
    const [studentName]=await connection.query(
      `SELECT Name from Students where Roll_no=?`,[Roll_no]
    );
   // console.log("Fetched Semester Data:", semesterData); // Debugging

    if (semesterData.length === 0) {
      throw new Error("No SPI or credits found for the student");
    }

    // Calculate CPI
    let totalWeightedPoints = 0;
    let totalCredits = 0;

    semesterData.forEach(({ SPI, Credits }) => {
      if (SPI && Credits) {
        // Convert Credits to a number explicitly
        const numericCredits = Number(Credits);
        totalWeightedPoints += SPI * numericCredits;
        totalCredits += numericCredits;
      }
    });

   // console.log("Total Weighted Points:", totalWeightedPoints); // Debugging
    //console.log("Total Credits:", totalCredits); // Debugging
    // console.log("Individual semester records:", 
    //   semesterData.map(row => ({ 
    //     Sem_no: row.Sem_no, 
    //     Year: row.Year, 
    //     SPI: row.SPI, 
    //     Credits: row.Credits 
    //   }))
    // );
    if (totalCredits === 0) {
      throw new Error("No valid credits found for CPI calculation");
    }

    const CPI = (totalWeightedPoints / totalCredits).toFixed(2);
    await CPIModel.addCPI(Roll_no, Sem_no, Year, CPI);
console.log(studentName);
    return {
      Roll_no,
      studentName,
      Sem_no,
      CPI
    };

  } catch (error) {
    console.error("Error in calculateCPI:", error.message); // Debugging
    throw error;
  } finally {
    connection.release();
  }
}
  static async enrollStudentInSubjects(Roll_no, subjectCodes, semesterId) {
    const connection = await pool.getConnection();
  
    try {
      await connection.beginTransaction();
  
      const student = await StudentModel.getStudent(Roll_no);
      if (!student || student.length === 0) {
        throw new Error(`Student with Roll_no ${Roll_no} not found`);
      }
  
      const { Sem_no, Year } = semesterId;
      if (!Sem_no || !Year) {
        throw new Error("semesterId must contain Sem_no and Year");
      }
  
      const semester = await SemesterModel.getSemester(Sem_no, Year);
      if (!semester) {
        throw new Error(`Semester (${Sem_no}, ${Year}) not found`);
      }
  
      const enrollmentResults = [];
  
      for (const subjectCode of subjectCodes) {
        const subject = await SubjectModel.getSubjectByCode(subjectCode);
        if (!subject) {
          throw new Error(`Subject ${subjectCode} not found`);
        }
  
        
  
        const result = await EnrollmentModel.enrollStudent(
          Roll_no,
          subjectCode,
          Sem_no,
          Year
        );
  
        enrollmentResults.push({
          subjectCode,
          subjectName: subject.Subject_Name,
          result: "Enrolled successfully",
        });
      }
  
      await connection.commit();
  
      return {
        success: true,
        message: "Student enrolled successfully",
        student: student[0],
        semester: {
          Sem_no,
          Year,
        },
        enrollments: enrollmentResults,
      };
    } catch (error) {
      await connection.rollback();
      //console.error("Error in enrollStudentInSubjects:", error.message); // Debugging
      throw error;
    } finally {
      connection.release();
    }
  }

  // Start New Semester
  static async startNewSemester(semesterData, studentPromotions = []) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create new semester
      const semester = await SemesterModel.createSemester(
        semesterData.Sem_no,
        semesterData.Year,
        semesterData.Start_Date,
        semesterData.End_Date
      );

      // Process student promotions if provided
      if (studentPromotions && studentPromotions.length > 0) {
        for (const promotion of studentPromotions) {
          await StudentModel.updateStudent(promotion.Roll_no, {
            Year: promotion.newYear
          });
        }
      }

      await connection.commit();
      return { 
        success: true, 
        message: "Semester started successfully",
        semester 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Generate Student Report
  static async generateStudentReport(Roll_no, sem_No, year) {
    try {
      // Get student details
      const student = await StudentModel.getStudent(Roll_no);
      console.log(student);
      if (!student || student.length === 0) {
        throw new Error('Student not found');
      }
  
      // Get semester details
      const semester = await SemesterModel.getSemester(sem_No, year);
      if (!semester) {
        throw new Error('Semester not found');
      }
  
      // Fetch grades of all semesters up to the provided Sem_no
      const [gradesData] = await pool.query(
        `SELECT
          g.Roll_no,
          g.Sem_no,
          
          g.Subject_Code,
          g.Grade,
          s.Credits
        FROM GRADE g
        JOIN Subjects s ON g.Subject_Code = s.Subject_Code
        WHERE g.Roll_no = ? AND  g.Sem_no <= ?
        ORDER BY g.Sem_no`,
        [Roll_no, year, sem_No]
      );
  
      if (gradesData.length === 0) {
        throw new Error('No grades found for the student');
      }
  
      // Fetch SPI for the current semester
      const spiData = await SPIModel.getSPI(Roll_no, sem_No);
      if (!spiData || spiData.length === 0) {
        throw new Error('SPI not found for the student and semester');
      }
  
      // Fetch CPI for all semesters up to the provided semester
      const cpiData = await CPIModel.getCPI(Roll_no, sem_No);
      if (!cpiData || cpiData.length === 0) {
        throw new Error('CPI not found for the student and semester');
      }
  
      // Get enrollments for the current semester
      const enrollments = await EnrollmentModel.getStudentEnrollments(Roll_no, sem_No, year);
  
      return {
        success: true,
        studentInfo: student[0],
        semesterInfo: semester,
        enrollments,
        gradesData,
        performance: {
          spiData,
          cpiData,
        },
      };
    } catch (error) {
      console.error('Error in generateStudentReport:', error.message); // Debugging
      throw error;
    }
  }

  // Validate Enrollment
  static async validateEnrollment(rollNo, subjectCode, semNo, year) {
    try {
      // Check if student exists
      const student = await StudentModel.getStudent(rollNo);
      if (!student || student.length === 0) {
        throw new Error('Student not found');
      }

      // Check if subject exists
      const subject = await SubjectModel.getSubjectByCode(subjectCode);
      if (!subject) {
        throw new Error('Subject not found');
      }

      // Check if semester exists
      const semester = await SemesterModel.getSemester(semNo, year);
      if (!semester) {
        throw new Error('Semester not found');
      }

      // Check if subject is available for student's department
      if (subject.Department && subject.Department !== student[0].Department) {
        throw new Error('Subject not available for student\'s department');
      }

      // Check if semester is in the correct status for enrollment
      if (semester.Status === 'COMPLETED') {
        throw new Error('Cannot enroll in a completed semester');
      }

      return { 
        success: true, 
        message: "Enrollment validation successful" 
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AcademicService;