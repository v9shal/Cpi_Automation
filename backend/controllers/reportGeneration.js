const pdfkit = require('pdfkit');
const fs = require('fs');
const pool = require('../config/dbconfig');
const StudentModel = require('../models/studentModel');
const GRADEModel = require('../models/GradeModel');
const SubjectModel = require('../models/subjectModel');
const SemesterModel = require('../models/semesterModel');
const SPIModel = require('../models/spiModel');
const CPIModel = require('../models/cpiModel');

const generateReportCard = async (req, res) => {
  const { rollNo } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    // Fetch student details
    const student = await StudentModel.getStudent(rollNo);
    if (!student || student.length === 0) {
      return res.status(404).json({ error: `Student ${rollNo} not found` });
    }

    // Fetch all grades and history
    const grades = await GRADEModel.getTotalGrades(rollNo);
    const gradeHistory = await GRADEModel.getAllGradeHistoryByStudent(rollNo);

    // Fetch subjects for credits
    const subjectCodes = [...new Set(grades.map(g => g.Subject_Code))];
    const subjects = await Promise.all(subjectCodes.map(code => SubjectModel.getSubjectByCode(code)));

    // Fetch semesters
    const semesterKeys = [...new Set(grades.map(g => `${g.Sem_no}-${g.Year}`))];
    const semesters = await Promise.all(
      semesterKeys.map(key => {
        const [sem_no, year] = key.split('-');
        return SemesterModel.getSemester(parseInt(sem_no), parseInt(year));
      })
    );

    // Fetch SPI and CPI from database
    const spiData = await Promise.all(
      semesters.map(sem => SPIModel.getSPI(rollNo, sem.Sem_no))
    );
    const cpiData = await Promise.all(
      semesters.map(sem => CPIModel.getCPI(rollNo, sem.Sem_no))
    );

    // Structure data for PDF
    const semestersData = semesters.map((semester, index) => {
      const semGrades = grades.filter(g => g.Sem_no === semester.Sem_no && g.Year === semester.Year);
      const semHistory = gradeHistory.filter(h => h.Sem_no === semester.Sem_no && h.Year === semester.Year);
      
      // Find the matching SPI and CPI data for this semester
      const semesterSPI = spiData[index]?.find(s => s.Sem_no === semester.Sem_no && s.Year === semester.Year);
      const semesterCPI = cpiData[index]?.find(c => c.Sem_no === semester.Sem_no && c.Year === semester.Year);
      
      // Process courses to handle retakes and failed courses
      const processedCourses = [];
      const retakeCourses = new Set();
      
      semGrades.forEach(grade => {
        const history = semHistory.filter(h => h.Subject_Code === grade.Subject_Code);
        const subject = subjects.find(s => s.Subject_Code === grade.Subject_Code);
        
        // Check if this is the latest attempt
        const isLatestAttempt = !history.some(h => h.Attempt > grade.Attempt);
        
        // For failed courses or retakes
        const hasFailed = history.some(h => h.Grade === 'F');
        
        processedCourses.push({
          Course: grade.Subject_Code,
          Course_Name: subject ? subject.Subject_Name : 'Unknown',
          Credits: subject ? subject.Credits : 0,
          Grade: grade.Grade,
          History: history,
          HasFailed: hasFailed,
          IsLatestAttempt: isLatestAttempt,
          Attempt: grade.Attempt
        });
        
        // Track which courses have been retaken
        if (hasFailed && grade.Grade !== 'F') {
          retakeCourses.add(grade.Subject_Code);
        }
      });
      
      return {
        Sem_no: semester.Sem_no,
        Year: semester.Year,
        Duration: `${semester.Start_Month} ${semester.Year} - ${semester.End_Month} ${semester.End_Year || semester.Year}`,
        Courses: processedCourses,
        RetakeCourses: retakeCourses,
        SPI: semesterSPI?.cumulativeSPI || 'N/A',
        CPI: semesterCPI?.cumulativeCPI || 'N/A',
      };
    });

    // Generate PDF
    const doc = new pdfkit({ size: 'A4', margin: 50 });
    const fileName = `grade_card_${rollNo}.pdf`;
    const stream = fs.createWriteStream(fileName);
    doc.pipe(stream);

    // Add Hindi title (using placeholder text as Hindi may not render correctly)
    doc.font('Helvetica-Bold').fontSize(12).text('भारतीय सूचना Ůौघोिगकी सं˕ान गुवाहाटी', { align: 'center' });
    
    // Add English title
    doc.font('Helvetica-Bold').fontSize(14).text('INDIAN INSTITUTE OF INFORMATION TECHNOLOGY GUWAHATI', { align: 'center' });
    doc.fontSize(12).text('Bachelor of Technology Grade Card (Semester IV)', { align: 'center' });
    doc.moveDown(0.5);

    // Student Info
    doc.font('Helvetica').fontSize(10);
    doc.text(`Program Duration: 4 Years`, 50, doc.y);
    doc.text(`Semesters: Eight (8)`, 300, doc.y - 10);
    doc.moveDown(0.3);
    doc.text(`Name: ${student[0].Name}`, 50, doc.y);
    doc.text(`Roll No.: ${rollNo}`, 300, doc.y - 10);
    doc.moveDown(0.3);
    doc.text(`Discipline: ${student[0].Discipline}`, 50, doc.y);
    doc.text(`Year of Enrolment: ${student[0].Year_of_Enrolment}`, 300, doc.y - 10);
    doc.moveDown(0.5);

    // SPI/CPI Table
    doc.font('Helvetica-Bold').fontSize(11).text('Semester and Cumulative Performance Index (S.P.I and C.P.I)', { align: 'center' });
    doc.moveDown(0.5);

    const spiCpiTableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    
    // Layout for SPI/CPI table
    const colWidths = [70, 60, 60, 60, 60, 60, 60, 60, 60];
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = (doc.page.width - totalWidth) / 2;
    
    // Headers for SPI/CPI table
    let xPos = tableStartX;
    doc.text('', xPos, spiCpiTableTop); xPos += colWidths[0];
    doc.text('Sem I', xPos, spiCpiTableTop); xPos += colWidths[1];
    doc.text('Sem II', xPos, spiCpiTableTop); xPos += colWidths[2];
    doc.text('Sem III', xPos, spiCpiTableTop); xPos += colWidths[3];
    doc.text('Sem IV', xPos, spiCpiTableTop); xPos += colWidths[4];
    doc.text('Sem V', xPos, spiCpiTableTop); xPos += colWidths[5];
    doc.text('Sem VI', xPos, spiCpiTableTop); xPos += colWidths[6];
    doc.text('Sem VII', xPos, spiCpiTableTop); xPos += colWidths[7];
    doc.text('Sem VIII', xPos, spiCpiTableTop); xPos += colWidths[8];
    doc.text('Status', xPos, spiCpiTableTop);
    
    doc.moveTo(tableStartX, spiCpiTableTop + 15).lineTo(tableStartX + totalWidth + 50, spiCpiTableTop + 15).stroke();

    doc.font('Helvetica');
    let ySpiCpi = spiCpiTableTop + 20;
    
    // SPI row
    xPos = tableStartX;
    doc.text('S.P.I', xPos, ySpiCpi); xPos += colWidths[0];
    
    // Fill in SPI data for each semester
    for (let i = 0; i < 8; i++) {
      const semData = semestersData.find(s => s.Sem_no === i + 1);
      doc.text(semData ? semData.SPI : '', xPos, ySpiCpi);
      xPos += colWidths[i + 1];
    }
    
    // Status (Incomplete if less than 8 semesters)
    if (semestersData.length < 8) {
      doc.text('Incomplete', xPos, ySpiCpi + 10);
    }
    
    ySpiCpi += 25;
    
    // CPI row
    xPos = tableStartX;
    doc.text('C.P.I', xPos, ySpiCpi); xPos += colWidths[0];
    
    // Fill in CPI data for each semester
    for (let i = 0; i < 8; i++) {
      const semData = semestersData.find(s => s.Sem_no === i + 1);
      doc.text(semData ? semData.CPI : '', xPos, ySpiCpi);
      xPos += colWidths[i + 1];
    }
    
    doc.moveDown(2);
    
    // Date and signature
    doc.text(`Date: 31st May, 2024`, 50, doc.y);
    doc.text(`Associate Dean (Academic Affairs – UG)`, 350, doc.y);
    doc.moveDown(1);
    
    // Course tables - Side by side for odd and even semesters
    const courseTableY = doc.y;
    let maxY = courseTableY;
    
    // Column definitions for course tables
    const courseColWidths = [50, 140, 25, 25];
    const courseTableWidth = courseColWidths.reduce((sum, width) => sum + width, 0);
    
    // Create course table headers
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Course', 50, courseTableY);
    doc.text('Course Name', 100, courseTableY);
    doc.text('Cr.', 240, courseTableY);
    doc.text('Gr.', 265, courseTableY);
    
    doc.text('Course', 320, courseTableY);
    doc.text('Course Name', 370, courseTableY);
    doc.text('Cr.', 510, courseTableY);
    doc.text('Gr.', 535, courseTableY);
    
    doc.moveDown(0.5);
    
    // Group semesters into pairs (1-2, 3-4, etc.)
    for (let pairIndex = 0; pairIndex < Math.ceil(semestersData.length / 2); pairIndex++) {
      const leftSemIndex = pairIndex * 2;
      const rightSemIndex = leftSemIndex + 1;
      
      const leftSem = semestersData[leftSemIndex];
      const rightSem = semestersData[rightSemIndex];
      
      // Start of the current pair of semesters
      const pairStartY = doc.y;
      
      // Add semester header
      doc.font('Helvetica-Bold').fontSize(10);
      if (leftSem) {
        doc.text(`Semester ${leftSem.Sem_no} (${leftSem.Duration})`, 50, pairStartY);
      }
      
      if (rightSem) {
        doc.text(`Semester ${rightSem.Sem_no} (${rightSem.Duration})`, 320, pairStartY);
      }
      
      doc.moveDown(0.5);
      let currentY = doc.y;
      
      // Process courses for left semester
      if (leftSem) {
        // Sort courses - original courses first, then retakes
        const regularCourses = leftSem.Courses.filter(c => c.Attempt === 1);
        const retakeCourses = leftSem.Courses.filter(c => c.Attempt > 1 && c.Grade !== 'F');
        
        // Display regular courses
        doc.font('Helvetica').fontSize(9);
        regularCourses.forEach(course => {
          doc.text(course.Course, 50, currentY);
          doc.text(course.Course_Name, 100, currentY, { width: 130 });
          doc.text(course.Credits.toString(), 240, currentY);
          doc.text(course.Grade, 265, currentY);
          currentY += 20;
        });
        
        // Display retake courses with asterisk
        retakeCourses.forEach(course => {
          doc.text(`${course.Course}*`, 50, currentY);
          doc.text(course.Course_Name, 100, currentY, { width: 130 });
          doc.text(course.Credits.toString(), 240, currentY);
          doc.text(course.Grade, 265, currentY);
          currentY += 20;
        });
      }
      
      // Process courses for right semester
      if (rightSem) {
        // Reset Y position for right column
        currentY = doc.y;
        
        // Sort courses - original courses first, then retakes
        const regularCourses = rightSem.Courses.filter(c => c.Attempt === 1);
        const retakeCourses = rightSem.Courses.filter(c => c.Attempt > 1 && c.Grade !== 'F');
        
        // Display regular courses
        doc.font('Helvetica').fontSize(9);
        regularCourses.forEach(course => {
          doc.text(course.Course, 320, currentY);
          doc.text(course.Course_Name, 370, currentY, { width: 130 });
          doc.text(course.Credits.toString(), 510, currentY);
          doc.text(course.Grade, 535, currentY);
          currentY += 20;
        });
        
        // Display retake courses with asterisk
        retakeCourses.forEach(course => {
          doc.text(`${course.Course}*`, 320, currentY);
          doc.text(course.Course_Name, 370, currentY, { width: 130 });
          doc.text(course.Credits.toString(), 510, currentY);
          doc.text(course.Grade, 535, currentY);
          currentY += 20;
        });
      }
      
      // Update max Y position
      maxY = Math.max(maxY, currentY);
      
      // Move to next pair
      doc.y = maxY + 20;
      
      // Add page break if needed
      if (doc.y > 700 && pairIndex < Math.ceil(semestersData.length / 2) - 1) {
        doc.addPage();
        doc.y = 50;
        maxY = 50;
      }
    }
    
    // Add second page for grade legends
    doc.addPage();
    
    // Add Hindi title again for second page
    doc.font('Helvetica-Bold').fontSize(12).text('भारतीय सूचना Ůौघोिगकी सं˕ान गुवाहाटी', { align: 'center' });
    
    // Add English title again
    doc.font('Helvetica-Bold').fontSize(14).text('INDIAN INSTITUTE OF INFORMATION TECHNOLOGY GUWAHATI', { align: 'center' });
    doc.moveDown(1);
    
    // Set up tables for the grade explanation page
    const legendY = doc.y;
    
    // Letter Grades table
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Letter Grades', 50, legendY);
    doc.text('Grade Points', 150, legendY);
    doc.text('Abbreviations used', 300, legendY);
    
    const letterGrades = [
      { letter: 'AA', points: '10' },
      { letter: 'AB', points: '9' },
      { letter: 'BB', points: '8' },
      { letter: 'BC', points: '7' },
      { letter: 'CC', points: '6' },
      { letter: 'CD', points: '5' },
      { letter: 'DD', points: '4' },
      { letter: 'F', points: '0 (Fail)' },
      { letter: 'PP', points: 'Pass' },
      { letter: 'NP', points: 'Fail' },
      { letter: 'I', points: 'Incomplete' }
    ];
    
    const abbreviations = [
      { abbr: 'Cr.', meaning: 'Credit' },
      { abbr: 'Gr.', meaning: 'Grade' },
      { abbr: 'S.P.I.', meaning: 'Semester Performance Index' },
      { abbr: 'C.P.I.', meaning: 'Cumulative Performance Index' }
    ];
    
    doc.font('Helvetica');
    let gradeY = legendY + 20;
    
    // Display letter grades
    letterGrades.forEach(grade => {
      doc.text(grade.letter, 50, gradeY);
      doc.text(grade.points, 150, gradeY);
      gradeY += 15;
    });
    
    // Display abbreviations
    let abbrY = legendY + 20;
    abbreviations.forEach(abbr => {
      doc.text(abbr.abbr, 300, abbrY);
      doc.text(abbr.meaning, 400, abbrY);
      abbrY += 15;
    });
    
    // Additional note about PP/NP grades
    doc.text('Courses awarded with PP/NP grades are', 300, abbrY + 10);
    doc.text('excluded in S.P.I. and C.P.I. calculations.', 300, abbrY + 25);
    
    // Rules for grading
    doc.moveDown(3);
    const rulesY = doc.y + 30;
    
    const rules = [
      'A student is considered to have completed a subject successfully and earned the credits if he secures a letter grade other than I or F in that subject.',
      'A student obtaining the grade F in any subject will be deemed to have failed in that course. In case of a theory course, he/she can pass that course by giving supplementary examination. However, the highest grade that a student can get through this option is CC.',
      'If the student fails to clear the course in two supplementary chances, he/she will have to repeat the course.',
      'In case of failure in Laboratory/Practical subject, the student will have to re-register for it in the next appropriate semester and a student can get up to a letter grade AA.',
      'A student taking a course again or giving a supplementary examination will get two grades for the same course. The supplementary examination grades will be shown separately. The better of the two grades (the old and the new) of that course will be considered for S.P.I. and C.P.I. calculations.',
      'No Class or Division is awarded in this Institute.'
    ];
    
    doc.fontSize(9);
    let ruleY = rulesY;
    rules.forEach(rule => {
      doc.text('•', 35, ruleY);
      doc.text(rule, 45, ruleY, { width: 500 });
      ruleY += doc.heightOfString(rule, { width: 500 }) + 5;
    });
    
    // SPI and CPI calculation formulas
    doc.moveDown();
    const formulaY = ruleY + 15;
    doc.text('The S.P.I. and C.P.I are calculated as:', 45, formulaY);
    
    // Formulas in a structured format - trying to approximate the mathematical notation
    doc.text('S. P. I. = ∑ Ci Gi / ∑ Ci  and  C. P. I. = ∑ Ci Gi / ∑ Ci', 45, formulaY + 20);
    doc.text('i=1      i=1             i=1      i=1', 90, formulaY + 35);
    doc.text('N        N               M        M', 90, formulaY + 10);
    
    // Formula explanations
    doc.text('Ci is the number of credits (Cr.) allotted to a particular course', 45, formulaY + 50);
    doc.text('Gi the grade points corresponding to the grade (Gr.) awarded for the course', 45, formulaY + 65);
    doc.text('N is the total number of courses registered in a semester.', 45, formulaY + 80);
    doc.text('M is the total number of courses registered so far.', 45, formulaY + 95);
    
    // Final note
    doc.moveDown();
    doc.text('• There is no specific formula for converting CPI to percentage marks at IIIT Guwahati. However, if required, the CPI may be multiplied by 10 for an indicative percentage of marks.', 45, formulaY + 120, { width: 500 });
    
    // Verification text
    doc.text('Verified:', 500, formulaY + 160);
    
    doc.end();

    stream.on('finish', () => {
      res.download(fileName, (err) => {
        if (err) console.error('Error sending file:', err);
        fs.unlinkSync(fileName); // Clean up
      });
    });

  } catch (error) {
    console.error('Error generating report card:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = generateReportCard;