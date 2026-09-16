import { Request , Response } from "express"
import { prisma } from "../../Config/db"
import jwt from "jsonwebtoken"
import 'dotenv/config'
import { queryObjects } from "v8"
import cloudnary from "../../Config/Cloudinary"

export const Adminlogin = async (req:Request , res:Response)=>{
try {
    
     const {email , password} = req.body
      
     if(email !== process.env.ADMIN_EMAIL  || password !== process.env.ADMIN_PASSWORD){
        return res.json({success:false, message:"Invalid Credentials"})
     }

     console.log(process.env.ADMIN_PASSWORD || process.env.ADMIN_EMAIL)

   const user = await prisma.adminlogin.findUnique({where:{
     email:email
   }})      
    
   const token = jwt.sign({
    id:user?.id   
   } , process.env.JWT_SECRET as string , {expiresIn:'3d'})

   res.json({success:true , user , token})

} catch (error:any) {
    res.json({success:false , message:error.message})
}
}


export const createTimeTable = async(req:Request , res:Response)=>{
    try {
        
        const {teacherId , classRoomId , title , date ,subject ,  startTime , endTime , notes} = req.body
       
           if (!teacherId || !classRoomId || !title ||!date || !startTime || !endTime) {
           return res.status(400).json({
           success: false,
           message: "All required fields are required",
         });
      }
      
       const teacher  = await prisma.teacher.findUnique({where:{
        id:Number(teacherId)
       }})

        if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const classRoom = await prisma.classRoom.findUnique({where:{
        id:Number(classRoomId)
    }})


    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const existingSchedule = await prisma.timetable.findFirst({
        where:{
            teacherId:Number(teacherId),
            classRoomId:Number(classRoomId),
            date: new Date(date),

            startTime:{
                lt:endTime
            },
             
            endTime:{
                gt:startTime
            },

            status:{
            not:"CANCELLED"
            },

            subject:{
                not:'Computer'
            }

        }
    })

      if (existingSchedule) {
      return res.status(409).json({
        success: false,
        message: "This class already has a schedule at this time",
      });
    }

     const timeTable = await prisma.timetable.create({
        data :{
            teacherId:Number(teacherId),
            classRoomId:Number(classRoomId),
            title ,
            startTime,
            endTime,
            notes,
            date: new Date(date)
        }, 
     })

    return res.status(201).json({
      success: true,
      message: "Class scheduled successfully",
      data: timeTable,
    });

    } catch (error:any) {
         console.error("CREATE TIMETABLE ERROR:", error);
        return res.status(500).json({
        success: false,
        message: "Failed to schedule class",
        });
  }
    }


    // ==========================================
// GET ALL TIMETABLE
// ==========================================

