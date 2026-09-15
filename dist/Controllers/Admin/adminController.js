"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = exports.createClassRoom = exports.updateTeacher = exports.deleteTeacher = exports.getTeacherById = exports.getAllTeachers = exports.addTeacher = exports.updateparent = exports.deleteParent = exports.getSingleParent = exports.getAllparents = exports.addParent = exports.updateStudent = exports.deleteStudent = exports.getSingleStudent = exports.getAllStudents = exports.addStudent = exports.deleteQuote = exports.updateQuote = exports.getSingleQuote = exports.getAllQuotes = exports.createQuote = exports.updateAnnouncement = exports.deleteannouncement = exports.findAnouncementById = exports.getAllAnnouncements = exports.createAnnouncement = exports.deleteTimetable = exports.cancelTimetable = exports.rescheduleTimetable = exports.getTimetableById = exports.getTimetables = exports.createTimeTable = exports.Adminlogin = void 0;
const db_1 = require("../../Config/db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const Cloudinary_1 = __importDefault(require("../../Config/Cloudinary"));
const Adminlogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }
        console.log(process.env.ADMIN_PASSWORD || process.env.ADMIN_EMAIL);
        const user = await db_1.prisma.adminlogin.findUnique({ where: {
                email: email
            } });
        const token = jsonwebtoken_1.default.sign({
            id: user?.id
        }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.json({ success: true, user, token });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
};
exports.Adminlogin = Adminlogin;
const createTimeTable = async (req, res) => {
    try {
        const { teacherId, classRoomId, title, date, subject, startTime, endTime, notes } = req.body;
        if (!teacherId || !classRoomId || !title || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "All required fields are required",
            });
        }
        const teacher = await db_1.prisma.teacher.findUnique({ where: {
                id: Number(teacherId)
            } });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }
        const classRoom = await db_1.prisma.classRoom.findUnique({ where: {
                id: Number(classRoomId)
            } });
        if (!classRoom) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }
        const existingSchedule = await db_1.prisma.timetable.findFirst({
            where: {
                teacherId: Number(teacherId),
                classRoomId: Number(classRoomId),
                date: new Date(date),
                startTime: {
                    lt: endTime
                },
                endTime: {
                    gt: startTime
                },
                status: {
                    not: "CANCELLED"
                },
                subject: {
                    not: 'Computer'
                }
            }
        });
        if (existingSchedule) {
            return res.status(409).json({
                success: false,
                message: "This class already has a schedule at this time",
            });
        }
        const timeTable = await db_1.prisma.timetable.create({
            data: {
                teacherId: Number(teacherId),
                classRoomId: Number(classRoomId),
                title,
                startTime,
                endTime,
                notes,
                date: new Date(date)
            },
        });
        return res.status(201).json({
            success: true,
            message: "Class scheduled successfully",
            data: timeTable,
        });
    }
    catch (error) {
        console.error("CREATE TIMETABLE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to schedule class",
        });
    }
};
exports.createTimeTable = createTimeTable;
// ==========================================
// GET ALL TIMETABLE
// ==========================================
const getTimetables = async (req, res) => {
    try {
        const { teacherId, classRoomId, startDate, endDate, } = req.query;
        const where = {};
        if (teacherId) {
            where.teacherId = Number(teacherId);
        }
        if (classRoomId) {
            where.classRoomId = Number(classRoomId);
        }
        if (startDate && endDate) {
            where.date = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate)),
            };
        }
        const timetables = await db_1.prisma.timetable.findMany({
            where,
            include: {
                teacher: true,
                classRoom: true,
            },
            orderBy: [
                {
                    date: "asc",
                },
            ],
        });
        return res.status(200).json({
            success: true,
            data: timetables,
        });
    }
    catch (error) {
        console.error("GET TIMETABLE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch timetable",
        });
    }
};
exports.getTimetables = getTimetables;
// ==========================================
// GET SINGLE TIMETABLE
// ==========================================
const getTimetableById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const timetable = await db_1.prisma.timetable.findUnique({
            where: {
                id,
            },
            include: {
                teacher: true,
                classRoom: true,
            },
        });
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Timetable not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: timetable,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch timetable",
        });
    }
};
exports.getTimetableById = getTimetableById;
// ==========================================
// RESCHEDULE CLASS
// ==========================================
const rescheduleTimetable = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { date, startTime, endTime, } = req.body;
        const timetable = await db_1.prisma.timetable.findUnique({
            where: {
                id,
            },
        });
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Timetable not found",
            });
        }
        const updatedTimetable = await db_1.prisma.timetable.update({
            where: {
                id,
            },
            data: {
                date: new Date(date),
                startTime,
                endTime,
                status: "RESCHEDULED",
            },
            include: {
                teacher: true,
                classRoom: true,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Class rescheduled successfully",
            data: updatedTimetable,
        });
    }
    catch (error) {
        console.error("RESCHEDULE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reschedule class",
        });
    }
};
exports.rescheduleTimetable = rescheduleTimetable;
// ==========================================
// CANCEL CLASS
// ==========================================
const cancelTimetable = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const timetable = await db_1.prisma.timetable.findUnique({
            where: {
                id,
            },
        });
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Timetable not found",
            });
        }
        const updated = await db_1.prisma.timetable.update({
            where: {
                id,
            },
            data: {
                status: "CANCELLED",
            },
        });
        return res.status(200).json({
            success: true,
            message: "Class cancelled successfully",
            data: updated,
        });
    }
    catch (error) {
        console.error("CANCEL TIMETABLE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel class",
        });
    }
};
exports.cancelTimetable = cancelTimetable;
// ==========================================
// DELETE TIMETABLE
// ==========================================
const deleteTimetable = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const timetable = await db_1.prisma.timetable.findUnique({
            where: {
                id,
            },
        });
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Timetable not found",
            });
        }
        await db_1.prisma.timetable.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Timetable deleted successfully",
        });
    }
    catch (error) {
        console.error("DELETE TIMETABLE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete timetable",
        });
    }
};
exports.deleteTimetable = deleteTimetable;
const createAnnouncement = async (req, res) => {
    try {
        const { title, date, time, message } = req.body;
        if (!title || !date || !time || !message) {
            return res.json({ success: false,
                messgae: "All fields are required"
            });
        }
        const announcement = await db_1.prisma.announcement.create({
            data: {
                title,
                date,
                time,
                message
            }
        });
        res.json({ success: true, message: 'Announcement Created Successfully', announcement });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
};
exports.createAnnouncement = createAnnouncement;
const getAllAnnouncements = async (req, res) => {
    try {
        const allAnnouncements = await db_1.prisma.announcement.findMany({
            orderBy: {
                id: "asc"
            }
        });
        res.json({ success: true, allAnnouncements });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
};
exports.getAllAnnouncements = getAllAnnouncements;
const findAnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await db_1.prisma.announcement.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!announcement) {
            return res.json({ success: false, message: "announcement not found" });
        }
        res.json({ success: true, announcement });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
};
exports.findAnouncementById = findAnouncementById;
const deleteannouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await db_1.prisma.announcement.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!announcement) {
            return res.json({ success: false, message: "announcement not found" });
        }
        const deleteAnnouncement = await db_1.prisma.announcement.delete({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, message: "announcement deleted successsfully", deleteAnnouncement });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
};
exports.deleteannouncement = deleteannouncement;
const updateAnnouncement = async (req, res) => {
    try {
        const { title, date, time, message } = req.body;
        const { id } = req.params;
        const announcement = await db_1.prisma.announcement.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!announcement) {
            return res.json({ success: false, message: "announcement not found" });
        }
        const updateAnnouncement = await db_1.prisma.announcement.update({
            where: {
                id: Number(id),
            },
            data: {
                title,
                message,
                date,
                time
            }
        });
        res.json({ success: true, message: "announcement update successsfully", updateAnnouncement });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
};
exports.updateAnnouncement = updateAnnouncement;
//================ QUOTE ==============
const createQuote = async (req, res) => {
    try {
        const { title, date, time, quote } = req.body;
        if (!title || !date || time || !quote) {
            return res.json({ success: false, message: "Missing Require fieds" });
        }
        const createQuote = await db_1.prisma.quote.create({
            data: {
                title,
                date,
                time,
                quote
            }
        });
        res.json({ success: true, createQuote, message: "Quote Created Successfully" });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
exports.createQuote = createQuote;
// get quotes 
const getAllQuotes = async (req, res) => {
    try {
        const quotes = await db_1.prisma.quote.findMany({
            orderBy: {
                id: "asc"
            }
        });
        res.json({ success: true, quotes });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
exports.getAllQuotes = getAllQuotes;
// get single quote
const getSingleQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await db_1.prisma.quote.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!quote) {
            res.json({ success: false, message: "Quoted not found" });
        }
        res.json({ success: true, quote });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
exports.getSingleQuote = getSingleQuote;
// delete quote =======
const updateQuote = async (req, res) => {
    try {
        const { title, date, time, quote } = req.body;
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "Quote Not found" });
        }
        const updateQuote = await db_1.prisma.quote.update({
            where: {
                id: Number(id)
            },
            data: {
                title,
                time,
                date,
                quote
            }
        });
        res.json({ success: true, updateQuote, message: "Quote updated Successfully" });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
exports.updateQuote = updateQuote;
// delete quote 
const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "quote not found" });
        }
        const deleteQuote = await db_1.prisma.quote.delete({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, deleteQuote, message: "Quote deleted Successfully" });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
