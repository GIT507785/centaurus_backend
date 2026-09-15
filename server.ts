import express , {Request , Response} from "express"
import cors from 'cors'
import adminRouter from "./src/Routes/Admin/adminRoutes"

const app = express()


app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

app.use('/api/admin', adminRouter)

const PORT  = 4000


app.get("/test", (req: Request, res: Response) => {
  console.log("🔥 TEST ROUTE HIT");

  res.json({
    success: true,
    message: "Test route working",
  });
});



app.listen(PORT , ()=>{
    console.log(`server is running on http://localhost:${PORT}`)
})