export const getTimetables = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      teacherId,
      classRoomId,
      startDate,
      endDate,
    } = req.query;

    const where: any = {};

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

    const timetables = await prisma.timetable.findMany({
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
  } catch (error) {
    console.error("GET TIMETABLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
};


// ==========================================
// GET SINGLE TIMETABLE
// ==========================================

export const getTimetableById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const timetable = await prisma.timetable.findUnique({
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
};


// ==========================================
// RESCHEDULE CLASS
// ==========================================

export const rescheduleTimetable = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const {
      date,
      startTime,
      endTime,
    } = req.body;

    const timetable = await prisma.timetable.findUnique({
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

    const updatedTimetable =
      await prisma.timetable.update({
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
  } catch (error) {
    console.error("RESCHEDULE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reschedule class",
    });
  }
};

// ==========================================
// CANCEL CLASS
// ==========================================

export const cancelTimetable = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const timetable = await prisma.timetable.findUnique({
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

    const updated = await prisma.timetable.update({
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
  } catch (error) {
    console.error("CANCEL TIMETABLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel class",
    });
  }
};

// ==========================================
// DELETE TIMETABLE
// ==========================================

 export const deleteTimetable = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const timetable = await prisma.timetable.findUnique({
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

    await prisma.timetable.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TIMETABLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete timetable",
    });
  }
};



export const createAnnouncement = async (req:Request , res:Response) =>{
 try {
    const { title , date , time , message } = req.body
       
      if(!title || !date || !time || !message){ 
        return res.json({success:false , 
            messgae:"All fields are required"
        })
      }
       const announcement = await prisma.announcement.create({
        data:{
            title ,
            date,
            time,
            message
        }
       })
       res.json({  success:true   , message:'Announcement Created Successfully' , announcement})

 } catch (error:any) {
    res.json({success:false , message:error.message})
 }
}   

export const getAllAnnouncements = async (req:Request , res:Response)=>{
 try {
    
     const allAnnouncements = await prisma.announcement.findMany({
        orderBy:{
            id:"asc"
        }
     })
      
      res.json({success:true , allAnnouncements})


 } catch (error:any) {
    res.json({success:false , message:error.message})
    
 }
} 


 export const findAnouncementById = async(req:Request , res:Response)=>{
    try {
        
        const {id} = req.params
      
        const announcement = await prisma.announcement.findUnique({
            where:{
                id:Number(id)
            }
        })

        if(!announcement){
        return res.json({success:false , message:"announcement not found"})
     }

     res.json({success:true ,  announcement})


    } catch (error:any) {
    res.json({success:false , message:error.message})
        
    }
 } 

export const deleteannouncement =async (req:Request , res:Response)=>{
  try {
     
    const {id} = req.params
     
    const announcement = await prisma.announcement.findUnique({
        where:{
            id:Number(id)
        }
    })

     if(!announcement){
        return res.json({success:false , message:"announcement not found"})
     }

    const  deleteAnnouncement =  await prisma.announcement.delete({
        where:{
            id:Number(id)
        }
    })

     res.json({success:true , message:"announcement deleted successsfully" , deleteAnnouncement})
  

  } catch (error:any) {
    res.json({success:false , message:error.message})
    
  }
}


export const updateAnnouncement =async(req:Request , res:Response)=>{
    try {

         const { title, date, time, message } = req.body;
        const {id} = req.params
         
        const announcement = await prisma.announcement.findUnique({
            where:{
                id:Number(id)
            }
        })
       
         if(!announcement){
        return res.json({success:false , message:"announcement not found"})
     }

      const updateAnnouncement = await prisma.announcement.update({
        where:{
            id :Number(id),
        } ,
        data:{
            title,
            message,
            date,
            time
        }
      })
          
     res.json({success:true , message:"announcement update successsfully" ,updateAnnouncement})


    } catch (error:any) {
    res.json({success:false , message:error.message})
        
    }
}


//================ QUOTE ==============

export const createQuote = async(req:Request , res:Response)=>{
 try {
    
    const { title , date ,time , quote  } = req.body   

     if(!title || !date || time  || !quote){
       return res.json({success:false , message:"Missing Require fieds"})
     }


      const createQuote = await prisma.quote.create({
        data:{
            title,
            date,
            time,
            quote
        }
      })
      
      res.json({success:true , createQuote , message:"Quote Created Successfully"})

 } catch (error:any) {
     console.log(error)
    res.json({success:false , message:error.message})
    
 }
}


// get quotes 
export const getAllQuotes = async (req:Request , res:Response)=>{
    try {
        
        const quotes = await prisma.quote.findMany({
            orderBy:{
                id:"asc"
            }
        })

      res.json({success:true , quotes })

    } catch (error:any) {
             console.log(error)
    res.json({success:false , message:error.message})
    }
}

// get single quote
export const getSingleQuote = async (req:Request , res:Response) =>{
    try {
        
       const {id} = req.params
       
        const quote = await prisma.quote.findUnique({
            where:{
                id:Number(id)
            }
        })

         if(!quote){
            res.json({success:false , message:"Quoted not found"})
         }

          res.json({success:true , quote})         
         
    } catch (error:any) {
                     console.log(error)
    res.json({success:false , message:error.message})
    } 
}

// delete quote =======

export const updateQuote = async(req:Request , res:Response)=>{
    try {
        
        const {title , date , time , quote} = req.body
         const {id} = req.params

         if(!id){
          return res.json({success:false , message:"Quote Not found"})  
        }

         const updateQuote = await prisma.quote.update({
            where:{
                id:Number(id)
            } ,
            data:{
              title,
              time,
              date,
              quote
            }
         })
 
      res.json({success:true , updateQuote , message:"Quote updated Successfully"})
          

    } catch (error:any) {
                             console.log(error)
    res.json({success:false , message:error.message})
    }
}


// delete quote 
export const deleteQuote = async (req:Request , res:Response)=>{
    try {
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"quote not found"})
         }

         const deleteQuote = await prisma.quote.delete({
            where:{
                id:Number(id)
            }
         })

      res.json({success:true , deleteQuote , message:"Quote deleted Successfully"})

    } catch (error:any) {
        
                             console.log(error)
    res.json({success:false , message:error.message})
    }
}