exports.deleteQuote = deleteQuote;
// add student 
const addStudent = async (req, res) => {
    try {
        const { name, email, phoneNo, enrollin, guardianName, guardianEmail, guardianPhone, password, confirmPassword, role } = req.body;
        if (!name || !email || phoneNo || !enrollin || !guardianName || !guardianEmail
            || !guardianPhone || !password || !confirmPassword || !role) {
            return res.json({ success: false, message: "Missing Require fieds" });
        }
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        const student = await db_1.prisma.addStudent.create({
            data: {
                name,
                email,
                phoneNo,
                guardianName,
                guardianEmail,
                guardianPhone,
                password, confirmPassword,
                enrollin,
                role: "STUDENT"
            }
        });
        return res.status(201).json({
            success: true,
            message: "Student added successfully",
            student,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.addStudent = addStudent;
// ========== getAllStudents =========
const getAllStudents = async (req, res) => {
    try {
        const students = await db_1.prisma.addStudent.findMany({
            orderBy: {
                id: "asc"
            }
        });
        res.json({ success: true, students });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getAllStudents = getAllStudents;
// getSingleStudent ============
const getSingleStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "student not found" });
        }
        const student = await db_1.prisma.addStudent.findUnique({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, student });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getSingleStudent = getSingleStudent;
// deletestudent ==========
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "student not found" });
        }
        const delstudent = await db_1.prisma.addStudent.delete({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, delstudent, message: "student deletd successfully" });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.deleteStudent = deleteStudent;
