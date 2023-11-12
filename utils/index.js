import bcrypt from "bcryptjs"
import JWT from "jsonwebtoken"

export const hashString = async (useValue) =>{
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(useValue,salt);
    return hashedPassword;
}

export const compareString = async(userPassword, password) =>{

    const isMatch = await bcrypt.compare(userPassword,password)
    return isMatch

}

//Json WebToken 
export function createJWT(id){
    return JWT.sign({userId: id}, process.env.JWT_SECRET_KEY,{
        expiresIn: "1d",

    })
}


export function verifyJwtToken(token, secretKey) {
    try {
      const decoded = JWT.verify(token, secretKey);
      return decoded;
    } catch (err) {
        console.log(err);
        return null;
    }
  }