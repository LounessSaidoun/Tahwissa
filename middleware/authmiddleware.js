import JWT from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const authHeader = req.headers && req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next("Authentication failed: Missing or invalid authorization header");
  }

  const token = authHeader.split(" ")[1];

  try {
    const userToken = JWT.verify(token, process.env.JWT_SECRET_KEY);

    // Set req.user as a top-level property
    req.user = {
      user_id: userToken.userId,
    };

    // Continue processing
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return next("Authentication failed: Invalid token");
  }
};

export default userAuth;