// update student ==========
const updateStudent = async (req, res) => {
    try {
        const { name, email, phoneNo, enrollin, guardianName, guardianEmail, guardianPhone, password, confirmPassword } = req.body;
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "student not found" });
        }
        const updatestudent = await db_1.prisma.addStudent.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                email,
                phoneNo,
                enrollin,
                guardianName,
                guardianEmail,
                guardianPhone,
                password,
                confirmPassword
            }
        });
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        res.json({ success: true, updatestudent });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.updateStudent = updateStudent;
// add parent =======
const addParent = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        if (!name || !email || !password || !confirmPassword) {
            return res.json({ success: false, message: "Missing Require fieds" });
        }
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        const student = await db_1.prisma.addParent.create({
            data: {
                name,
                email,
                password,
                confirmPassword,
                role: "PARENT"
            }
        });
        return res.status(201).json({
            success: true,
            message: "Parent added successfully",
            student,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.addParent = addParent;
// get all parents 
const getAllparents = async (req, res) => {
    try {
        const parent = await db_1.prisma.addParent.findMany({
            orderBy: {
                id: "asc"
            }
        });
        res.json({ success: true, parent });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getAllparents = getAllparents;
// get singlearent 
const getSingleParent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "parent not found" });
        }
        const parent = await db_1.prisma.addParent.findUnique({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, parent });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getSingleParent = getSingleParent;
// =========delete parent 
const deleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "parent id not found" });
        }
        const delparent = await db_1.prisma.addParent.delete({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, delparent, message: "deleted successfully" });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.deleteParent = deleteParent;
