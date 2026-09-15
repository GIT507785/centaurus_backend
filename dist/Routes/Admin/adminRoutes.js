"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../../Controllers/Admin/adminController");
const adminRouter = express_1.default.Router();
adminRouter.post('/login', adminController_1.Adminlogin);
// ===========TABLE ROUTES =============
adminRouter.post("/createtable", adminController_1.createTimeTable);
adminRouter.get("/getalltable", adminController_1.getTimetables);
adminRouter.get("/:id", adminController_1.getTimetableById);
adminRouter.put("/:id/cancel", adminController_1.cancelTimetable);
adminRouter.delete("/:id", adminController_1.deleteTimetable);
// ===========ANNOUNCEMENTS ROUTES =============
adminRouter.post('/createAnnouncement', adminController_1.createAnnouncement);
adminRouter.get('/getAllAnnouncements', adminController_1.getAllAnnouncements);
adminRouter.get('/getsingleannouncement', adminController_1.findAnouncementById);
adminRouter.delete('/deleteAnnouncement', adminController_1.deleteannouncement);
adminRouter.put('/updateAnnouncement', adminController_1.updateAnnouncement);
// =========== QUOTES ROUTES =============
adminRouter.post('/createquote', adminController_1.createQuote);
adminRouter.get('/getallquote', adminController_1.getAllQuotes);
adminRouter.get('/getsinglequote', adminController_1.getSingleQuote);
adminRouter.delete('/deletequote', adminController_1.deleteQuote);
adminRouter.put('/updatequote', adminController_1.updateQuote);
//============= ADD STUDENT ROUTES =============
adminRouter.post('/addstudent', adminController_1.addStudent);
adminRouter.get('/getallstudents', adminController_1.getAllStudents);
adminRouter.get('/getsinglestudent', adminController_1.getSingleStudent);
adminRouter.delete('/deletestudent', adminController_1.deleteStudent);
adminRouter.put('/updatestudent', adminController_1.updateStudent);
//========= ADD TEACHER ROUTES ========== 
adminRouter.post('/addteacher', adminController_1.addTeacher);
adminRouter.get('/getallteachers', adminController_1.getAllTeachers);
adminRouter.get('/getsinglteacher', adminController_1.getTeacherById);
adminRouter.delete('/deleteteacher', adminController_1.deleteTeacher);
adminRouter.put('/updateteacher', adminController_1.updateTeacher);
//========= ADD PARENT ROUTES ============
adminRouter.post('/addparent', adminController_1.addParent);
adminRouter.get('/getallparents', adminController_1.getAllparents);
adminRouter.get('/getsinglparent', adminController_1.getSingleParent);
adminRouter.delete('/deleteparent', adminController_1.deleteParent);
adminRouter.put('/updateparent', adminController_1.updateparent);
exports.default = adminRouter;
//# sourceMappingURL=adminRoutes.js.map