// add student 

export const addStudent = async(req:Request , res:Response)=>{
    try {
        
        const {name , email , phoneNo , enrollin ,  guardianName ,guardianEmail ,
        guardianPhone , password ,confirmPassword }  = req.body
        
        if(!name || !email || phoneNo || !enrollin || !guardianName || !guardianEmail
            || !guardianPhone || !password || !confirmPassword 
        ){
        return res.json({success:false , message:"Missing Require fieds"})        
        }

             if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }
        
        const student = await prisma.addStudent.create({
            data:{
                name,
                email,
                phoneNo,
                guardianName,
                guardianEmail,
                guardianPhone,
                password,confirmPassword,
                enrollin,
            }
        })

        return res.status(201).json({
      success: true,
      message: "Student added successfully",
      student,
    });

    } catch (error:any) {
       
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}

// ========== getAllStudents =========

export const getAllStudents = async (req:Request , res:Response)=>{
    try {
        
       const students = await prisma.addStudent.findMany({
        orderBy:{
            id:"asc"
        }
       })
        
        res.json({success:true , students})

    } catch (error:any) {
     
     console.log(error)
    return res.json({success:false , message:error.message})    
    }
}


// getSingleStudent ============

export const getSingleStudent = async(req:Request , res:Response)=>{
    try {
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"student not found"})
         }

          const student = await prisma.addStudent.findUnique({
            where:{
                id:Number(id)
            }
          })
         
        res.json({success:true , student})

    } catch (error:any) {
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
} 


// deletestudent ==========

export const deleteStudent  = async(req:Request , res:Response)=>{
    try {
        
        
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"student not found"})
         }

          const delstudent = await prisma.addStudent.delete({
            where:{
                id:Number(id)
            }
          })
         
        res.json({success:true , delstudent, message:"student deletd successfully"})

    } catch (error:any) {
     
     console.log(error)
    return res.json({success:false , message:error.message})    
    }

}

// update student ==========

export const updateStudent = async(req:Request , res:Response)=>{
    try {
        
       
        const {name , email , phoneNo , enrollin ,  guardianName ,guardianEmail ,
        guardianPhone , password ,confirmPassword }  = req.body   
        
        const {id} = req.params

        if(!id){
            return res.json({success:false , message:"student not found"})
         }

         const updatestudent = await prisma.addStudent.update({
            where:{
                id:Number(id)
            },
            data:{
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
         })


                  if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }


        res.json({success:true , updatestudent})
     

    } catch (error:any) {
        
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}

// add parent =======

export const addParent = async(req:Request , res:Response)=>{
    try {
        
        const {name , email , password ,confirmPassword}  = req.body
        
        if(!name || !email  || !password || !confirmPassword 
        ){
        return res.json({success:false , message:"Missing Require fieds"})        
        }

             if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }
        
        const student = await prisma.addParent.create({
            data:{
                name,
                email,
                password,
                confirmPassword,
                role:"PARENT"
            }
        })

        return res.status(201).json({
      success: true,
      message: "Parent added successfully",
      student,
    });

    } catch (error:any) {
       
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}


// get all parents 

export const getAllparents = async (req:Request , res:Response)=>{
    try {
        
       const parent = await prisma.addParent.findMany({
        orderBy:{
            id:"asc"
        }
       })
        
        res.json({success:true ,parent})

    } catch (error:any) {
     
     console.log(error)
    return res.json({success:false , message:error.message})    
    }
}


// get singlearent 


export const getSingleParent = async(req:Request , res:Response)=>{
    try {
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"parent not found"})
         }

          const parent = await prisma.addParent.findUnique({
            where:{
                id:Number(id)
            }
          })
         
        res.json({success:true , parent})

    } catch (error:any) {
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
} 


// =========delete parent 

export const deleteParent  = async(req:Request , res:Response)=>{
    try {
        
        
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"parent id not found"})
         }

          const delparent = await prisma.addParent.delete({
            where:{
                id:Number(id)
            }
          })
         
        res.json({success:true , delparent , message:"deleted successfully"})

    } catch (error:any) {
     
     console.log(error)
    return res.json({success:false , message:error.message})    
    }

}