// update parent ========
const updateparent = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        const { id } = req.params;
        if (!name || !email || !password || !confirmPassword) {
            return res.json({ success: false, message: "Missing Require fieds" });
        }
        const student = await db_1.prisma.addParent.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                email,
                password,
                confirmPassword,
                role: "PARENT"
            }
        });
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        return res.status(201).json({
            success: true,
            message: "Parent updated  successfully",
            student,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.updateparent = updateparent;
// add teacher =========
const addTeacher = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, qualification, phone } = req.body;
        const imageFile = req.file;
        if (!name || !email || !password || !confirmPassword || !qualification || !phone) {
            return res.json({ success: false, message: "Missing Require fieds" });
        }
        if (!imageFile) {
            return res.json({ success: false, message: "image not found" });
        }
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        const uploadImage = Cloudinary_1.default.uploader.upload(imageFile.path, { folder: "teachers" });
        const secureUrl = (await uploadImage).secure_url;
        const teacher = await db_1.prisma.addTeacher.create({
            data: {
                name,
                email,
                password,
                confirmPassword,
                qualification,
                phone,
                image: secureUrl
            }
        });
        return res.status(201).json({
            success: true,
            message: "Teacher added  successfully",
            teacher,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.addTeacher = addTeacher;
// get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const allteachers = await db_1.prisma.addTeacher.findMany({
            orderBy: {
                id: 'asc'
            }
        });
        res.json({ success: true, allteachers });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getAllTeachers = getAllTeachers;
// get single teacher 
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "Teacher not found" });
        }
        const teacher = await db_1.prisma.addTeacher.findUnique({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, teacher });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getTeacherById = getTeacherById;
// delete teacher
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ success: false, message: "teacher id not found" });
        }
        const delteacher = await db_1.prisma.addTeacher.delete({
            where: {
                id: Number(id)
            }
        });
        res.json({ success: true, delteacher, message: "deleted successfully" });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.deleteTeacher = deleteTeacher;
// update teacher
const updateTeacher = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, qualification, phone } = req.body;
        const { id } = req.params;
        if (!name || !email || !password || !confirmPassword || !qualification || !phone) {
            return res.json({ success: false, message: "Missing Require fieds" });
        }
        const student = await db_1.prisma.addTeacher.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                email,
                password,
                confirmPassword,
                qualification, phone,
            }
        });
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        return res.status(201).json({
            success: true,
            message: "updated  successfully",
            student,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.updateTeacher = updateTeacher;
// cretae class room 
const createClassRoom = async (req, res) => {
    try {
        const { className, teachers, students } = req.body;
        if (!className || !teachers || !students) {
            return res.json({ success: false, message: "All fields are required" });
        }
        const classRoom = await db_1.prisma.createNewClass.create({
            data: {
                className,
                students: students || [],
                teachers: teachers || []
            }
        });
        return res.status(201).json({
            success: true,
            message: "Classroom created successfully",
            classRoom,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.createClassRoom = createClassRoom;
// DASHBOARD DATA 
const getDashboardData = async (req, res) => {
    try {
        const [students, teachers, parents] = await Promise.all([
            db_1.prisma.addStudent.count(),
            db_1.prisma.addTeacher.count(),
            db_1.prisma.addParent.count()
        ]);
        return res.json({ success: true, students, teachers, parents });
    }
    catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
exports.getDashboardData = getDashboardData;
//# sourceMappingURL=adminController.js.map