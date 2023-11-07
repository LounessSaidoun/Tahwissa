import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import ejs from "ejs"
import morgan from "morgan"
import bodyParser from "body-parser"
import path from "path";
//securty packages
import helmet from "helmet"
import dbConnection from "./dbConfig/index.js"
import errorMiddleware from "./middleware/errorMiddleware.js"
import router from "./routes/index.js"



dotenv.config()





const __dirname = path.resolve(path.dirname(""))

const app = express();
const PORT = parseInt(process.env.PORT);

app.use(express.static("public"))
app.set("view engine","ejs")

app.set("views", path.join(__dirname, "views"));


app.use(
    cors(
    {
        origin: process.env.APP_URL,
        methods:"GET,POST,PUT,DELETE",
        credentials: true
    })
);


app.use(express.static(path.join(__dirname,"./views")))
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"))
app.use(errorMiddleware);
app.use(router);


dbConnection();

//testing google auth


app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})