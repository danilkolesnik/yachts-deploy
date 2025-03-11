const generateRandomCode = () => {
    const digits = '0123456789';
    let code = '';
  
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      code += digits.charAt(randomIndex);
    }
  
    return code;
  };
  
  export default generateRandomCode;