import express from 'express'
import { addParent, addStudent, addTeacher, Adminlogin, cancelTimetable, createAnnouncement, 
    createQuote, createTimeTable, deleteannouncement, deleteParent, deleteQuote, deleteStudent, deleteTeacher, deleteTimetable, findAnouncementById, 
    getAllAnnouncements, getAllparents, getAllQuotes, getAllStudents, getAllTeachers, getAllUsersData, getSingleParent, getSingleQuote, getSingleStudent, getTeacherById, getTimetableById, getTimetables, 
    updateAnnouncement,updateparent,  updateQuote,updateStudent,  updateTeacher } from '../../Controllers/Admin/adminController'


const adminRouter = express.Router()


adminRouter.post('/login' , Adminlogin)
adminRouter.get("/allusersdata" , getAllUsersData)

// ===========TABLE ROUTES =============

adminRouter.post("/createtable", createTimeTable);
adminRouter.get("/getalltable", getTimetables);
adminRouter.get("table/:id", getTimetableById);
adminRouter.put("table/:id/cancel", cancelTimetable);
adminRouter.delete("/:id", deleteTimetable);

// ===========ANNOUNCEMENTS ROUTES =============

adminRouter.post('/createAnnouncement' , createAnnouncement);
adminRouter.get('/getAllAnnouncements' , getAllAnnouncements)
adminRouter.get('/getsingleannouncement' , findAnouncementById)
adminRouter.delete('/deleteAnnouncement/:id' , deleteannouncement)
adminRouter.put('/updateAnnouncement/:id' , updateAnnouncement)


// =========== QUOTES ROUTES =============
adminRouter.post('/createquote' , createQuote)
adminRouter.get('/getallquote' , getAllQuotes)
adminRouter.get('/getsinglequote' , getSingleQuote)
adminRouter.delete('/deletequote/:id' , deleteQuote)
adminRouter.put('/updatequote/:id' , updateQuote)

//============= ADD STUDENT ROUTES =============
adminRouter.post('/addstudent' , addStudent)
adminRouter.get('/getallstudents' , getAllStudents)
adminRouter.get('/getsinglestudent' , getSingleStudent)
adminRouter.delete('/deletestudent' , deleteStudent)
adminRouter.put('/updatestudent' , updateStudent)


//========= ADD TEACHER ROUTES ========== 
adminRouter.post('/addteacher' , addTeacher)
adminRouter.get('/getallteachers' , getAllTeachers)
adminRouter.get('/getsinglteacher' , getTeacherById)
adminRouter.delete('/deleteteacher' , deleteTeacher)
adminRouter.put('/updateteacher' , updateTeacher)

//========= ADD PARENT ROUTES ============
adminRouter.post('/addparent' , addParent)
adminRouter.get('/getallparents' , getAllparents)
adminRouter.get('/getsinglparent' , getSingleParent)
adminRouter.delete('/deleteparent' , deleteParent)
adminRouter.put('/updateparent' , updateparent)





export default adminRouter