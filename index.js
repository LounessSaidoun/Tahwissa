// import express from "express"
// import dotenv from "dotenv"
// import cors from "cors"
// import morgan from "morgan"
// import bodyParser from "body-parser"
// import path from "path";
// //securty packages
// import helmet from "helmet"
// import dbConnection from "./dbConfig/index.js"
// import errorMiddleware from "./middleware/errorMiddleware.js"
// import router from "./routes/index.js"



// dotenv.config()



// const __dirname = path.resolve(path.dirname(""))

// const app = express();
// const PORT = parseInt(process.env.PORT);

// app.use(express.static("public"))
// app.set("view engine","ejs")

// app.set("views", path.join(__dirname, "views"));


// app.use(
//     cors(
//     {
//         origin: process.env.APP_URL,
//         methods:"GET,POST,PUT,DELETE",
//         credentials: true
//     })
// );


// app.use(express.static(path.join(__dirname,"./views")))
// app.use(bodyParser.json());

// app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.json({limit: "10mb"}));
// app.use(express.urlencoded({extended: true}));
// app.use(morgan("dev"))
// app.use(errorMiddleware);
// app.use(router);


// dbConnection();

// //testing google auth


// app.listen(PORT,()=>{
//     console.log(`Server running on port ${PORT}`);
// })


import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan"
import bodyParser from "body-parser"
import path from "path";
import cron from "node-cron"


//configurate the notifications
import http from "http"
import {Server as SocketIO} from "socket.io"
 

//google auth 
import session from 'express-session';
import passport from "passport"
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';




//securty packages
import helmet from "helmet"
import dbConnection from "./dbConfig/index.js"
import errorMiddleware from "./middleware/errorMiddleware.js"
import router from "./routes/index.js"
import Users from "./models/userModel.js"
// import {googleAuthVerification } from "./controllers/authController.js"



dotenv.config()







const __dirname = path.resolve(path.dirname(""))

export const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT);
export const io = new SocketIO(server);




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



app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

dbConnection();

// passport.use(Users.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await Users.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// passport.use(new GoogleStrategy({
//   clientID: process.env.ID_CLIENT,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: process.env.APP_URL+"auth/google/callback",
//   userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
// },
//   googleAuthVerification
// )
// );

io.on('connection', (socket) => {
  console.log('User connected');

  // Handle friend request events
  socket.on('sendFriendRequest', (data) => {
    // Process the friend request and emit a notification event to the recipient
    io.to(data.recipientUserId).emit('friendRequestNotification', { senderUserId: data.senderUserId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});



app.get("/", function(req, res){
  res.send('Hello, this is a test!');
});

app.use(router);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