// update parent ========

export const updateparent = async(req:Request , res:Response)=>{
    try {
        
        const {name , email , password ,confirmPassword}  = req.body
        const {id} = req.params
        
        if(!name || !email  || !password || !confirmPassword 
        ){
        return res.json({success:false , message:"Missing Require fieds"})        
        }

    
        
        const student = await prisma.addParent.update({
            where:{
             id:Number(id)
            },
            data:{
                name,
                email,
                password,
                confirmPassword,
                role:"PARENT"
            }
        })

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

    } catch (error:any) {
       
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}


// add teacher =========

export const addTeacher = async(req:Request , res:Response)=>{
    try {
        
        const {name , email, password  , confirmPassword , qualification , phone} = req.body
        const imageFile = (req as any).file 

         if(!name || !email  || !password || !confirmPassword || !qualification || !phone
        ){
        return res.json({success:false , message:"Missing Require fieds"})        
        }

         if(!imageFile){
         return res.json({success:false , message:"image not found"})        
         }

                      if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

          const uploadImage = cloudnary.uploader.upload(imageFile.path, {folder:"teachers"})
           
          const secureUrl = (await uploadImage).secure_url

         const teacher = await prisma.addTeacher.create({
            data:{
             name,
             email,
             password,
             confirmPassword,
             qualification,
             phone,
             image:secureUrl
            }
         })

            return res.status(201).json({
      success: true,
      message: "Teacher added  successfully",
      teacher,
    });

    } catch (error:any) {
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
        
    }
}


// get all teachers

export const getAllTeachers = async(req:Request , res:Response)=>{
    try {
        
        const allteachers = await prisma.addTeacher.findMany({
            orderBy:{
                id:'asc'
            }
        })

         res.json({success:true , allteachers}) 

    } catch (error:any) {
     
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}


// get single teacher 

export const getTeacherById = async(req:Request , res:Response)=>{
    try {
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"Teacher not found"})
         }

          const teacher = await prisma.addTeacher.findUnique({
            where:{
                id:Number(id)
            }
          })
          
          res.json({success:true , teacher})

    } catch (error:any) {
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}

// delete teacher

export const deleteTeacher  = async(req:Request , res:Response)=>{
    try {
        
        
        
        const {id} = req.params

         if(!id){
            return res.json({success:false , message:"teacher id not found"})
         }

          const delteacher = await prisma.addTeacher.delete({
            where:{
                id:Number(id)
            }
          })
         
        res.json({success:true , delteacher , message:"deleted successfully"})

    } catch (error:any) {
     
     console.log(error)
    return res.json({success:false , message:error.message})    
    }

}

// update teacher

export const updateTeacher = async(req:Request , res:Response)=>{
    try {
        
        const {name , email , password ,confirmPassword , qualification , phone}  = req.body
        const {id} = req.params
        
        if(!name || !email  || !password || !confirmPassword || !qualification || !phone
        ){
        return res.json({success:false , message:"Missing Require fieds"})        
        }

        const student = await prisma.addTeacher.update({
            where:{
             id:Number(id)
            },
            data:{
                name,
                email,
                password,
                confirmPassword,
                qualification , phone,
            }
        })

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

    } catch (error:any) {
       
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}

// cretae class room 

export const createClassRoom = async(req:Request , res:Response)=>{
    try {
         
        const {className, teachers, students} = req.body
         
        if(!className || !teachers || !students){
        return res.json({success:false , message:"All fields are required"})
        }

        const classRoom = await prisma.createNewClass.create({
            data:{
                className,
                students: students || [],
                teachers: teachers || [] 
            }
        })
        
    return res.status(201).json({
      success: true,
      message: "Classroom created successfully",
      classRoom,
    });
         

    } catch (error:any) {
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }
}

// DASHBOARD DATA 
export const getDashboardData = async (req:Request , res:Response)=>{

    try {
        
        const [students , teachers, parents] = await Promise.all([
            prisma.addStudent.count(),
            prisma.addTeacher.count(),
            prisma.addParent.count()
        ]) 

        return res.json({success:true , students, teachers, parents})
        
    } catch (error:any) {
        
     console.log(error)
    return res.json({success:false , message:error.message}) 
    }

}
