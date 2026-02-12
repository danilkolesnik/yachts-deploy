const generateRandomId = () => {
    const characters = '0123456789';
    const idLength = 30;
  
    let result = '';
    for (let i = 0; i < idLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return result;
  };
  
  export default generateRandomId;