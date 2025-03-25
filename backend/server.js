const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const UserModel = require('./models/userModel');
const StudentModel = require('./models/studentModel');
const EnrollmentModel = require('./models/enrollmentModel');
const SubjectModel = require('./models/subjectModel');
const mainRoutes = require('./routes/mainRoutes');
const CPICtrl = require('./controllers/cpiController');
const SPIModel = require('./models/spiModel');
const SemesterModel = require('./models/semesterModel');
const academicRoutes = require('./routes/academicRoute');
const GRADEModel = require('./models/GradeModel');
const gradeRoutes=require('./routes/gradeRoutes');
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.use('/api/students', mainRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/upload',gradeRoutes);
// Start the server
const startServer = async () => {
  try {
    await UserModel.initTable();
    await StudentModel.initTable();
    await SubjectModel.initTable();
    await EnrollmentModel.initTable();
    await SemesterModel.initTable();
    await CPICtrl.initTable();
    await SPIModel.initTable();
    await GRADEModel.initTable();

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();