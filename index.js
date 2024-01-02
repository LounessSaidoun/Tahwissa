import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan"
import bodyParser from "body-parser"
import path from "path";
import cron from "node-cron"
//import { sendFriendRequest } from "./controllers/friendRequestController.js"

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
import {googleAuthVerification } from "./controllers/authController.js"
import { sendFriendRequest } from "./controllers/friendRequestController.js"
import { verify } from "crypto"
import { Socket } from "socket.io-client"



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
        origin: process.env.ORIGIN_URL,
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

passport.use(Users.createStrategy());

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

passport.use(new GoogleStrategy({
  clientID: process.env.ID_CLIENT,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.APP_URL+"auth/google/callback",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  googleAuthVerification
)
);

io.on('connection', (socket) => {
  socket.on('setUserId', (userId) => {
    socket.userId = userId;
  });

  socket.on('disconnect', () => {
    delete io.sockets.sockets[socket.userId];
  });
});

app.use(router);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
