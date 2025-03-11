const jwt = require('jsonwebtoken');

const getJwt = (token: string) => {
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return null;
  }
};

export default getJwt;